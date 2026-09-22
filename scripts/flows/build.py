"""Rebuild every captured screen state as an inline SVG schematic.

Reads screens.json (real DOM facts read from the running game) and writes the atlas with
each <img> replaced by a vector rebuild of that exact state. Nothing here is drawn from
memory: block presence, metric sets, button labels, enabled/disabled state, world rows,
log lines and the grid column counts all come from the capture, so a rebuild cannot show
something the screen did not have.

Two canvases: a 300-unit column for the 390x844 player surface and a 620-unit one for the
1280x900 review surface, whose hero and below rows really are two columns wide.
"""
import json
import re
import subprocess
from html import escape
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SCREENS = json.loads((HERE / "screens.json").read_text())
FLOWS = json.loads((HERE / "flows.json").read_text())
TEMPLATE = HERE / "template.html"
# The page is a member of the design system, not a loose artifact: it ships inside
# public/design-system/ and links tokens.css like every other page in that package.
OUTPUT = ROOT / "public/design-system/flows.html"

MONO = "var(--font-num)"
SANS = "var(--font-ui)"
SERIF = "var(--font-mark)"


def esc(text):
    return escape(str(text or ""), quote=True)


def wrap(text, per_line):
    text = str(text or "")
    lines, cur = [], ""
    for ch in text:
        cur += ch
        if len(cur) >= per_line:
            lines.append(cur)
            cur = ""
    if cur:
        lines.append(cur)
    return lines


def clip(text, n):
    text = str(text or "")
    return text if len(text) <= n else text[: n - 1] + "…"


class Sheet:
    """One SVG canvas. Blocks advance `y`; nothing is drawn twice."""

    def __init__(self, x=0, y=0):
        self.parts = []
        self.x = x
        self.y = y

    def add(self, markup):
        self.parts.append(markup)

    def text(self, x, y, s, size=10, fill="var(--ink)", weight=500, family=None, anchor="start",
             mono=False, opacity=None):
        attrs = [f'x="{x:.1f}"', f'y="{y:.1f}"', f'font-size="{size}"', f'fill="{fill}"',
                 f'font-weight="{weight}"', f'font-family="{family or (MONO if mono else SANS)}"',
                 f'text-anchor="{anchor}"']
        if opacity is not None:
            attrs.append(f'opacity="{opacity}"')
        self.add(f'<text {" ".join(attrs)}>{esc(s)}</text>')

    def box(self, x, y, w, h, fill="var(--panel)", stroke="var(--ink)", sw=1.4, dash=None, shadow=False):
        d = f' stroke-dasharray="{dash}"' if dash else ""
        self.add(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" '
                 f'stroke="{stroke}" stroke-width="{sw}"{d}/>')
        if shadow:
            self.add(f'<rect x="{x + 2:.1f}" y="{y + 2:.1f}" width="{w:.1f}" height="{h:.1f}" '
                     f'fill="none" stroke="var(--ink)" stroke-width="{sw}" opacity=".35"/>')

    def hline(self, x, y, w, stroke="var(--line)", sw=1):
        self.add(f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x + w:.1f}" y2="{y:.1f}" '
                 f'stroke="{stroke}" stroke-width="{sw}"/>')

    def finish(self, w, height, label, note):
        return (f'<svg class="sch" viewBox="0 0 {w:.0f} {height:.0f}" role="img" '
                f'aria-label="{esc(label)}" xmlns="http://www.w3.org/2000/svg">'
                f'<title>{esc(label)}</title>'
                f'<rect x="0" y="0" width="{w:.0f}" height="{height:.0f}" fill="var(--paper)"/>'
                + "".join(self.parts)
                + f'<text x="{w - 6:.0f}" y="{height - 5:.0f}" font-size="7" font-family="{MONO}" '
                  f'fill="var(--muted)" text-anchor="end">{esc(note)}</text></svg>')


