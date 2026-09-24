"""PostHog error tracking on a player build that has a project token.

The production bundle is the static `dist/` (not the Next.js app in `src/`), so the tracker is
injected by `scripts/build-static.mjs`, and only when `POSTHOG_PROJECT_TOKEN` is set. The
default build that every other suite serves carries no telemetry, which those suites already
enforce: any request that fails, including one to an unreachable tracker, fails their teardown.

This file builds a second bundle WITH a token into a temporary directory and serves the real
PostHog CDN loader from `node_modules/posthog-js/dist/` (a pinned devDependency) through
`context.route`, so nothing leaves the machine. It proves the chain end to end: the loader
initialises from the `_i` queue, an error thrown while the game boots (before the loader has
arrived) is buffered and sent, a later runtime error is sent, and the player surface is not
changed by any of it.

Run: GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.parse import urlsplit
import gzip
import json
import os
import shutil
import subprocess
import tempfile
import unittest

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
POSTHOG_DIST = ROOT / "node_modules" / "posthog-js" / "dist"
TOKEN = "phc_telemetryContractProbe"
HOST = "https://us.i.posthog.com"
ASSETS = "https://us-assets.i.posthog.com"
BOOT_PROBE = "glyph-telemetry-boot-probe"
RUNTIME_PROBE = "glyph-telemetry-runtime-probe"
PLAYER_UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) "
             "Chrome/141.0.0.0 Safari/537.36")


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def decode_events(body, url):
    """PostHog batches events as JSON, gzip-compressed JSON, or base64 form data."""
    if not body:
        return []
    raw = body
    if "compression=gzip" in url or raw[:2] == b"\x1f\x8b":
        raw = gzip.decompress(raw)
    text = raw.decode("utf-8", "replace")
    if text.startswith("data="):
        import base64
        from urllib.parse import unquote
        text = base64.b64decode(unquote(text[5:])).decode("utf-8", "replace")
    try:
        payload = json.loads(text)
    except ValueError:
        return []
    if isinstance(payload, dict):
        payload = payload.get("batch", [payload])
    return [event for event in payload if isinstance(event, dict)]


class TelemetryContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (POSTHOG_DIST / "array.js").is_file():
            raise RuntimeError("Install dev dependencies first: npm ci (posthog-js supplies the CDN loader)")
        cls.fixture = Path(tempfile.mkdtemp(prefix="glyph-telemetry-"))
        shutil.copytree(ROOT / "scripts", cls.fixture / "scripts")
        shutil.copytree(ROOT / "public", cls.fixture / "public")
        env = {**os.environ, "POSTHOG_PROJECT_TOKEN": TOKEN, "POSTHOG_HOST": HOST}
        subprocess.run(["node", "scripts/build-static.mjs"], cwd=cls.fixture, env=env, check=True,
                       capture_output=True, timeout=60)
        cls.dist = cls.fixture / "dist"
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(cls.dist)))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
        cls.pw = sync_playwright().start()
        name = os.environ.get("GLYPH_BROWSER", "chromium")
        cls.browser = getattr(cls.pw, name).launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)
        shutil.rmtree(cls.fixture, ignore_errors=True)

    def setUp(self):
        self.events = []
        self.page_errors = []
        self.unexpected = []
        # PostHog drops events from browsers it classifies as bots, and headless Chromium says
        # `HeadlessChrome` in its UA. A real player never does, so present an ordinary browser UA; without
        # this the suite would "prove" that nothing is ever sent.
        self.context = self.browser.new_context(locale="zh-CN", viewport={"width": 390, "height": 844},
                                                user_agent=PLAYER_UA)
        # Its bot check also reads navigator.webdriver (set by every automated browser) and the
        # userAgentData brands (headless Chromium lists `HeadlessChrome` there too).
        self.context.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => false});"
                                     "Object.defineProperty(navigator, 'userAgentData', {get: () => undefined});")

        def assets(route):
            path = urlsplit(route.request.url).path
            # Remote config is per project and lives on PostHog; an empty one keeps the local
            # init options in charge, which is what this contract is about.
            if path == f"/array/{TOKEN}/config":
                return route.fulfill(status=200, body="{}", content_type="application/json",
                                     headers={"Access-Control-Allow-Origin": "*"})
            if path == f"/array/{TOKEN}/config.js":
                return route.fulfill(status=200, body="", content_type="application/javascript",
                                     headers={"Access-Control-Allow-Origin": "*"})
            file = POSTHOG_DIST / Path(path).name
            if not path.startswith("/static/") or not file.is_file():
                self.unexpected.append(route.request.url)
                return route.fulfill(status=404, body="")
            return route.fulfill(status=200, body=file.read_bytes(), content_type="application/javascript",
                                 headers={"Access-Control-Allow-Origin": "*"})

        def ingest(route):
            request = route.request
            self.events.extend(decode_events(request.post_data_buffer, request.url))
            return route.fulfill(status=200, body="{}", content_type="application/json",
                                 headers={"Access-Control-Allow-Origin": "*"})

        def engine_with_boot_error(route):
            source = (self.dist / "glyph-game-v3.js").read_text()
            # Throw from a timer queued while the controller boots: the game keeps running, and
            # the error lands before the async PostHog loader has had a chance to arrive.
            probe = f"\nsetTimeout(function(){{throw new Error('{BOOT_PROBE}')}},0);\n"
            return route.fulfill(status=200, body=source + probe, content_type="application/javascript")

        self.context.route(f"{ASSETS}/**", assets)
        self.context.route(f"{HOST}/**", ingest)
        self.context.route("**/glyph-game-v3.js", engine_with_boot_error)
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.page_errors.append(str(error)))
        self.page.set_default_timeout(10000)

    def tearDown(self):
        self.context.close()

    def exceptions(self):
        found = []
        for event in self.events:
            if event.get("event") != "$exception":
                continue
            properties = event.get("properties", {})
            values = properties.get("$exception_list") or []
            messages = [item.get("value", "") for item in values if isinstance(item, dict)]
            messages.append(properties.get("$exception_message", ""))
            found.append((properties, " ".join(m for m in messages if m)))
        return found

    def wait_for_exception(self, needle):
        for _ in range(100):
            if any(needle in text for _, text in self.exceptions()):
                return
            self.page.wait_for_timeout(100)
        self.fail(f"no $exception carrying {needle!r}; events seen: {[e.get('event') for e in self.events]}")

    def test_build_without_token_carries_no_telemetry(self):
        default = subprocess.run(["node", "scripts/build-static.mjs"], cwd=self.fixture,
                                 env={k: v for k, v in os.environ.items() if not k.startswith("POSTHOG_")},
                                 capture_output=True, timeout=60)
        self.assertEqual(default.returncode, 0, default.stderr)
        try:
            for file in self.dist.iterdir():
                self.assertNotIn(b"posthog", file.read_bytes().lower(), file.name)
            self.assertEqual(json.loads((self.dist / "build.json").read_text())["telemetry"], "none")
        finally:
            env = {**os.environ, "POSTHOG_PROJECT_TOKEN": TOKEN, "POSTHOG_HOST": HOST}
            subprocess.run(["node", "scripts/build-static.mjs"], cwd=self.fixture, env=env, check=True,
                           capture_output=True, timeout=60)

    def test_boot_and_runtime_errors_reach_posthog_and_the_game_still_plays(self):
        self.page.goto(f"{self.origin}/")
        self.assertEqual(json.loads((self.dist / "build.json").read_text())["telemetry"], "posthog")
        # The boot probe fired as an uncaught error; the player surface is still the game.
        self.page.wait_for_function("() => !!window.posthog && window.posthog.__loaded === true")
        self.wait_for_exception(BOOT_PROBE)
        self.page.evaluate(f"() => setTimeout(() => {{ throw new Error('{RUNTIME_PROBE}') }}, 0)")
        self.wait_for_exception(RUNTIME_PROBE)
        properties = [p for p, text in self.exceptions() if RUNTIME_PROBE in text][0]
        self.assertEqual(properties.get("token"), TOKEN)
        self.assertEqual(properties.get("app"), "glyph-factory")
        self.assertEqual(sorted(e for e in self.page_errors if "probe" not in e), [])
        self.assertEqual(self.unexpected, [])
        # Minimal on purpose: no autocapture, no recording, nothing persisted next to the save.
        config = self.page.evaluate("""() => ({
          autocapture: window.posthog.config.autocapture,
          recording: window.posthog.config.disable_session_recording,
          persistence: window.posthog.config.persistence,
          keys: Object.keys(localStorage).filter(k => /ph_|posthog/i.test(k)),
          cookies: document.cookie,
        })""")
        self.assertEqual(config["autocapture"], False)
        self.assertEqual(config["recording"], True)
        self.assertEqual(config["persistence"], "memory")
        self.assertEqual(config["keys"], [])
        self.assertNotIn("ph_", config["cookies"])
        self.assertFalse([e for e in self.events if e.get("event") == "$autocapture"])
        # The game itself still works: printing a glyph changes the counter.
        before = self.page.locator("#glyphs").inner_text()
        self.page.locator('[data-command="print"]').first.click()
        self.page.wait_for_function(f"() => document.querySelector('#glyphs').innerText !== {json.dumps(before)}")


if __name__ == "__main__":
    unittest.main()
