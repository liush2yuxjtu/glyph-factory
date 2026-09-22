"""采集 17 个屏幕状态的真实 DOM 读数 -> scripts/flows/screens.json

    node scripts/build-static.mjs && node scripts/build-aha-review.mjs
    python3 scripts/flows/capture.py

三条纪律，都是踩出来的：

1. **画的是读数不是记忆。** 每个字段都从运行中的页面读出来，一个都不手写。
2. **栅格列数不能读 `grid-template-columns`。** 元素隐藏时它只回报声明值，还会留下空轨道
   （`repeat(2,1fr)` 报 2 个，`328px 0px` 也报 2 个）。只有数首行子元素的 `offsetTop` 才拿得到
   真实列数——390px 下篇章条实际是 2 列而不是 3 列。
3. **存档要按 `add_init_script` 注入，而且要把 updatedAt 顶到当下。** 上一次把它落在
   gitignore 的 `test-results/` 里，被清掉之后整条链路就断了。所以它现在入库。
"""
import json
import subprocess
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / "scripts" / "flows"
SAVE = "glyph-factory-save-v3"

# 屏幕名与一句话说明。说明里**只留能核对的那半**，后面接的「N 个动作 · K 项指标」
# 由采集现算——原来这里是手写的，于是 P07 那句「全游戏最薄的一屏」在加了两类动作之后
# 一直挂在页面上，而它已经不是真的了。
NAMES = {
    "P01": ("390x844", "player", "全新存档", "玩家面 · 全新存档"),
    "P02": ("390x844", "player", "首次出售", "玩家面 · 出售首次可用"),
    "P03": ("390x844", "player", "自动化", "玩家面 · 三台机器都出现"),
    "P04": ("390x844", "player", "ACT II · 字开始生长", "玩家面 · 推钟动词与微事件首次出现，世界面仍未出现"),
    "P05": ("390x844", "player", "ACT III · 城市", "玩家面 · 城市地图在这一幕才画得出来，hero 展开双栏"),
    "P06": ("390x844", "player", "ACT IV · 机器开始写", "玩家面 · 数字出版让库存指标退场"),
    "P07": ("390x844", "player", "ACT V · 机器语言", "玩家面 · 动作最少的一幕"),
    "P08": ("390x844", "player", "ACT VI · 终局条件成立", "玩家面 · 最后一个按钮出现"),
    "P09": ("390x844", "player", "停止印刷之后", "玩家面 · 终局：全部动作禁用"),
    "R01": ("390x844", "review", "A01 · ACT I", "评审面 · 导演态 A01"),
    "R02": ("390x844", "review", "A03 · ACT II", "评审面 · 导演态 A03"),
    "R03": ("390x844", "review", "A12 · ACT III", "评审面 · 导演态 A12"),
    "R04": ("390x844", "review", "A16 · ACT IV", "评审面 · 导演态 A16"),
    "R05": ("390x844", "review", "A22 · ACT V", "评审面 · 导演态 A22"),
    "R06": ("390x844", "review", "A28 · 终局", "评审面 · 导演态 A28"),
    "D01": ("1280x900", "review", "ACT IV · 1280", "评审面 · 桌面构图 D01"),
    "D02": ("1280x900", "review", "ACT I · 1280", "评审面 · 桌面构图 D02"),
}
WIDE = {"D01": "A16", "D02": "A01"}