# ------------------------------------------------------------------ block emitters
# Every emitter takes (sheet, x, y, w, state) and returns the new y.


def e_masthead(sh, x, y, w, s):
    sh.add(f'<rect x="{x}" y="{y}" width="24" height="28" fill="var(--ink)"/>')
    sh.text(x + 12, y + 21, "字", 16, "var(--green)", 900, family=SERIF, anchor="middle")
    sh.text(x + 31, y + 9, "GLYPH FACTORY · ACTS ENGINE v3", 6.5, "var(--rust)", 700, mono=True)
    sh.text(x + 31, y + 24, "字//工厂", 16, "var(--ink)", 900, family=SERIF)
    if s["surface"] == "review":
        bx = x + w
        for label in ("导演模式", "EN"):
            bw = 7.4 * len(label)
            bx -= bw + 5
            sh.box(bx, y + 3, bw, 17, fill="none", stroke="var(--ink)", sw=1)
            sh.text(bx + bw / 2, y + 15, label, 7.5, "var(--ink)", 700, anchor="middle")
    return y + 34


def e_status(sh, x, y, w, s):
    # The review surface's status can read 营业中 · ACT n/6 · DIRECTOR PREVIEW; clip both
    # ends so the two halves cannot collide on a 300-unit canvas.
    left = clip(s["status"], max(8, int(w / 15)))
    right = clip(f"{s['rate']} 字/秒 · 累计 {s['total']}", max(8, int(w / 12)))
    sh.text(x, y + 11, left, 8.5, "var(--muted)", 500, mono=True)
    sh.text(x + w, y + 11, right, 8.5, "var(--muted)", 700, mono=True, anchor="end")
    return y + 16


def e_director(sh, x, y, w, s):
    sh.box(x, y, w, 21, fill="var(--review-bg)", stroke="var(--blue)", sw=1.2)
    sh.text(x + 7, y + 14, f"DIRECTOR MODE / AHA ▾ {s.get('directorAha', '')}", 8, "var(--review-note)",
            700, mono=True)
    sh.text(x + w - 7, y + 14, "只预览 · 应用到存档 · 返回真实进度", 7.5, "var(--review-note)", 500,
            anchor="end")
    return y + 26


