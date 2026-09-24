#!/usr/bin/env python3
"""Drive the Glyph Factory app: the Next shell, the player build, the in-app review
surface, the Aha Lab, and the product demo.

    python3 .claude/skills/run-glyph-factory/driver.py smoke
    python3 .claude/skills/run-glyph-factory/driver.py play --seconds 45
    python3 .claude/skills/run-glyph-factory/driver.py publish --budget 420
    python3 .claude/skills/run-glyph-factory/driver.py review
    python3 .claude/skills/run-glyph-factory/driver.py aha
    python3 .claude/skills/run-glyph-factory/driver.py demo
    python3 .claude/skills/run-glyph-factory/driver.py shot review

Every command starts `npm run dev` itself unless --base points at a server that is
already answering, writes screenshots into --out, and exits non-zero when a
contract it asserts is not met.
"""
from __future__ import annotations

import argparse
import json
import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[3]
DEFAULT_BASE = "http://localhost:3000"
DEFAULT_OUT = Path("/tmp/glyph-factory-run")

# ---------------------------------------------------------------- page-side JS
# The controller rebuilds #primary-actions every 500ms via replaceChildren, so a
# resolved node can detach between Playwright's hit-test and its click. Every
# interaction therefore dispatches inside the page against a freshly queried node.
READ = """() => {
  const t = (id) => { const el = document.getElementById(id); return el ? el.textContent : ''; };
  const num = (s) => { const m = /^([\\d.]+)([KMB])?$/.exec((s || '').trim()); if (!m) return NaN;
    const v = parseFloat(m[1]); return m[2] === 'K' ? v * 1e3 : m[2] === 'M' ? v * 1e6 : m[2] === 'B' ? v * 1e9 : v; };
  const owned = (name) => { const c = [...document.querySelectorAll('.machine')]
      .find(m => m.querySelector('b').textContent === name);
    return c ? parseInt(c.querySelector('small').textContent, 10) : 0; };
  const sub = (cmd) => { const b = document.querySelector(`#primary-actions button[data-command="${cmd}"]`);
    return b ? (b.querySelector('.action-sub') || {}).textContent || '' : null; };
  return {
    glyphs: t('glyphs'), glyphsNum: num(t('glyphs')),
    credits: t('credits'), creditsNum: num(t('credits')),
    meaning: t('meaning'), noise: t('noise'),
    rate: t('rate'), lifetime: t('total'), lifetimeNum: num(t('total')),
    status: t('status'), log: t('log'),
    actTitle: t('act-title'), kicker: t('act-kicker'),
    ahaTitle: t('aha-title'), ahaCount: t('aha-count'), worldScale: t('world-scale'),
    commands: [...document.querySelectorAll('#primary-actions button')]
      .map(b => b.dataset.command + (b.disabled ? ':off' : ':on')),
    labels: [...document.querySelectorAll('#primary-actions button')]
      .map(b => b.innerText.replace(/\\n/g, ' / ') + (b.disabled ? ' [disabled]' : '')),
    machines: [...document.querySelectorAll('.machine')].map(m => m.innerText.replace(/\\n/g, ' ')),
    keyboards: owned('机械键盘'), typists: owned('夜班打字员'), presses: owned('小型印刷机'),
    autoSellSub: sub('toggle-auto'),
    directorHidden: document.getElementById('director-toggle').hidden,
    ahaItems: document.querySelectorAll('.aha-item').count,
    lang: document.documentElement.lang, title: document.title,
  };
}"""
CLICK = """(cmd) => { const b = document.querySelector(
    `#primary-actions button[data-command="${cmd}"]:not([disabled])`);
  if (!b) return false; b.click(); return true; }"""
CLICK_BUY = """(name) => { const cards = [...document.querySelectorAll('.machine')];
  const c = name ? cards.find(m => m.querySelector('b').textContent === name) : cards[0];
  if (!c) return false; const b = c.querySelector('button:not([disabled])');
  if (!b) return false; b.click(); return c.querySelector('b').textContent; }"""