# 页内取数。写成一份字符串，两个面共用——两份就会漂。
READ_DOM = r"""
() => {
  const q = (id) => document.getElementById(id);
  const t = (id) => (q(id) ? q(id).textContent.trim() : "");
  const vis = (el) => Boolean(el && !el.hidden && el.getClientRects().length);
  // 真实列数：数首行子元素，不读 grid-template-columns（隐藏时它只回报声明值）。
  const cols = (el) => {
    if (!el || el.hidden) return 0;
    const kids = [...el.children].filter((k) => k.getClientRects().length);
    if (!kids.length) return 0;
    const top = kids[0].offsetTop;
    return kids.filter((k) => k.offsetTop === top).length;
  };
  const metrics = [...document.querySelectorAll(".metric")].map((m) => ({
    label: m.querySelector("span") ? m.querySelector("span").textContent.trim() : "",
    value: m.querySelector("strong") ? m.querySelector("strong").textContent.trim() : "",
    primary: m.classList.contains("primary"),
    hidden: Boolean(m.hidden),
  }));
  const actions = [...document.querySelectorAll("#primary-actions button")].map((b) => {
    const sub = b.querySelector(".action-sub");
    const main = b.querySelector("span");
    return {
      cmd: b.dataset.command || "",
      label: main ? main.textContent.trim() : "",
      sub: sub ? sub.textContent.trim() : "",
      disabled: b.disabled,
      major: b.classList.contains("major"),
      danger: b.classList.contains("danger"),
      event: b.classList.contains("event"),
    };
  });
  const machines = [...document.querySelectorAll(".machine")].map((m) => ({
    name: m.querySelector("b") ? m.querySelector("b").textContent.trim() : "",
    detail: m.querySelector("small") ? m.querySelector("small").textContent.trim() : "",
    label: m.querySelector("button") ? m.querySelector("button").textContent.trim() : "",
    disabled: m.querySelector("button") ? m.querySelector("button").disabled : true,
  }));
  const world = [...document.querySelectorAll("#world-metrics div")].map((d) => ({
    label: d.querySelector("span") ? d.querySelector("span").textContent.trim() : "",
    value: d.querySelector("strong") ? d.querySelector("strong").textContent.trim() : "",
  }));
  const acts = [...document.querySelectorAll("#act-strip div")].map((d) => ({
    text: d.querySelector("b") ? d.querySelector("b").textContent.trim() : "",
    range: d.querySelector("span") ? d.querySelector("span").textContent.trim() : "",
    state: d.classList.contains("current") ? "current" : (d.classList.contains("done") ? "done" : "future"),
  }));
  const ahaPanel = q("aha-list") ? q("aha-list").closest(".panel") : null;
  const ahaHead = q("aha-count") ? q("aha-count").closest(".panel-head") : null;
  const logPanel = q("log") ? q("log").closest(".panel") : null;
  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    title: document.title,
    lang: document.documentElement.lang,
    audience: document.documentElement.dataset.audience || null,
    status: t("status"), rate: t("rate"), total: t("total"),
    actKicker: t("act-kicker"), actTitle: t("act-title"), actCopy: t("act-copy"),
    ahaId: t("aha-id"), ahaTitle: t("aha-title"), ahaCopy: t("aha-copy"), ahaCount: t("aha-count"),
    systemsTitle: t("systems-title"), systemsNote: t("systems-note"), logTitle: t("log-title"),
    worldScale: t("world-scale"), saveStatus: t("save-status"),
    exportLabel: t("export"), resetLabel: t("reset"),
    endingTitle: q("ending") && q("ending").querySelector("h2") ? q("ending").querySelector("h2").textContent.trim() : "",
    endingBody: q("ending") && q("ending").querySelector("p") ? q("ending").querySelector("p").textContent.trim() : "",
    blocks: {
      masthead: vis(document.querySelector(".masthead")),
      statusline: vis(document.querySelector(".statusline")),
      director: vis(q("director")),
      actStrip: vis(q("act-strip")),
      actHead: vis(q("act-kicker")),
      metrics: vis(document.querySelector(".metrics")),
      ahaFocus: vis(document.querySelector(".aha-focus")),
      actions: vis(q("primary-actions")),
      notice: vis(q("notice")),
      world: vis(q("world-card")),
      systems: vis(q("systems-panel")),
      machines: vis(q("machines")),
      ahaHead: vis(ahaHead),
      ahaList: vis(q("aha-list")),
      logPanel: vis(logPanel),
      ending: vis(q("ending")),
      footer: vis(document.querySelector(".footer")),
      heroSingle: (q("hero-layout") || {}).classList ? q("hero-layout").classList.contains("single") : false,
    },
    metrics, actions, machines, world, acts,
    ahas: [...document.querySelectorAll("#aha-list button")].map((b) => b.textContent.trim()),
    log: t("log") ? t("log").split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12) : [],
    layout: {
      metrics: cols(document.querySelector(".metrics")),
      actions: cols(q("primary-actions")),
      machines: cols(q("machines")),
      world: cols(q("world-metrics")),
      acts: cols(q("act-strip")),
      aha: cols(q("aha-list")),
      hero: cols(q("hero-layout")),
      below: cols(q("below-layout")),
    },
  };
}
"""


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def serve(directory):
    srv = ThreadingHTTPServer(("127.0.0.1", 0), partial(Handler, directory=str(directory)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{srv.server_port}"


def main():
    dist, review = ROOT / "dist", ROOT / "review-dist"
    for need in (dist / "play.html", review / "review" / "play.html"):
        if not need.is_file():
            raise SystemExit(f"缺 {need}：先跑 node scripts/build-static.mjs && node scripts/build-aha-review.mjs")
    snaps = json.loads(subprocess.run(
        ["node", str(HERE / "snapshots.mjs")], check=True, capture_output=True, text=True, cwd=ROOT,
    ).stdout)

    _, p_url = serve(dist)
    _, r_url = serve(review)
    out = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        for sid, (viewport, surface, name, note) in NAMES.items():
            w, h = (int(x) for x in viewport.split("x"))
            ctx = browser.new_context(viewport={"width": w, "height": h}, locale="zh-CN", color_scheme="light")
            page = ctx.new_page()
            if surface == "player":
                seed = json.dumps(snaps["player"][sid], ensure_ascii=False)
                page.add_init_script(
                    "(() => { const s = " + seed + ";"
                    " s.updatedAt = Date.now(); s.startedAt = Date.now();"
                    f" localStorage.setItem({json.dumps(SAVE)}, JSON.stringify(s)); }})();")
                page.goto(f"{p_url}/play.html", wait_until="networkidle")
            else:
                page.add_init_script(f"localStorage.removeItem({json.dumps(SAVE)});")
                page.goto(f"{r_url}/review/play.html?director=1", wait_until="networkidle")
                page.wait_for_selector("#director-select")
                page.select_option("#director-select", WIDE.get(sid) or snaps["director"][sid])
                page.click("#director-preview")
            page.wait_for_selector("#primary-actions button")
            page.wait_for_timeout(400)          # 让 500ms 的那次整屏重绘落定
            row = page.evaluate(READ_DOM)
            shown = sum(1 for m in row["metrics"] if not m["hidden"])
            row.update({"id": sid, "name": name, "surface": surface,
                        "note": f"{note} · {len(row['actions'])} 个动作 · {shown} 项可见指标"})
            out.append(row)
            ctx.close()
            print(f"  {sid} {name} · {len(row['actions'])} 个动作 · metrics {row['layout']['metrics']} 列", flush=True)
        browser.close()
    # 键序按上一版排，diff 才读得动。
    order = ["viewport", "layout", "title", "lang", "audience", "status", "rate", "total", "actKicker",
             "actTitle", "actCopy", "ahaId", "ahaTitle", "ahaCopy", "ahaCount", "systemsTitle", "systemsNote",
             "logTitle", "worldScale", "saveStatus", "exportLabel", "resetLabel", "endingTitle", "endingBody",
             "blocks", "metrics", "actions", "world", "machines", "ahas", "acts", "log", "id", "name", "note", "surface"]
    out = [{k: r[k] for k in order if k in r} for r in out]
    (HERE / "screens.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote scripts/flows/screens.json · {len(out)} 屏")


if __name__ == "__main__":
    sys.exit(main())