def e_actstrip(sh, x, y, w, s):
    cols = max(1, s["layout"]["acts"])
    n = len(s["acts"])
    gap = 4
    cw = (w - (cols - 1) * gap) / cols
    for i, act in enumerate(s["acts"]):
        col, row = i % cols, i // cols
        cx, cy = x + col * (cw + gap), y + row * 28
        fill = ("var(--green)" if act["state"] == "current"
                else "var(--surface-4)" if act["state"] == "done" else "var(--panel)")
        sh.box(cx, cy, cw, 25, fill=fill,
               stroke="var(--ink)" if act["state"] == "current" else "var(--line)",
               sw=1.4 if act["state"] == "current" else 1)
        sh.text(cx + 4, cy + 11, clip(act["text"], int(cw / 4.2)), 6.4, "var(--ink)", 700)
        sh.text(cx + 4, cy + 20, act["range"], 5.8, "var(--muted)", 500, mono=True)
    return y + ((n + cols - 1) // cols) * 28


def e_acthead(sh, x, y, w, s):
    sh.text(x, y + 9, s["actKicker"], 7.5, "var(--rust)", 900, mono=True)
    sh.text(x, y + 28, clip(s["actTitle"], int(w / 11)), 17, "var(--ink)", 900, family=SERIF)
    y += 34
    for line in wrap(s["actCopy"], int(w / 8.2))[:3]:
        sh.text(x, y + 8, line, 8.5, "var(--muted)", 500)
        y += 11
    return y + 6


def e_metrics(sh, x, y, w, s):
    shown = [m for m in s["metrics"] if not m["hidden"]]
    if not shown:
        return y
    cols = max(1, min(s["layout"]["metrics"], len(shown)))
    gap = 6
    cw = (w - (cols - 1) * gap) / cols
    for i, m in enumerate(shown):
        col, row = i % cols, i // cols
        cx, cy = x + col * (cw + gap), y + row * 32
        sh.box(cx, cy, cw, 28, fill="var(--green)" if m["primary"] else "var(--surface-4)",
               stroke="var(--line)", sw=1)
        sh.text(cx + 6, cy + 11, clip(m["label"], int(cw / 7)), 7, "var(--muted)", 700, mono=True)
        sh.text(cx + 6, cy + 24, clip(m["value"], int(cw / 8)), 14, "var(--ink)", 700, mono=True)
    return y + ((len(shown) + cols - 1) // cols) * 32


def e_ahafocus(sh, x, y, w, s):
    h = 42
    sh.box(x, y, w, h, fill="var(--surface-focus)", stroke="var(--line)", sw=1)
    sh.add(f'<rect x="{x}" y="{y}" width="4" height="{h}" fill="var(--rust)"/>')
    sh.text(x + 10, y + 13, s["ahaId"], 7, "var(--rust)", 900, mono=True)
    sh.text(x + 10, y + 27, clip(s["ahaTitle"], int(w / 11)), 12, "var(--ink)", 900, family=SERIF)
    sh.text(x + 10, y + 38, clip(s["ahaCopy"], int(w / 7.6)), 7.5, "var(--muted)", 500)
    return y + h + 10


def e_actions(sh, x, y, w, s):
    cols = max(1, s["layout"]["actions"])
    gap = 6
    cw = (w - (cols - 1) * gap) / cols
    rows = (len(s["actions"]) + cols - 1) // cols
    heights = []
    for r in range(rows):
        band = s["actions"][r * cols:(r + 1) * cols]
        heights.append(30 if any(a["sub"] for a in band) else 24)
    offsets = [y + sum(h + 4 for h in heights[:r]) for r in range(rows)]
    for i, a in enumerate(s["actions"]):
        col, row = i % cols, i // cols
        cx, cy, h = x + col * (cw + gap), offsets[row], heights[row]
        if a["major"]:
            fill, ink = "var(--ink)", "var(--green)"
        elif a["danger"]:
            fill, ink = "var(--danger-bg)", "var(--danger-ink)"
        elif a["disabled"]:
            fill, ink = "var(--panel)", "var(--muted)"
        else:
            fill, ink = "var(--panel)", "var(--ink)"
        sh.box(cx, cy, cw, h, fill=fill,
               stroke="var(--line)" if a["disabled"] else "var(--ink)", sw=1.2,
               dash="3 2" if a["disabled"] else None, shadow=a["major"] and not a["disabled"])
        sh.text(cx + 7, cy + 14, clip(a["label"], int(cw / 7.2)), 9.5, ink, 700)
        if a["disabled"]:
            sh.text(cx + cw - 7, cy + 14, "disabled", 6.5, "var(--muted)", 700, mono=True, anchor="end")
        if a["sub"]:
            sh.text(cx + 7, cy + 25, clip(a["sub"], int(cw / 4.6)), 7, ink, 500, opacity=0.75)
    return y + sum(heights) + 4 * (rows - 1) if rows else y


def e_world(sh, x, y, w, s, force_h=None):
    rows = len(s["world"])
    cols = max(1, min(s["layout"]["world"], rows or 1))
    grid = ((rows + cols - 1) // cols) * 20
    gh = 54
    base = 20 + gh + grid
    slack = 0
    if force_h:                     # the desktop hero stretches this card to the row height
        slack = max(0, force_h - base)
        gh += min(slack, 90)        # let the skyline grow a little, then push the numbers down
        slack -= min(slack, 90)
    h = 20 + gh + grid + slack
    sh.box(x, y, w, h, fill="var(--world-cell)", stroke="var(--ink)", sw=1.4)
    sh.text(x + 7, y + 13, "WORLD MODEL / 世界模型", 6.8, "var(--world-label)", 700, mono=True)
    sh.text(x + w - 7, y + 13, s["worldScale"], 7.2, "var(--green)", 700, mono=True, anchor="end")
    skyline(sh, x + 3, y + 20, w - 6, gh, s["worldScale"] == "静默")
    wy = y + 20 + gh + slack
    cw = w / cols
    for i, cell in enumerate(s["world"]):
        col, row = i % cols, i // cols
        cx = x + col * cw
        sh.text(cx + 7, wy + row * 20 + 10, clip(cell["label"], int(cw / 4.4)), 7, "var(--world-label)", 500, mono=True)
        sh.text(cx + 7, wy + row * 20 + 18, clip(cell["value"], int(cw / 7)), 10.5, "var(--green)",
                700, mono=True)
    return y + h + 10


def skyline(sh, x, y, w, h, stopped):
    steps = [(0, .55), (.1, .62), (.2, .72), (.32, .78), (.43, .88), (.58, 1.0), (.67, .8),
             (.8, .72), (.91, 1.0)]
    pts = [f"{x:.0f},{y + h:.0f}"]
    for frac, top in steps:
        pts.append(f"{x + w * frac:.0f},{y + h * (1 - top * 0.95):.0f}")
    pts.append(f"{x + w:.0f},{y + h:.0f}")
    sh.add(f'<polygon points="{" ".join(pts)}" fill="var(--world-block)" opacity=".85"/>')
    sh.add(f'<line x1="{x:.0f}" y1="{y + h:.0f}" x2="{x + w:.0f}" y2="{y + h:.0f}" '
           f'stroke="var(--world-soil)" stroke-width="2"/>')
    if not stopped:
        sh.add(f'<circle cx="{x + w * 0.3:.0f}" cy="{y + h * 0.42:.0f}" r="11" fill="none" '
               f'stroke="var(--green)" stroke-width="2.5"/>')
    glyphs = ["……"] if stopped else ["字", "→", "林", "→", "◫"]
    for i, g in enumerate(glyphs):
        sh.text(x + w - 12, y + 16 + i * 11, g, 22 if stopped else 11, "var(--green)", 900,
                family=SERIF, anchor="end")


def e_systems(sh, x, y, w, s):
    """Machines panel plus the AHA MOMENTS head -- both live in #systems-panel."""
    started = y
    if s["machines"]:
        sh.text(x, y + 11, s["systemsTitle"], 10, "var(--ink)", 900)
        sh.text(x + w, y + 11, clip(s["systemsNote"], int(w / 4.6)), 7, "var(--muted)", 500, anchor="end")
        y += 18
        cols = max(1, min(s["layout"]["machines"], len(s["machines"])))
        gap = 6
        cw = (w - (cols - 1) * gap) / cols
        # 卡片排法照真机：名称一行、详情一行、按钮**整宽独占一行**。
        # 原来按钮压在详情那一行上（详情基线 cy+25、按钮 cy+18..32）。窄画布下详情会被 clip
        # 到 20 个字符、省略号看得见；宽画布下 `cw/4.4` 放得下整行，于是价格被按钮直接盖掉——
        # 一张声称「照着真实读数重绘」的图，画出了读数里没有的东西。真机上是换行 + 按钮在下。
        card_h, pitch = 46, 50
        for i, m in enumerate(s["machines"]):
            col, row = i % cols, i // cols
            cx, cy = x + col * (cw + gap), y + row * pitch
            sh.box(cx, cy, cw, card_h - 6, fill="var(--surface-4)", stroke="var(--line)", sw=1)
            sh.text(cx + 7, cy + 12, clip(m["name"], int(cw / 8)), 10, "var(--ink)", 700)
            sh.text(cx + 7, cy + 23, clip(m["detail"], int(cw / 4.4)), 7, "var(--muted)", 500, mono=True)
            sh.box(cx + 6, cy + 27, cw - 12, 13, fill="var(--panel)", stroke="var(--line)", sw=1,
                   dash="3 2" if m["disabled"] else None)
            sh.text(cx + cw / 2, cy + 36.5, m["label"], 7.5,
                    "var(--muted)" if m["disabled"] else "var(--ink)", 700, anchor="middle")
        y += ((len(s["machines"]) + cols - 1) // cols) * pitch - (pitch - card_h)
    if s["blocks"]["ahaHead"]:
        if y > started:
            sh.hline(x, y + 6, w, "var(--line)")
            y += 14
        sh.text(x, y + 12, "AHA MOMENTS · 28", 8.5, "var(--ink)", 900, mono=True)
        sh.text(x + w, y + 12, s["ahaCount"], 8.5, "var(--muted)", 700, mono=True, anchor="end")
        y += 18
        sh.text(x, y + 9, f"目录已展开 {len(s['ahas'])} 项（评审面专用）", 7.5, "var(--muted)", 500)
        y += 15
    return y


def e_log(sh, x, y, w, s):
    if not s["log"]:
        return y
    lines = [clip(v, int(w / 4.4)) for v in s["log"][:3]]
    h = 18 + len(lines) * 12
    sh.box(x, y, w, h, fill="var(--ink)", stroke="var(--ink)", sw=1.4)
    sh.text(x + 7, y + 12, s["logTitle"], 7.5, "var(--log-ink)", 700)
    for i, line in enumerate(lines):
        sh.text(x + 7, y + 26 + i * 12, f"{'›' if i == 0 else '·'} {line}", 7.5,
                "var(--log-ink)" if i == 0 else "var(--world-label)", 500, mono=True)
    return y + h + 10


def e_ending(sh, x, y, w, s):
    h = 60
    sh.box(x, y, w, h, fill="var(--ending-bg)", stroke="var(--ink)", sw=2.5)
    cx = x + w / 2
    sh.text(cx, y + 15, "A28 · THE LAST BUTTON", 6.8, "var(--rust)", 900, mono=True, anchor="middle")
    sh.text(cx, y + 36, s["endingTitle"], 18, "var(--ink)", 900, family=SERIF, anchor="middle")
    sh.text(cx, y + 51, s["endingBody"], 9.5, "var(--muted)", 500, anchor="middle")
    return y + h + 8


def e_footer(sh, x, y, w, s):
    sh.hline(x, y + 4, w, "var(--line)")
    sh.text(x, y + 19, clip(s["saveStatus"], int(w / 12)), 6.8, "var(--muted)", 500, mono=True)
    bx = x + w
    for label in (s["resetLabel"], s["exportLabel"]):
        bw = 7.5 * len(label) + 12
        bx -= bw + 5
        sh.box(bx, y + 6, bw, 18, fill="var(--panel)", stroke="var(--line)", sw=1)
        sh.text(bx + bw / 2, y + 18, label, 7.5, "var(--ink)", 700, anchor="middle")
    return y + 30


# ------------------------------------------------------------------ compositions


def build_narrow(s, w, pad):
    inner = w - 2 * pad
    sh = Sheet()
    y = pad
    b = s["blocks"]
    if b["masthead"]:
        y = e_masthead(sh, pad, y, inner, s) + 6
    if b["statusline"]:
        y = e_status(sh, pad, y, inner, s) + 4
    if b["director"]:
        y = e_director(sh, pad, y, inner, s) + 8
    if b["actStrip"] and s["acts"]:
        y = e_actstrip(sh, pad, y, inner, s) + 8
    if b["actHead"]:
        y = e_acthead(sh, pad, y, inner, s)
    if b["metrics"]:
        y = e_metrics(sh, pad, y, inner, s) + 10
    if b["ahaFocus"]:
        y = e_ahafocus(sh, pad, y, inner, s)
    if b["actions"] and s["actions"]:
        y = e_actions(sh, pad, y, inner, s) + 10
    if b["world"]:
        y = e_world(sh, pad, y, inner, s)
    if b["systems"]:
        y = e_systems(sh, pad, y, inner, s) + 10
    if b["logPanel"]:
        y = e_log(sh, pad, y, inner, s)
    if b["ending"]:
        y = e_ending(sh, pad, y, inner, s)
    if b["footer"]:
        y = e_footer(sh, pad, y, inner, s)
    return sh, y + pad


def build_wide(s, w, pad):
    """The 1280 surface really is two columns in the hero and in the row below it."""
    inner = w - 2 * pad
    sh = Sheet()
    y = pad
    b = s["blocks"]
    if b["masthead"]:
        y = e_masthead(sh, pad, y, inner, s) + 6
    if b["statusline"]:
        y = e_status(sh, pad, y, inner, s) + 4
    if b["director"]:
        y = e_director(sh, pad, y, inner, s) + 8
    if b["actStrip"] and s["acts"]:
        y = e_actstrip(sh, pad, y, inner, s) + 10

    gap = 12
    left_w = round((inner - gap) * 0.56)
    right_w = inner - gap - left_w

    # hero: game card | world card
    sub = Sheet()
    ly = y + 10
    if b["actHead"]:
        ly = e_acthead(sub, 0, ly, left_w - 20, s)
    if b["metrics"]:
        ly = e_metrics(sub, 0, ly, left_w - 20, s) + 10
    if b["ahaFocus"]:
        ly = e_ahafocus(sub, 0, ly, left_w - 20, s)
    if b["actions"] and s["actions"]:
        ly = e_actions(sub, 0, ly, left_w - 20, s) + 10
    left_h = ly - y + 10

    hero_h = max(left_h, right_h := (left_h if b["world"] else 0))
    # Bound unconditionally: the second column is painted below whether or not a world card
    # produced content for it, and leaving it unbound crashes on a wide screen without one.
    sub2 = Sheet()
    if b["world"]:
        e_world(sub2, 0, y + 10, right_w - 20, s, force_h=hero_h - 20)

    sh.box(pad, y, left_w, hero_h, fill="var(--panel)", stroke="var(--ink)", sw=2, shadow=True)
    sh.box(pad + left_w + gap, y, right_w, hero_h, fill="var(--panel)", stroke="var(--ink)", sw=2,
           shadow=True)
    sh.add(shift(sub.parts, pad + 10))
    sh.add(shift(sub2.parts, pad + left_w + gap + 10))
    y += hero_h + 14

    # below: systems panel | log panel
    if b["systems"] or b["logPanel"]:
        sub3 = Sheet()
        by = y + 10
        if b["systems"]:
            by = e_systems(sub3, 0, by, left_w - 20, s) + 10
        if b["logPanel"]:
            by = e_log(sub3, 0, by, left_w - 20, s)
        below_left_h = by - y + 10

        sub4 = Sheet()
        by2 = y + 10
        if b["logPanel"]:
            by2 = e_log(sub4, 0, by2, right_w - 20, s)
        below_right_h = by2 - y + 10
        below_h = max(below_left_h if b["systems"] else 0, below_right_h)

        if b["systems"]:
            sh.box(pad, y, left_w, below_h, fill="var(--panel)", stroke="var(--ink)", sw=1.6)
            sh.add(shift(sub3.parts, pad + 10))
        if b["logPanel"]:
            sh.box(pad + left_w + gap, y, right_w, below_h, fill="var(--panel)", stroke="var(--ink)", sw=1.6)
            sh.add(shift(sub4.parts, pad + left_w + gap + 10))
        y += below_h + 12

    if b["ending"]:
        y = e_ending(sh, pad, y, inner, s)
    if b["footer"]:
        y = e_footer(sh, pad, y, inner, s)
    return sh, y + pad


def flow_article(f):
    """一条流程 = 读数 + 生成出来的步骤表。

    步骤表不再手写：手写过一次，重排之后里面还留着「viral-word 送 750 读者」，
    而页面照旧印着。现在它来自 `node scripts/flows/flows.mjs`，那份从引擎现算，
    所以要改的是引擎或那个脚本，不是这里的 HTML。
    """
    shots = "".join(
        f'<figure><img src="shots/{sid.lower()}.png" alt="{sid}" loading="lazy" '
        f'width="780" height="1688"><figcaption><b>{sid}</b>{name}</figcaption></figure>'
        for sid, name in ((s, next(x["name"] for x in SCREENS if x["id"] == s)) for s in f["screens"]))
    rows = "".join(
        "<tr><td class=\"n\">{i}</td><td class=\"cmd\">{label} · {cmd}</td>"
        "<td class=\"n\">{cost}</td><td class=\"gate\">{gives}</td></tr>".format(
            i=i, label=esc(step["label"]), cmd=esc(step["cmd"]),
            cost=esc(step["cost"]) or "—", gives=esc(step["gives"]) or "—")
        for i, step in enumerate(f["steps"], 1))
    exit_note = " · ".join(esc(x) for x in f["exit"]) or "—"
    return f"""  <article class="flow">
    <div class="flow-head"><span class="fid">{f['fid']}</span><h3>ACT {ROMAN[f['act']]} · {esc(f['title'])}</h3>
      <span class="stat"><span class="chip">屏幕 <b>{'→'.join(f['screens'])}</b></span><span class="chip">{esc(f['range'])}</span><span class="chip">{f['ahas']} 个 Aha</span><span class="chip">实测 <b>首末 Aha 之间 {f['decisions']} 次决策 / {f['seconds']} 秒</b></span></span></div>
    <div class="strip">
{shots}
    </div>
    <div class="tw"><table>
      <thead><tr><th>步</th><th>热点</th><th>代价</th><th>这一步之后</th></tr></thead>
      <tbody>
{rows}
      </tbody>
    </table></div>
    <p class="cap">离开这一幕需要：<b>{exit_note}</b>。代价一列取的是<b>第一次按</b>那一刻的价钱——
    推钟动词的代价随按次递增，写平均数等于写一个没人见过的数。</p>
  </article>"""


ROMAN = {1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI"}


def shift(parts, dx):
    """Move a panel's blocks sideways. A group transform, not attribute rewriting: a
    polygon's `points` is a coordinate list no per-attribute regex can offset safely."""
    return f'<g transform="translate({dx:.1f},0)">' + "".join(parts) + "</g>"


def facts_of(s):
    """每一屏说明里那排标签，从 `screens.json` 的读数生成，不手写。

    手写过一轮，已经烂过两处：P04 的标签还写着「机器面板消失」，而这一屏的读数里
    机器卡是**在**的（机器面板在 2026-09-21 修好了，标签没跟着改）；P07 写着「仅 1 个动作」，
    而读数里是 4 个（推钟动词和微事件都是那之后加的）。两处都是「一张图在说自己读数里没有的事」，
    也就是这份图谱存在的唯一理由的反面。所以判据很简单：**凡是从读数上量得出来的，就不许手写。**
    手写的那部分只剩 `<h4>` 和 `why` 里那句解读。
    """
    layout = s["layout"]
    labels = [m["label"] for m in s["metrics"] if not m["hidden"]]
    live = sum(1 for a in s["actions"] if not a["disabled"])
    stock = "库存文字" in labels
    machines = s["machines"]
    return [
        ("on" if layout["hero"] >= 2 else "off", "hero 双栏" if layout["hero"] >= 2 else "hero 单栏"),
        ("on", f"地图 {s['worldScale']}"),
        ("on" if stock else "off",
         f"库存文字 在（{len(labels)} 项指标）" if stock else f"库存文字 已退场（余 {len(labels)} 项）"),
        ("on" if machines else "off", f"机器 {len(machines)} 台 · 面板在" if machines else "无机器面板"),
        ("on" if live else "off", f"动作 {len(s['actions'])} 个 · 可点 {live} 个"),
    ]


def facts_markup(s):
    cells = "".join(f'<li class="{cls}">{esc(text)}</li>' for cls, text in facts_of(s))
    return f'<ul class="facts">{cells}</ul>'


def build(s):
    wide = s["layout"]["hero"] >= 2
    w, pad = (620, 14) if wide else (300, 12)
    sh, height = build_wide(s, w, pad) if wide else build_narrow(s, w, pad)
    label = f"{s['id']} {s['name']} — {s['note']}"
    note = f"{'评审面' if s['surface'] == 'review' else '玩家面'} · {s['viewport']} · 按真实 DOM 读数重绘"
    return sh.finish(w, height, label, note), wide


def main():
    html = TEMPLATE.read_text()
    by_id = {s["id"].lower(): s for s in SCREENS}
    used = set()

    def replace(match):
        sid = match.group(1).lower()
        if sid not in by_id:
            raise SystemExit(f"no captured state for {sid}")
        used.add(sid)
        svg, wide = build(by_id[sid])
        return ('<span class="wideframe">' + svg + "</span>") if wide else svg

    by_flow = {f["fid"]: f for f in FLOWS}
    def fill_flow(match):
        fid = match.group(1)
        if fid not in by_flow:
            raise SystemExit(f"flows.json 里没有 {fid}")
        used.add("flow:" + fid)
        return flow_article(by_flow[fid])

    def fill_facts(match):
        sid = match.group(1).lower()
        if sid not in by_id:
            raise SystemExit(f"no captured state for {sid}（说明里那排标签没有读数可生成）")
        used.add("facts:" + sid)
        return facts_markup(by_id[sid])
    # 候选哈希由生成时现取。写死过一次（审计当时的提交），页面顶上挂着一个早就不是当前树的
    # 哈希，比不写更糟。
    #
    # 它是**构建基准**，不是本页所在的那次提交：本页和它的构建脚本住在同一个提交里，
    # 所以那次提交的哈希不可能在按下「生成」之前就知道。不注明的话，读者会拿它去对
    # 当前 HEAD，然后发现对不上——模板里现在写着「构建基准」三个字，就是为了这个。
    head = subprocess.run(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT,
                          capture_output=True, text=True).stdout.strip() or "unknown"
    out = re.sub(r"<!-- FLOW:(F\d\d) -->", fill_flow, html)
    out = re.sub(r"<!-- FACTS:(\w+) -->", fill_facts, out)
    out = out.replace("<!-- SHA -->", f"<b>{head}</b>")
    for marker in ("<!-- FLOW:", "<!-- FACTS:", "<!-- SHA"):
        if marker in out:
            raise SystemExit(f"还有没被填上的标记：{marker}")
    # 每一屏都必须有生成的那排标签。少了就是新加了一屏却没挂标记，那一屏会退回手写——
    # 而手写正是这次要根除的东西。
    no_facts = set(by_id) - {u.split(":", 1)[1] for u in used if u.startswith("facts:")}
    if no_facts:
        raise SystemExit(f"这几屏的说明标签没有挂 <!-- FACTS:xx --> 标记：{sorted(no_facts)}")
    out = re.sub(r"<img src=\"shots/(\w+)\.png\"[^>]*>", replace, out)
    if 'src="shots/' in out:
        raise SystemExit("an <img> pointing at a snapshot survived the rebuild")
    missing = set(by_id) - {u for u in used if u in by_id}
    if missing:
        raise SystemExit(f"captured but unused: {sorted(missing)}")
    OUTPUT.write_text(out)
    print(f"wrote {OUTPUT.name}: {len(out) // 1024} KB, {len(used)} SVG rebuilds, {len(FLOWS)} generated flows, 0 snapshots")


if __name__ == "__main__":
    main()