PRINT_N = """(n) => { const b = document.querySelector('#primary-actions button[data-command="print"]');
  if (!b) return 0; for (let i = 0; i < n; i++) b.click(); return n; }"""


# ------------------------------------------------------------------- plumbing
class Run:
    """One driver invocation: evidence dir, browser, console-error sink."""

    def __init__(self, args):
        self.args = args
        self.out = Path(args.out)
        self.out.mkdir(parents=True, exist_ok=True)
        self.errors: list[str] = []
        self.steps: list[dict] = []
        self.server = None
        self.failures: list[str] = []

    def rec(self, step, **kw):
        entry = {"step": step, **kw}
        self.steps.append(entry)
        print(json.dumps(entry, ensure_ascii=False), flush=True)

    def check(self, ok, label, **kw):
        if not ok:
            self.failures.append(label)
        self.rec(("PASS " if ok else "FAIL ") + label, **kw)

    def wire(self, page):
        page.on("pageerror", lambda e: self.errors.append(f"pageerror: {e}"))
        page.on(
            "console",
            lambda m: self.errors.append(f"console.{m.type}: {m.text}")
            if m.type == "error"
            else None,
        )

    def page(self, browser, **viewport):
        ctx = browser.new_context(viewport=viewport or {"width": 1280, "height": 1000})
        page = ctx.new_page()
        self.wire(page)
        return ctx, page

    def shot(self, page, name, full_page=True):
        path = self.out / f"{name}.png"
        page.screenshot(path=str(path), full_page=full_page)
        return str(path)

    def finish(self, browser_ok=True):
        report = {
            "base": self.args.base,
            "out": str(self.out),
            "steps": self.steps,
            "failures": self.failures,
            "console_errors": self.errors,
            "browser_ok": browser_ok,
        }
        (self.out / "report.json").write_text(
            json.dumps(report, indent=2, ensure_ascii=False) + "\n"
        )
        print(f"\nevidence: {self.out}", flush=True)
        print(f"console errors: {len(self.errors)}", flush=True)
        for e in self.errors[:10]:
            print("  -", e, flush=True)
        if self.failures:
            print("FAILED CHECKS:", flush=True)
            for f in self.failures:
                print("  -", f, flush=True)
            return 1
        return 0


def port_open(host, port):
    with socket.socket() as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0


def parse_base(base):
    hostport = base.split("//", 1)[-1].split("/", 1)[0]
    host, _, port = hostport.partition(":")
    return host or "localhost", int(port or 80)


def start_server(base, log_path: Path):
    """`npm run dev` in its own process group so teardown takes the whole tree."""
    log = log_path.open("w")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=REPO,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    return proc, log


def stop_server(proc, log):
    if proc is None:
        return
    try:
        os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
        proc.wait(timeout=10)
    except Exception:  # noqa: BLE001
        try:
            os.killpg(os.getpgid(proc.pid), signal.SIGKILL)
        except Exception:  # noqa: BLE001
            pass
    log.close()


def ensure_server(run: Run):
    host, port = parse_base(run.args.base)
    if port_open(host, port):
        run.rec("server.reused", base=run.args.base)
        return None, None
    log_path = run.out / "dev-server.log"
    proc, log = start_server(run.args.base, log_path)
    deadline = time.time() + 90
    while time.time() < deadline:
        if port_open(host, port):
            run.rec("server.started", base=run.args.base, log=str(log_path))
            return proc, log
        if proc.poll() is not None:
            log.close()
            sys.stderr.write(log_path.read_text()[-2000:])
            raise SystemExit("npm run dev exited before the port opened")
        time.sleep(0.5)
    stop_server(proc, log)
    raise SystemExit("npm run dev did not open the port within 90s")


def bare(st):
    """Command names without the `:on` / `:off` suffix READ attaches."""
    return [c.split(":")[0] for c in st["commands"]]


