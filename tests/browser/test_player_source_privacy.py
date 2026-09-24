"""Player privacy boundary on the SOURCE surface, served straight from public/.

`test_player.py` proves the built artifact is stripped, and it must stay that way: dist/
carries a baked `data-audience="player"` plus `!important` hide rules, so it cannot
reproduce this defect. The dev player surface is different — `public/play.html` ships with
no audience attribute and no such CSS, so the boundary rests entirely on the runtime strip
in `player-privacy-v3.js` plus whatever the controller does on its 500ms render.

That is where the bug lived: the strip ran once at load, then `glyph-game-v3.js` re-showed
`#aha-list` and its panel head on the first render after an Aha entered the save. A player
on `/` saw "AHA MOMENTS · 28" and an `A01 · …` card. Serving `public/` resets the exact
bytes and scripts the dev server hands the iframe, so this file pins that surface.

Run: GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player
"""
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import os
import re
import unittest
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
ARTIFACTS = ROOT / "test-results" / (os.environ.get("GLYPH_BROWSER", "chromium") + "-source-privacy")
FIXED = datetime(2026, 9, 20, 12, 0, tzinfo=timezone.utc)
# Same boundary as test_player.py: Aha IDs, the AHA heading, act framing, Director Mode.
META_COPY = re.compile(r"\bA(?:0[1-9]|1[0-9]|2[0-8])\b|\bAHA\b|\bACT\s+(?:[IVX]+|\d)|Director Mode|导演模式|ACTS ENGINE", re.I)
# Surfaces the privacy layer removes for the player audience.
BOUNDARY = ("#director-toggle", "#director", ".aha-focus", "#aha-list",
            ".panel-head:has(#aha-count)", "#act-strip", ".act-kicker", ".act-title",
            ".act-copy", ".eyebrow", "#systems-note")
# The two lines that together made the defect possible. Each control asserts its needle
# is present before mutating, so a rename fails the test instead of silently passing.
ENGINE_GATE = "const showAhaHistory=hasAhaHistory && !playerAudience;"
ENGINE_GATE_OFF = "const showAhaHistory=hasAhaHistory;"
PRIVACY_REASSERT = "assertPlayerBoundary(); // a timer render must not undo the strip applied above"
PRIVACY_REASSERT_OFF = "void 0; // a timer render must not undo the strip applied above"


class SourceHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def do_GET(self):
        if urlsplit(self.path).path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        super().do_GET()

    def list_directory(self, _path):
        self.send_error(404)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class PlayerSourcePrivacy(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (PUBLIC / "play.html").is_file():
            raise RuntimeError("public/play.html is missing")
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        cls.engine_source = (PUBLIC / "glyph-game-v3.js").read_text()
        cls.privacy_source = (PUBLIC / "player-privacy-v3.js").read_text()
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SourceHandler, directory=str(PUBLIC)))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
        cls.pw = sync_playwright().start()
        name = os.environ.get("GLYPH_BROWSER", "chromium")
        if name not in ("chromium", "webkit"):
            raise ValueError(f"Unsupported GLYPH_BROWSER: {name}")
        cls.browser = getattr(cls.pw, name).launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join(timeout=5)

    def setUp(self):
        self.errors = []
        self.context = self.browser.new_context(
            locale="zh-CN", viewport={"width": 390, "height": 844},
            reduced_motion="reduce", timezone_id="Asia/Shanghai",
        )
        self.context.tracing.start(screenshots=True, snapshots=True, sources=True)
        self.page = self.context.new_page()
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.on("console", lambda message: self.errors.append(message.text) if message.type == "error" else None)
        self.page.on("requestfailed", lambda request: self.errors.append(f"{request.url}: {request.failure}"))
        self.page.clock.install(time=FIXED)
        self.page.clock.pause_at(FIXED + timedelta(seconds=1))
        self.page.set_default_timeout(5000)

    def tearDown(self):
        try:
            self.page.clock.run_for(2000)
            self.assertEqual(self.errors, [], "Uncaught browser/console/network error")
        finally:
            try:
                if self.page.url != "about:blank":
                    self.page.screenshot(path=str(ARTIFACTS / f"{self._testMethodName}.png"), full_page=True)
                self.context.tracing.stop(path=str(ARTIFACTS / f"{self._testMethodName}.zip"))
            finally:
                self.context.close()

    # ------------------------------------------------------------------ helpers
    def mutate(self, source, needle, replacement):
        self.assertIn(needle, source, "control needle moved; update this test with the code")
        return source.replace(needle, replacement, 1)

    def open(self, query=""):
        response = self.page.goto(f"{self.origin}/play.html{query}", wait_until="networkidle")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("html")).to_have_attribute("data-audience", "player")
        expect(self.page.locator("#primary-actions button").first).to_be_visible()

    def button(self, label):
        return self.page.get_by_role("button", name=re.compile(re.escape(label)))

    def drive_to_first_aha(self, page):
        """Drive the real ACT I path until A01 (keyboards >= 1) actually fires."""
        for _ in range(6):
            page.locator('#primary-actions button[data-command="print"]').click()
            page.locator('#primary-actions button[data-command="print"]').click()
            page.locator('#primary-actions button[data-command="sell"]').click()
            machine = page.locator(".machine").filter(has_text="机械键盘")
            if machine.count() and machine.get_by_role("button", name="购买").is_enabled():
                machine.get_by_role("button", name="购买").click()
                return
        self.fail("A01 was never reachable through the real ACT I path")

    def assert_boundary_holds(self):
        """The user-visible contract: nothing the privacy layer removed is on screen."""
        self.assertNotRegex(self.page.locator("body").inner_text(), META_COPY)
        self.assertNotRegex(self.page.locator("body").aria_snapshot(), META_COPY)
        for selector in BOUNDARY:
            nodes = self.page.locator(selector)
            # Every marked node must still be in the DOM (the privacy layer hides rather
            # than removes) and hidden. Requiring presence keeps this from passing vacuously.
            count = nodes.count()
            self.assertGreater(count, 0, f"{selector} is absent; the boundary check proved nothing")
            for index in range(count):
                expect(nodes.nth(index)).to_be_hidden()

    # -------------------------------------------------------------------- tests
    def test_first_aha_does_not_restore_the_disclosure_panel(self):
        """The original defect: first Aha lands, next timer render re-shows the panel."""
        self.open()
        self.page.clock.run_for(1000)
        self.assert_boundary_holds()

        self.drive_to_first_aha(self.page)
        # The engine records the Aha, then renders on the NEXT tick — that render was the leak.
        self.page.clock.run_for(3000)
        self.assertTrue(
            self.page.evaluate("() => JSON.parse(localStorage.getItem('glyph-factory-save-v3')).ahaSeen.includes('A01')"),
            "A01 never entered the save, so this test proved nothing",
        )
        self.assert_boundary_holds()

        # A saved Aha survives reload, so a fresh load must re-render the panel hidden too.
        self.page.reload(wait_until="networkidle")
        self.page.clock.run_for(3000)
        self.assert_boundary_holds()

    def test_privacy_layer_alone_survives_an_engine_regression(self):
        """Insurance: with the engine gate removed, the runtime strip still holds."""
        mutated = self.mutate(self.engine_source, ENGINE_GATE, ENGINE_GATE_OFF)
        with self.browser.new_context(locale="zh-CN") as control:
            control.route("**/glyph-game-v3.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=mutated))
            page = control.new_page()
            page.clock.install(time=FIXED)
            page.clock.pause_at(FIXED + timedelta(seconds=1))
            page.goto(self.origin + "/play.html", wait_until="networkidle")
            expect(page.locator("#primary-actions button").first).to_be_visible()
            self.drive_to_first_aha(page)
            page.clock.run_for(3000)
            expect(page.locator("#aha-list")).to_be_hidden()
            self.assertNotRegex(page.locator("body").inner_text(), META_COPY)

    def test_detector_rejects_the_pre_fix_privacy_boundary(self):
        """Negative control: restore both pre-fix behaviors and require the leak to show.

        Without this the assertions above could be vacuous — a page that never renders an
        Aha panel would pass them for the wrong reason.
        """
        engine = self.mutate(self.engine_source, ENGINE_GATE, ENGINE_GATE_OFF)
        privacy = self.mutate(self.privacy_source, PRIVACY_REASSERT, PRIVACY_REASSERT_OFF)
        with self.browser.new_context(locale="zh-CN") as control:
            control.route("**/glyph-game-v3.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=engine))
            control.route("**/player-privacy-v3.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=privacy))
            page = control.new_page()
            page.clock.install(time=FIXED)
            page.clock.pause_at(FIXED + timedelta(seconds=1))
            page.set_default_timeout(5000)
            page.goto(self.origin + "/play.html", wait_until="networkidle")
            expect(page.locator("#primary-actions button").first).to_be_visible()
            self.drive_to_first_aha(page)
            page.clock.run_for(3000)
            expect(page.locator("#aha-list")).to_be_visible()
            expect(page.locator("#aha-list .aha-item")).to_have_count(1)
            self.assertRegex(page.locator("body").inner_text(), META_COPY)


if __name__ == "__main__":
    unittest.main(verbosity=2)
