"""Verify the deployed game, never injecting a fix or touching existing saves.

Requires playwright==1.57.0 and Chromium. Run with --url for a preview.
A green deployment status is not a passing browser acceptance test.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright, expect

PRODUCTION = "https://hardtofind-qualified-subweb--nyn5255.replit.app/"
ZH_ACTION = re.compile(r"(?:铸造|锻造|生成|制作)\s*(?:字符|字形|符文)")
EN_ACTION = re.compile(r"forge glyph", re.I)
RESOURCE_JS = r"""() => {
  const visible = e => e.getClientRects().length > 0;
  const label = [...document.querySelectorAll('body *')].find(e =>
    visible(e) && e.children.length === 0 && /^(Resources|资源)$/i.test(e.textContent.trim()));
  if (!label) return null;
  let parent = label.parentElement;
  for (let level = 0; parent && level < 4; level++, parent = parent.parentElement) {
    const candidates = [...parent.querySelectorAll('*')].filter(e =>
      visible(e) && e.children.length === 0 && /^\d[\d,]*(\.\d+)?$/.test(e.textContent.trim()));
    if (candidates.length) return Number(candidates[0].textContent.trim().replaceAll(',', ''));
  }
  return null;
}"""


def resource(page) -> float:
    page.wait_for_function(f"() => ({RESOURCE_JS})() !== null", timeout=10000)
    return page.evaluate(RESOURCE_JS)


def visible_switch(page, width: int) -> None:
    """Reject offscreen or covered controls instead of scrolling them into view."""
    for name in ("简体中文", "English"):
        button = page.get_by_role("button", name=name, exact=True)
        expect(button).to_be_visible(timeout=15000)
        box = button.bounding_box()
        assert box and box["x"] >= 0 and box["y"] >= 0, f"{name} is offscreen"
        assert box["x"] + box["width"] <= width + 1, f"{name} overflows phone width"
        assert box["y"] + box["height"] <= page.viewport_size["height"], f"{name} needs scrolling"
        assert button.evaluate("""e => {
          const b = e.getBoundingClientRect();
          return e.contains(document.elementFromPoint(b.x + b.width/2, b.y + b.height/2));
        }"""), f"{name} is covered by another element"


def verify(page, url: str, width: int, out: Path, save_wait_ms: int = 2000) -> dict:
    result = {"url": url, "width": width, "passed": False, "checks": []}
    try:
        response = page.goto(url, wait_until="domcontentloaded", timeout=45000)
        assert response and response.ok, "Page did not return a successful HTTP response"
        visible_switch(page, width)
        result["checks"].append("Both language buttons visible and unobstructed on initial screen")
        page.get_by_role("button", name="简体中文", exact=True).click()
        action = page.get_by_role("button", name=ZH_ACTION)
        expect(action).to_be_visible()
        before = resource(page)
        action.click()
        page.wait_for_function(f"() => ({RESOURCE_JS})() > {before}")
        chinese_count = resource(page)
        result["checks"].append("Chinese action is translated and produces glyphs")
        page.get_by_role("button", name="English", exact=True).click()
        action = page.get_by_role("button", name=EN_ACTION)
        expect(action).to_be_visible()
        assert resource(page) == chinese_count, "Language switching changed resource total"
        action.click()
        page.wait_for_function(f"() => ({RESOURCE_JS})() > {chinese_count}")
        english_count = resource(page)
        result["checks"].append("English action works; switching did not alter resources")
        page.wait_for_timeout(save_wait_ms)
        page.reload(wait_until="domcontentloaded")
        expect(page.get_by_role("button", name=EN_ACTION)).to_be_visible()
        assert resource(page) == english_count, "English reload did not preserve progress"
        result["checks"].append("English choice and progress persist after reload")
        page.get_by_role("button", name="简体中文", exact=True).click()
        expect(page.get_by_role("button", name=ZH_ACTION)).to_be_visible()
        assert resource(page) == english_count, "Switch back to Chinese changed progress"
        page.wait_for_timeout(save_wait_ms)
        page.reload(wait_until="domcontentloaded")
        expect(page.get_by_role("button", name=ZH_ACTION)).to_be_visible()
        assert resource(page) == english_count, "Chinese reload did not preserve progress"
        visible_switch(page, width)
        result["checks"].append("Chinese choice and progress persist after reload")
        page.screenshot(path=str(out / f"chinese-{width}.png"), full_page=True)
        page.get_by_role("button", name=re.compile(r"^系统$")).click()
        expect(page.get_by_text(re.compile(r"统计")).first).to_be_visible()
        expect(page.get_by_text(re.compile(r"危险")).first).to_be_visible()
        visible_switch(page, width)
        page.screenshot(path=str(out / f"system-{width}.png"), full_page=True)
        result["checks"].append("System statistics and danger section translated; reset never clicked")
        result["passed"] = True
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
        try:
            page.screenshot(path=str(out / f"failure-{width}.png"), full_page=True)
        except Exception:
            pass
    finally:
        try:
            result["diagnostics"] = page.evaluate("""() => ({
              title: document.title, lang: document.documentElement.lang,
              scripts: [...document.scripts].map(s => s.src).filter(Boolean),
              adapter: window.GlyphLanguage?.version ?? null,
              buttons: [...document.querySelectorAll('button')].map(b => b.innerText)
            })""")
        except Exception:
            pass
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default=PRODUCTION)
    parser.add_argument("--output", default="artifacts/replit-localization")
    parser.add_argument("--executable-path")
    parser.add_argument("--save-wait-ms", type=int, default=2000)
    args = parser.parse_args()
    if urlparse(args.url).scheme not in ("http", "https"):
        parser.error("--url must be an HTTP(S) game or local fixture URL")
    if args.save_wait_ms < 0:
        parser.error("--save-wait-ms must be nonnegative")
    out = Path(args.output)
    out.mkdir(parents=True, exist_ok=True)
    report = {"checked_at": datetime.now(timezone.utc).isoformat(), "target": args.url, "results": []}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=args.executable_path)
            for width in (390, 1280):
                context = browser.new_context(viewport={"width": width, "height": 900}, locale="en-US")
                try:
                    report["results"].append(verify(context.new_page(), args.url, width, out, args.save_wait_ms))
                finally:
                    context.close()
            browser.close()
    except Exception as exc:
        report["setup_error"] = f"{type(exc).__name__}: {exc}"
    report["passed"] = len(report["results"]) == 2 and all(r["passed"] for r in report["results"])
    text = json.dumps(report, ensure_ascii=False, indent=2)
    (out / "report.json").write_text(text, encoding="utf-8")
    print(text)
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