def game_frame(page):
    """`/` and `/aha-lab` embed the game in an iframe; return that frame."""
    for _ in range(60):
        for f in page.frames:
            if "play.html" in f.url:
                return f
        page.wait_for_timeout(250)
    raise SystemExit("play.html frame never appeared")


# -------------------------------------------------------------------- commands
def cmd_smoke(run: Run, browser):
    base = run.args.base
    ctx, page = run.page(browser, width=390, height=844)

    page.goto(f"{base}/", wait_until="networkidle")
    frame = game_frame(page)
    frame.wait_for_selector("#primary-actions button", timeout=15000)
    st = frame.evaluate(READ)
    run.rec("player.loaded", **{k: st[k] for k in ("title", "lang", "status", "commands")})
    run.check(st["lang"] == "zh-CN", "player build forces Simplified Chinese",
              lang=st["lang"])
    run.check(st["directorHidden"] is True,
              "player build hides the director toggle",
              hidden=st["directorHidden"])
    run.check(frame.evaluate("() => document.getElementById('act-strip').hidden") is True,
              "player build hides the act strip")
    run.check(bare(st) == ["print"], "fresh player save offers only print",
              commands=st["commands"])
    run.shot(page, "smoke-1-player")

    page.goto(f"{base}/play.html?review=1", wait_until="networkidle")
    page.wait_for_selector("#primary-actions button", timeout=15000)
    st = page.evaluate(READ)
    run.rec("review.loaded", act=st["actTitle"], commands=st["commands"],
            ahaCount=st["ahaCount"])
    run.check(st["directorHidden"] is False,
              "review surface keeps the director toggle")
    page.locator("#director-toggle").click()
    options = page.locator("#director-select option").count()
    run.check(options == 28, "director exposes 28 aha states", options=options)
    run.shot(page, "smoke-2-review")

    page.goto(f"{base}/aha-lab", wait_until="networkidle")
    lab = page.frame_locator("iframe")
    lab.locator("#aha-catalog").wait_for(timeout=15000)
    run.check(lab.locator("#aha-catalog button").count() == 28,
              "aha lab lists 28 triggers",
              items=lab.locator("#aha-catalog button").count())
    run.shot(page, "smoke-3-aha-lab")

    page.goto(f"{base}/product-demo", wait_until="networkidle")
    run.check(page.get_by_role("button", name="亲手印一个「木」").count() == 1,
              "product demo renders its phase-1 verb")
    run.shot(page, "smoke-4-product-demo")

    ctx.close()


def cmd_shot(run: Run, browser):
    which = run.args.surface
    base = run.args.base
    ctx, page = run.page(browser, width=run.args.width, height=run.args.height)
    if which == "player":
        page.goto(f"{base}/", wait_until="networkidle")
        game_frame(page).wait_for_selector("#primary-actions button", timeout=15000)
    elif which == "review":
        page.goto(f"{base}/play.html?review=1", wait_until="networkidle")
        page.wait_for_selector("#primary-actions button", timeout=15000)
    elif which == "aha-lab":
        page.goto(f"{base}/aha-lab", wait_until="networkidle")
        page.frame_locator("iframe").locator("#aha-catalog").wait_for(timeout=15000)
    elif which == "demo":
        page.goto(f"{base}/product-demo", wait_until="networkidle")
    page.wait_for_timeout(800)
    run.rec("shot", surface=which, path=run.shot(page, f"shot-{which}"))
    ctx.close()


