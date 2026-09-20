"""Player-contract tests against dist/, never public/ or a Director preview.

Run: python3 -m unittest discover -s tests/browser -p 'test_*.py' -v
Use GLYPH_BROWSER=webkit for the second CI browser. Each test gets a clean
browser context, controlled clock, real storage and real production scripts.
"""
from datetime import datetime, timedelta, timezone
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
import json
import os
import re
import unittest
from urllib.parse import urlsplit

from playwright.sync_api import Error as PlaywrightError, expect, sync_playwright

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"
ARTIFACTS = ROOT / "test-results" / os.environ.get("GLYPH_BROWSER", "chromium")
SAVE = "glyph-factory-save-v3"
REVEALS = "glyph-factory-ui-reveals-v3"
FIXED = datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)
META_COPY = re.compile(r"\bA(?:0[1-9]|1[0-9]|2[0-8])\b|\bAHA\b|\bACT\s+(?:[IVX]+|\d)|Director Mode|导演模式|ACTS ENGINE", re.I)


class PlayerHandler(SimpleHTTPRequestHandler):
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


class PlayerContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not (DIST / "build.json").is_file():
            raise RuntimeError("Build the player bundle first: node scripts/build-static.mjs")
        manifest = json.loads((DIST / "build.json").read_text())
        if manifest.get("playerSpoilers") is not False:
            raise RuntimeError("Refusing to test a review build as a player build")
        ARTIFACTS.mkdir(parents=True, exist_ok=True)
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), partial(PlayerHandler, directory=str(DIST)))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.origin = f"http://127.0.0.1:{cls.server.server_port}"
        cls.pw = sync_playwright().start()
        name = os.environ.get("GLYPH_BROWSER", "chromium")
        if name not in ("chromium", "webkit"):
            raise ValueError(f"Unsupported GLYPH_BROWSER: {name}")
        options = {"headless": True}
        if os.environ.get("GLYPH_BROWSER_EXECUTABLE"):
            options["executable_path"] = os.environ["GLYPH_BROWSER_EXECUTABLE"]
        cls.browser = getattr(cls.pw, name).launch(**options)

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
        self.context.add_init_script("""(() => {
          const next = sessionStorage.getItem('next-state-fixture');
          if (!next) return;
          sessionStorage.removeItem('next-state-fixture');
          const state = JSON.parse(next);
          state.updatedAt = Date.now();
          localStorage.setItem('glyph-factory-save-v3', JSON.stringify(state));
        })();""")
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
            # The original regression happened on the NEXT timer render, not at load.
            self.page.clock.run_for(1500)
            self.assertEqual(self.errors, [], "Uncaught browser/console/network error")
        finally:
            try:
                if self.page.url != "about:blank":
                    self.page.screenshot(path=str(ARTIFACTS / f"{self._testMethodName}.png"), full_page=True)
                self.context.tracing.stop(path=str(ARTIFACTS / f"{self._testMethodName}.zip"))
            finally:
                self.context.close()

    def open(self, query=""):
        response = self.page.goto(f"{self.origin}/play.html{query}", wait_until="networkidle")
        self.assertEqual(response.status, 200)
        expect(self.page.locator("html")).to_have_attribute("data-audience", "player")
        expect(self.page.locator("#primary-actions button").first).to_be_visible()

    def seed(self, state, key=SAVE):
        # Install once, not on every reload. Otherwise persistence tests give false greens.
        script = """(() => {
          if (sessionStorage.getItem('fixture-installed')) return;
          sessionStorage.setItem('fixture-installed', '1');
          const value = DATA;
          if (value && typeof value === 'object') value.updatedAt = Date.now();
          localStorage.setItem(KEY, typeof value === 'string' ? value : JSON.stringify(value));
        })();"""
        self.context.add_init_script(script.replace("DATA", json.dumps(state, ensure_ascii=False)).replace("KEY", json.dumps(key)))

    def button(self, label):
        return self.page.get_by_role("button", name=re.compile(re.escape(label)))

    def assert_no_spoilers(self):
        self.assertNotRegex(self.page.locator("body").inner_text(), META_COPY)
        self.assertNotRegex(self.page.locator("body").aria_snapshot(), META_COPY)
        expect(self.page.locator("#director")).to_be_hidden()
        expect(self.page.locator(".aha-focus")).to_be_hidden()
        expect(self.page.locator("#act-strip")).to_be_hidden()
        expect(self.page.get_by_role("link", name=re.compile("预览|Preview"))).to_have_count(0)

    def test_fresh_game_is_small_and_survives_timer_renders(self):
        self.open()
        expect(self.page.locator("#primary-actions button")).to_have_count(1)
        for selector in ("#world-card", "#machines", "#systems-title", "#systems-panel"):
            expect(self.page.locator(selector)).to_be_hidden()
        expect(self.page.locator("#hero-layout")).to_have_class(re.compile(r"\bsingle\b"))
        expect(self.page.locator("#below-layout")).to_have_class(re.compile(r"\bsingle\b"))
        for metric in ("credits", "meaning", "noise"):
            expect(self.page.locator(f"#{metric}").locator("..")).to_be_hidden()
        self.page.clock.run_for(3000)
        self.button("印字").click()
        expect(self.page.locator("#glyphs")).to_have_text("1")
        self.assert_no_spoilers()

    def test_layout_expands_only_when_world_is_discovered(self):
        self.seed({"version": 3, "act": 2, "published": True, "glyphs": 30, "readers": 50})
        self.open()
        expect(self.page.locator("#world-card")).to_be_hidden()
        expect(self.page.locator("#hero-layout")).to_have_class(re.compile(r"\bsingle\b"))
        expect(self.page.locator("#systems-panel")).to_be_hidden()
        expect(self.page.locator("#below-layout")).to_have_class(re.compile(r"\bsingle\b"))

        self.page.evaluate("""() => {
          const state = {...window.GlyphEngineV3.fresh(), version:3, act:3, published:true,
            districts:2, worldScale:1, meaning:25};
          sessionStorage.setItem('next-state-fixture', JSON.stringify(state));
        }""")
        self.page.reload()
        expect(self.page.locator("#world-card")).to_be_visible()
        expect(self.page.locator("#hero-layout")).not_to_have_class(re.compile(r"\bsingle\b"))
        self.assert_no_spoilers()

    def test_sell_stays_visible_disabled_and_persistent_after_zero_and_reload(self):
        self.open()
        self.button("印字").click()
        self.button("出售全部库存").click()
        expect(self.page.locator("#glyphs")).to_have_text("0")
        expect(self.button("出售全部库存")).to_be_visible()
        expect(self.button("出售全部库存")).to_be_disabled()
        self.page.reload()
        expect(self.button("出售全部库存")).to_be_visible()
        expect(self.button("出售全部库存")).to_be_disabled()
        self.button("印字").click()
        expect(self.button("出售全部库存")).to_be_enabled()

    def test_machine_and_credits_remain_after_spending_last_money(self):
        self.open()
        for _ in range(10):
            self.button("印字").click()
        self.button("出售全部库存").click()
        machine = self.page.locator(".machine").filter(has_text="机械键盘")
        expect(machine).to_be_visible()
        machine.get_by_role("button", name="购买").click()
        expect(self.page.locator("#credits")).to_have_text("0")
        expect(self.page.locator("#credits").locator("..")).to_be_visible()
        expect(machine.get_by_role("button", name="购买")).to_be_disabled()
        self.page.reload()
        expect(machine).to_be_visible()
        expect(machine.get_by_role("button", name="购买")).to_be_disabled()
        self.page.clock.run_for(2000)
        self.assertGreater(float(self.page.locator("#glyphs").inner_text()), 0)
        self.assert_no_spoilers()

    def test_meaning_resource_and_action_remain_at_zero(self):
        self.seed({"version": 3, "act": 3, "published": True, "meaning": 25, "districts": 2, "worldScale": 1})
        self.open()
        self.button("创造一个概念").click()
        expect(self.page.locator("#meaning")).to_have_text("0")
        expect(self.page.locator("#meaning").locator("..")).to_be_visible()
        expect(self.button("创造一个概念")).to_be_disabled()
        self.page.reload()
        expect(self.button("创造一个概念")).to_be_visible()
        expect(self.button("创造一个概念")).to_be_disabled()
        expect(self.page.locator("#meaning").locator("..")).to_be_visible()

    def test_noise_box_and_delete_action_remain_at_zero(self):
        self.seed({"version": 3, "act": 2, "published": True, "noise": 1})
        self.open()
        self.button("删除噪音").click()
        expect(self.page.locator("#noise")).to_have_text("0")
        expect(self.button("删除噪音")).to_be_disabled()
        expect(self.page.locator("#noise").locator("..")).to_be_visible()
        self.page.reload()
        expect(self.button("删除噪音")).to_be_visible()
        expect(self.page.locator("#noise").locator("..")).to_be_visible()

    def test_reset_clears_progress_and_discovery_history(self):
        self.open()
        self.button("印字").click()
        self.button("出售全部库存").click()
        self.page.once("dialog", lambda dialog: dialog.accept())
        self.button("重新开始").click()
        expect(self.page.locator("#glyphs")).to_have_text("0")
        expect(self.button("出售全部库存")).to_have_count(0)
        self.page.reload()
        expect(self.button("出售全部库存")).to_have_count(0)
        self.assertNotIn("action:sell", self.page.evaluate(f"JSON.parse(localStorage.getItem('{REVEALS}') || '[]')"))

    def test_corrupt_storage_recovers_to_a_playable_game(self):
        self.seed("{broken-json")
        self.context.add_init_script(f"localStorage.setItem('{REVEALS}', '{{broken-json');")
        self.open()
        self.button("印字").click()
        expect(self.page.locator("#glyphs")).to_have_text("1")
        self.button("出售全部库存").click()
        expect(self.button("出售全部库存")).to_be_disabled()

    def test_blocked_storage_does_not_crash_or_claim_saved(self):
        self.context.add_init_script("Object.defineProperty(window, 'localStorage', {get(){throw new DOMException('Blocked', 'SecurityError')}});")
        self.open()
        self.button("印字").click()
        expect(self.page.locator("#glyphs")).to_have_text("1")
        expect(self.page.locator("#save-status")).to_contain_text("阻止存档")
        self.button("出售全部库存").click()
        expect(self.button("出售全部库存")).to_be_disabled()

    def test_legacy_save_migrates_without_losing_resources(self):
        self.seed({"glyphs": 4, "credits": 3, "lifetimeGlyphs": 14}, key="glyph-factory-save-v1")
        self.open()
        expect(self.page.locator("#glyphs")).to_have_text("4")
        expect(self.page.locator("#credits")).to_have_text("3")
        self.assertEqual(self.page.evaluate(f"JSON.parse(localStorage.getItem('{SAVE}')).version"), 3)
        self.page.reload()
        expect(self.page.locator("#glyphs")).to_have_text("4")
        expect(self.page.locator("#credits")).to_have_text("3")

    def test_language_switch_and_keyboard_input_survive_reload(self):
        self.open()
        self.button("印字").press("Enter")
        expect(self.page.locator("#glyphs")).to_have_text("1")
        self.page.locator("#lang-toggle").click()
        expect(self.page.locator("html")).to_have_attribute("lang", "en")
        expect(self.button("Print glyphs")).to_be_visible()
        self.page.reload()
        expect(self.page.locator("html")).to_have_attribute("lang", "en")
        self.page.locator("#lang-toggle").click()
        expect(self.page.locator("html")).to_have_attribute("lang", "zh-CN")
        expect(self.button("印字")).to_be_visible()
        self.assert_no_spoilers()

    def test_production_query_parameters_cannot_enable_designer_mode(self):
        self.open("?director=1&review=1")
        self.page.clock.run_for(1500)
        self.assert_no_spoilers()
        self.button("印字").click()
        expect(self.page.locator("#glyphs")).to_have_text("1")

    def test_every_stage_renders_without_internal_roadmap_or_errors(self):
        self.open()
        for stage in range(1, 7):
            with self.subTest(stage=stage):
                self.page.evaluate("""({key, stage}) => {
                  const state = {...window.GlyphEngineV3.fresh(), act:stage,
                    published:stage>1, glyphs:30, meaning:25, noise:5};
                  sessionStorage.setItem('next-state-fixture', JSON.stringify(state));
                }""", {"key": SAVE, "stage": stage})
                self.page.reload()
                self.assertEqual(self.page.evaluate("JSON.parse(localStorage.getItem('glyph-factory-save-v3')).act"), stage)
                self.page.clock.run_for(1000)
                self.assert_no_spoilers()
                self.assertEqual(self.errors, [])

    def test_internal_review_routes_are_not_in_player_artifact(self):
        self.open()
        for path in ("/aha.html", "/aha.md", "/aha-lab/", "/review/play.html", "/aha-review-contract.js", "/aha-review-ui.js", "/intent.html", "/preview.html", "/eli5-aha.html", "/glyph-factory-v3-preview.webm", "/docs/design/aha-moments-internal.zh-CN.md"):
            with self.subTest(path=path):
                self.assertEqual(self.context.request.get(self.origin + path).status, 404)
        self.assertEqual(self.context.request.get(self.origin + "/").status, 200)

    def test_mobile_layout_does_not_overflow(self):
        self.page.set_viewport_size({"width": 360, "height": 780})
        self.open()
        self.button("印字").click()
        self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth - innerWidth"), 1)
        for label in ("印字", "出售全部库存", "重新开始", "导出存档"):
            expect(self.button(label)).to_be_visible()

    def test_intent_single_discovery_uses_available_width(self):
        for width in (390, 1280):
            with self.subTest(width=width):
                self.page.set_viewport_size({"width": width, "height": 900})
                self.open()
                for parent, child in ((".metrics", ".metric.primary"), ("#primary-actions", "button")):
                    widths = self.page.locator(parent).evaluate("(el, child) => [el.clientWidth, el.querySelector(child).getBoundingClientRect().width]", child)
                    self.assertLessEqual(abs(widths[0] - widths[1]), 2, f"{parent} leaves an undiscovered empty column")

    def test_intent_digital_publishing_replaces_inventory(self):
        self.seed({"version":3,"act":4,"published":True,"agents":5,"agentFactories":1,"glyphs":30,"meaning":100})
        self.open()
        expect(self.page.locator("#glyphs").locator("..")).to_be_visible()
        self.button("切换数字出版").click()
        expect(self.page.locator("#glyphs").locator("..")).to_be_hidden()
        self.page.reload(wait_until="networkidle")
        expect(self.page.locator("#glyphs").locator("..")).to_be_hidden()
        self.assert_no_spoilers()

    def test_intent_stop_is_terminal_in_the_actual_ui(self):
        self.seed({"version":3,"act":6,"published":True,"infrastructure":True,"compressedMeaning":10000,"deletedNoise":500,"noise":1000,"ambiguity":100,"keyboards":1})
        self.open()
        expect(self.button("停止印刷")).to_have_count(0)
        self.button("删除噪音").click()
        self.button("停止印刷").click()
        expect(self.page.locator("#ending")).to_be_visible()
        expect(self.page.locator("#rate")).to_have_text("0")
        self.assertEqual(self.page.locator("#primary-actions button:enabled").count(), 0, "Terminal UI still offers productive actions")
        before = self.page.evaluate(f"JSON.parse(localStorage.getItem('{SAVE}')).glyphs")
        self.page.clock.run_for(10000)
        self.page.keyboard.press("Space")
        self.page.reload(wait_until="networkidle")
        self.assertEqual(self.page.evaluate(f"JSON.parse(localStorage.getItem('{SAVE}')).glyphs"), before)
        self.assert_no_spoilers()

    def test_detector_rejects_original_removed_node_regression(self):
        # Negative control: deliberately reintroduce the exact removed-node defect
        # in an isolated browser context. The real player tests never allow errors.
        source = (DIST / "player-privacy-v3.js").read_text()
        # Poison the hide() helper itself, so the boundary nodes are deleted rather than
        # hidden. The controller still calls textContent on them on its next timer render.
        needle = "node.hidden = true;\n    node.setAttribute('aria-hidden', 'true');"
        self.assertIn(needle, source)
        mutated = source.replace(needle, "node.remove();", 1)
        with self.browser.new_context(locale="zh-CN") as control:
            control.route("**/player-privacy-v3.js", lambda route: route.fulfill(status=200, content_type="application/javascript", body=mutated))
            page = control.new_page()
            page.clock.install(time=FIXED)
            page.clock.pause_at(FIXED + timedelta(seconds=1))
            page.goto(self.origin + "/play.html")
            # Clock.run_for propagates timer exceptions directly, rather than
            # emitting pageerror. Require the specific original failure; a
            # missing browser, unrelated failure or successful tick must fail.
            with self.assertRaisesRegex(PlaywrightError, "textContent"):
                page.clock.run_for(1500)


if __name__ == "__main__":
    unittest.main(verbosity=2)