def play_loop(run: Run, frame, seconds):
    """Print, sell, and buy automation the way a player would, sampling state."""
    t0 = time.time()
    last = -20.0
    while time.time() - t0 < seconds:
        t = round(time.time() - t0)
        for cmd in ("research-auto", "boost", "contract"):
            if frame.evaluate(CLICK, cmd):
                run.rec("action", t=t, command=cmd)
        if frame.evaluate(
            """() => { const b = document.querySelector('#primary-actions button[data-command="toggle-auto"]');
                 return b ? /OFF|关闭/.test(((b.querySelector('.action-sub') || {}).textContent || '')) : false; }"""
        ):
            frame.evaluate(CLICK, "toggle-auto")
            run.rec("action", t=t, command="toggle-auto:on")
        else:
            frame.evaluate(CLICK, "sell")
        frame.evaluate(CLICK_BUY, None)
        st = frame.evaluate(READ)
        if st["lifetimeNum"] < 400:
            frame.evaluate(PRINT_N, 5)
        if t - last >= 20:
            last = t
            st = frame.evaluate(READ)
            run.rec("sample", t=t, glyphs=st["glyphs"], credits=st["credits"],
                    rate=st["rate"], lifetime=st["lifetime"],
                    kb=st["keyboards"], ty=st["typists"], pr=st["presses"],
                    commands=st["commands"])
        time.sleep(0.15)
    return frame.evaluate(READ)


def cmd_play(run: Run, browser):
    ctx, page = run.page(browser, width=420, height=900)
    page.goto(f"{run.args.base}/", wait_until="networkidle")
    frame = game_frame(page)
    frame.wait_for_selector("#primary-actions button", timeout=15000)
    start = frame.evaluate(READ)
    run.rec("start", **{k: start[k] for k in ("glyphs", "credits", "rate", "lifetime")})

    frame.evaluate(PRINT_N, 12)
    page.wait_for_timeout(500)
    st = frame.evaluate(READ)
    run.check(st["lifetimeNum"] >= 12, "manual printing raises the glyph stock",
              glyphs=st["glyphs"], commands=st["commands"])
    run.check("sell" in bare(st), "selling is revealed once glyphs exist",
              commands=st["commands"])
    frame.evaluate(CLICK, "sell")
    page.wait_for_timeout(600)
    st = frame.evaluate(READ)
    run.check(st["creditsNum"] > 0, "selling converts glyphs to credits",
              credits=st["credits"], glyphs=st["glyphs"])
    run.shot(page, "play-1-selling")

    final = play_loop(run, frame, run.args.seconds)
    page.wait_for_timeout(4000)
    auto = frame.evaluate(READ)
    run.rec("auto_production", glyphs_before=final["glyphs"], glyphs_after=auto["glyphs"],
            rate=auto["rate"])
    run.shot(page, "play-2-automation")
    ctx.close()


def cmd_publish(run: Run, browser):
    """The ACT I -> ACT II gate. Auto-sell must be off: it pins stock below the
    glyphs>=200 requirement, which is why `publish` can stay invisible forever."""
    ctx, page = run.page(browser, width=420, height=900)
    page.goto(f"{run.args.base}/", wait_until="networkidle")
    frame = game_frame(page)
    frame.wait_for_selector("#primary-actions button", timeout=15000)

    t0 = time.time()
    last = -20.0
    stock_mode = False
    published = False
    while time.time() - t0 < run.args.budget:
        t = round(time.time() - t0)
        st = frame.evaluate(READ)

        if not stock_mode and st["lifetimeNum"] >= 5000 and st["presses"] >= 1 and st["creditsNum"] >= 300:
            stock_mode = True
            run.rec("gate.reached", t=t, glyphs=st["glyphs"], credits=st["credits"],
                    lifetime=st["lifetime"], presses=st["presses"])
            run.shot(page, "publish-1-gate-reached")
            for _ in range(6):
                if frame.evaluate(
                    """() => { const b = document.querySelector('#primary-actions button[data-command="toggle-auto"]');
                         if (!b) return true; return /OFF|关闭/.test(((b.querySelector('.action-sub') || {}).textContent || '')); }"""
                ):
                    break
                frame.evaluate(CLICK, "toggle-auto")
                page.wait_for_timeout(250)
            run.rec("auto_sell.off", t=round(time.time() - t0))

        if stock_mode:
            st = frame.evaluate(READ)
            if frame.evaluate(CLICK, "publish"):
                run.rec("publish.clicked", t=round(time.time() - t0), glyphs=st["glyphs"],
                        credits=st["credits"], lifetime=st["lifetime"])
                page.wait_for_timeout(2600)
                published = True
                break
            if t != last:
                last = t
                run.rec("stocking", t=t, glyphs=st["glyphs"], credits=st["credits"])
            time.sleep(0.2)
            continue

        for cmd in ("research-auto", "boost", "contract"):
            if frame.evaluate(CLICK, cmd):
                run.rec("action", t=t, command=cmd)
        if not frame.evaluate(
            """() => { const b = document.querySelector('#primary-actions button[data-command="toggle-auto"]');
                 return b ? /ON|开启/.test(((b.querySelector('.action-sub') || {}).textContent || '')) : false; }"""
        ):
            frame.evaluate(CLICK, "toggle-auto")
        else:
            frame.evaluate(CLICK, "sell")
        if st["presses"] == 0 and st["lifetimeNum"] >= 800:
            frame.evaluate(CLICK_BUY, "小型印刷机")
        else:
            frame.evaluate(CLICK_BUY, None)
        if st["lifetimeNum"] < 400:
            frame.evaluate(PRINT_N, 5)
        if t - last >= 30:
            last = t
            run.rec("sample", t=t, rate=st["rate"], lifetime=st["lifetime"],
                    credits=st["credits"], pr=st["presses"])
            run.shot(page, f"publish-t{t:03d}")
        time.sleep(0.15)

    st = frame.evaluate(READ)
    run.check(published, "publish opens ACT II", seconds=round(time.time() - t0),
              commands=st["commands"])
    if published:
        run.rec("act2.entered", status=st["status"], commands=st["commands"],
                labels=st["labels"], log=st["log"][-300:])
        run.check("compose-rule" in bare(st), "ACT II exposes the compose verb",
                  commands=st["commands"])
        run.shot(page, "publish-2-act2")
        for _ in range(4):
            frame.evaluate(CLICK, "compose-rule")
            page.wait_for_timeout(500)
        st = frame.evaluate(READ)
        run.rec("act2.compose", log=st["log"][-300:])
        run.check("刻模成功" in st["log"], "compose actually fires")
        run.shot(page, "publish-3-act2-composed")
    ctx.close()


def cmd_review(run: Run, browser):
    ctx, page = run.page(browser)
    page.goto(f"{run.args.base}/play.html?review=1", wait_until="networkidle")
    page.wait_for_selector("#primary-actions button", timeout=15000)
    page.locator("#director-toggle").click()
    opts = page.locator("#director-select option")
    n = opts.count()
    run.check(n == 28, "28 director states", options=n)

    page.locator("#director-select").select_option(index=n - 1)
    page.wait_for_timeout(200)
    page.locator("#director-preview").click()
    page.wait_for_timeout(1000)
    st = page.evaluate(READ)
    run.rec("director.A28", kicker=st["kicker"], act=st["actTitle"],
            status=st["status"], worldScale=st["worldScale"], commands=st["commands"])
    run.check(st["worldScale"] == "SILENCE", "A28 ends in the silence state",
              worldScale=st["worldScale"])
    run.check(page.locator("#ending").is_visible(), "A28 reveals the ending panel")
    run.shot(page, "review-1-A28")

    page.locator("#director-select").select_option(index=12)
    page.wait_for_timeout(200)
    page.locator("#director-preview").click()
    page.wait_for_timeout(800)
    st = page.evaluate(READ)
    run.rec("director.mid", act=st["actTitle"], worldScale=st["worldScale"],
            commands=st["commands"], seenAhas=page.locator(".aha-item.seen").count())
    run.check(len(st["commands"]) >= 3, "a mid act renders its own verb set",
              commands=st["commands"])
    run.shot(page, "review-2-mid")

    page.locator("#director-apply").click()
    page.wait_for_timeout(900)
    applied = page.evaluate(READ)["actTitle"]
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1200)
    after = page.evaluate(READ)["actTitle"]
    run.check(applied == after and bool(after), "director state persists across reload",
              applied=applied, after_reload=after)
    run.shot(page, "review-3-applied")
    ctx.close()


def cmd_aha(run: Run, browser):
    ctx, page = run.page(browser)
    page.goto(f"{run.args.base}/aha-lab", wait_until="networkidle")
    lab = page.frame_locator("iframe")
    lab.locator("#aha-catalog").wait_for(timeout=15000)
    page.wait_for_timeout(800)
    run.shot(page, "aha-1-lab")

    triggers = lab.locator("#aha-catalog button")
    run.check(triggers.count() == 28, "aha lab lists 28 triggers", items=triggers.count())
    triggers.nth(0).click()
    page.wait_for_timeout(2500)
    run.rec("trigger.0", status=lab.locator("#audit-status").inner_text())
    run.shot(page, "aha-2-trigger")

    lab.locator("#verify-all").click()
    page.wait_for_timeout(9000)
    status = lab.locator("#audit-status").inner_text()
    run.rec("verify_all", status=status)
    run.check("28 / 28 PASS" in status, "the lab's own 28-trigger audit passes",
              status=status)
    run.shot(page, "aha-3-verify-all")
    ctx.close()


def cmd_demo(run: Run, browser):
    ctx, page = run.page(browser, width=1280, height=1100)
    page.goto(f"{run.args.base}/product-demo", wait_until="networkidle")
    primary = page.get_by_role("button", name="亲手印一个「木」")
    locked = page.get_by_role("button", name="再印 3 个「木」解锁刻模")
    phase = lambda: page.locator("text=/PHASE \\d \\/ 3/").first.inner_text()  # noqa: E731

    run.check(locked.is_disabled(), "mold starts locked", phase=phase())
    page.screenshot(path=run.shot(page, "demo-1-phase1"), full_page=True)

    for _ in range(3):
        primary.click()
        page.wait_for_timeout(150)
    page.wait_for_timeout(400)
    unlocked = page.get_by_role("button", name="刻模：木 + 木 → 林")
    run.check(unlocked.is_enabled(), "three prints unlock the mold", phase=phase())
    run.shot(page, "demo-2-unlocked")

    unlocked.click()
    page.wait_for_timeout(5000)
    body = page.locator("main").inner_text()
    run.check("PHASE 3 / 3" in body, "the mold advances the demo to phase 3")
    run.check("AHA MOMENT" in body, "the aha banner appears")
    run.check("林" in body, "the mold produces 林")
    run.shot(page, "demo-3-mold-running")

    page.get_by_role("button", name="重新体验").click()
    page.wait_for_timeout(600)
    run.check("PHASE 1 / 3" in page.locator("main").inner_text(),
              "the demo resets to phase 1")
    ctx.close()


COMMANDS = {
    "smoke": cmd_smoke,
    "shot": cmd_shot,
    "play": cmd_play,
    "publish": cmd_publish,
    "review": cmd_review,
    "aha": cmd_aha,
    "demo": cmd_demo,
}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("command", choices=sorted(COMMANDS))
    ap.add_argument("surface", nargs="?", choices=["player", "review", "aha-lab", "demo"],
                    help="only for `shot`")
    ap.add_argument("--base", default=DEFAULT_BASE)
    ap.add_argument("--out", default=None)
    ap.add_argument("--seconds", type=int, default=45, help="play: loop length")
    ap.add_argument("--budget", type=int, default=420, help="publish: loop budget")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=1000)
    ap.add_argument("--headed", action="store_true")
    args = ap.parse_args()

    if args.command == "shot" and not args.surface:
        ap.error("`shot` needs a surface")
    if args.out is None:
        stamp = time.strftime("%Y%m%d-%H%M%S")
        args.out = DEFAULT_OUT / f"{args.command}-{stamp}"

    run = Run(args)
    proc = log = None
    try:
        proc, log = ensure_server(run)
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=not args.headed)
            try:
                COMMANDS[args.command](run, browser)
            finally:
                browser.close()
    finally:
        stop_server(proc, log)
    raise SystemExit(run.finish())


if __name__ == "__main__":
    main()
