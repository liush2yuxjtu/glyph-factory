// 生成 public/eli5-pacing.html：给非工程读者看的一张图——同样的 27 段，两种 Y 轴。
//
//   node scripts/eli5-pacing.mjs
//
// 数字全部从参考对局现算，一个都不手抄：手抄 27 个数迟早会有一个和引擎对不上，
// 而这张图存在的意义就是「它是真的」。改完引擎跑一遍就行。
//
// 为什么值得单独画：按秒看是一排平齐的柱子，按点击看是两根尖峰吃掉 91%。
// 同一局、同一批 27 段——这个对照用嘴说不清楚，画出来一眼就懂。
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEngine, playthrough, pacingReport } from '../tests/pacing.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const E = loadEngine();
const run = playthrough(E);
const d = pacingReport(E, run, 'decisions');
const c = pacingReport(E, run, 'clicks');
const list = d.list;
const st = (xs) => { const m = xs.reduce((a, b) => a + b, 0) / xs.length; return { m, s: Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length) }; };
const rest = (arr) => list.filter((g) => g.from !== 'A01' && g.from !== 'A02').map(arr);

const W = 640, H = 190, PAD = 34, BAR = (W - PAD * 2) / list.length;
const bars = (vals, max, colour, fmtv, labelSpikes = true) => list.map((g, i) => {
  const h = Math.max(2, (vals[i] / max) * (H - 70));
  const x = PAD + i * BAR + BAR * 0.16, bw = BAR * 0.68, y = H - 34 - h;
  const spike = vals[i] >= (max / 4);
  const showLabel = labelSpikes && spike;
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" fill="${spike ? 'var(--rust)' : colour}" rx="1.5"><title>${g.from}→${g.to}　${fmtv(vals[i])}</title></rect>`
    + (showLabel ? `<text x="${(x + bw / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" class="spike">${fmtv(vals[i])}</text>` : '');
}).join('');

const secs = list.map((g) => g.seconds), clks = c.list.map((g) => g.gap);
const secA = st(secs), clkA = st(clks), clkR = st(rest((g) => c.list.find((x) => x.to === g.to).gap));
const tot = d.totalSeconds;
const pct = Math.round(((clks[0] + clks[1]) / run.clicks) * 100);

// 把 27 段按幕切成竖带，让「第一章只有两段」这件事在图上看得见。
const bands = [];
for (let act = 1; act <= 6; act++) {
  const idx = list.map((g, i) => (g.act === act ? i : -1)).filter((i) => i >= 0);
  if (!idx.length) continue;
  const x = PAD + Math.min(...idx) * BAR, w = (Math.max(...idx) - Math.min(...idx) + 1) * BAR;
  bands.push(`<rect x="${x.toFixed(1)}" y="12" width="${w.toFixed(1)}" height="${H - 46}" class="band${act % 2 ? '' : ' alt'}"/>`
    + `<text x="${(x + w / 2).toFixed(1)}" y="${H - 20}" text-anchor="middle" class="actlab">ACT ${act}</text>`);
}

// 锚点从引擎自己身上取：ACT_GATES[1] 的 lifetimeGlyphs 现值。写死 'need:32000,' 的话，
// 哪天有人调了门槛，这张图会静默地画成「所有档都一样」。
const CURRENT = E.ACT_GATES[1][0].need;
const variants = [14000, 18000, 22000, 26000, 32000].map((gate) => {
  const src = readFileSync(`${ROOT}/public/glyph-engine-v3.js`, 'utf8').replace(`need:${CURRENT},`, `need:${gate},`);
  const e2 = new Function(`${src}\nreturn GlyphEngineV3;`)();
  const r2 = playthrough(e2);
  const dd = pacingReport(e2, r2, 'decisions'), cc = pacingReport(e2, r2, 'clicks');
  return { gate, secStd: dd.secondsStd, secCv: dd.secondsCv, clk: st(cc.list.map((x) => x.gap)), total: dd.totalSeconds, gap2: dd.list[1].seconds };
});
const vW = 640, vH = 216, vP = 46;
const vx = (i) => vP + (i / (variants.length - 1)) * (vW - vP * 2);
const vline = (get, max, colour) => variants.map((v, i) => `${i ? 'L' : 'M'}${vx(i).toFixed(1)},${(vH - 40 - (get(v) / max) * (vH - 76)).toFixed(1)}`).join(' ');
const vdots = (get, max, colour) => variants.map((v, i) =>
  `<circle cx="${vx(i).toFixed(1)}" cy="${(vH - 40 - (get(v) / max) * (vH - 76)).toFixed(1)}" r="3.5" fill="${colour}"/>`).join('');
const vlab = variants.map((v, i) => `<text x="${vx(i).toFixed(1)}" y="${vH - 26}" text-anchor="middle" class="actlab">${v.gate / 1000}k</text>`).join('')
  + `<text class="axis" x="${vP}" y="${vH - 8}" text-anchor="start">← 教程越短</text>`
  + `<text class="axis" x="${vW - vP}" y="${vH - 8}" text-anchor="end">教程越长 →</text>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>两条 Aha 之间：等了多久、按了多少下</title>
<style>
:root{--ink:#17201a;--paper:#efe9d8;--panel:#fffaf0;--muted:#657064;--line:#bcc4ae;
--green:#c8ef70;--rust:#a34e34;--surface:#f4f1e4;--stage:#cfd4c2}
*{box-sizing:border-box}
body{margin:0;background:var(--stage);color:var(--ink);
font:15px/1.65 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;
padding:28px 18px 60px}
.wrap{max-width:720px;margin:0 auto}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px 22px 16px;margin:0 0 18px}
h1{font-size:clamp(24px,4vw,34px);line-height:1.2;margin:0 0 6px;letter-spacing:.01em}
h2{font-size:17px;margin:0 0 4px}
.sub{color:var(--muted);font-size:13px;margin:0 0 16px}
.cap{color:var(--muted);font-size:12px;margin:2px 0 0}
svg{width:100%;height:auto;display:block}
.band{fill:var(--surface)}.band.alt{fill:#faf7ec}
.actlab{font-size:10px;fill:var(--muted)}
.spike{font-size:11px;fill:var(--rust);font-weight:700}
.axis{font-size:11px;fill:var(--muted)}
.grid{stroke:var(--line);stroke-width:.6;stroke-dasharray:3 3;fill:none}
.rule{stroke:var(--ink);stroke-width:.8;fill:none}
.series{fill:none;stroke-width:2.2}
.big{display:flex;gap:14px;flex-wrap:wrap;margin:4px 0 0}
.box{flex:1 1 190px;background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.box.hot{background:#f7e7df;border-color:#d8b3a3}
.box b{display:block;font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.04em;margin:0 0 8px}
.box .n{font-size:26px;font-weight:700;letter-spacing:-.01em}
.box .n small{font-size:13px;font-weight:500;color:var(--muted);margin-left:6px}
table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
th,td{text-align:right;padding:7px 6px;border-bottom:1px solid var(--line)}
th:first-child,td:first-child{text-align:left}
thead th{font-size:11px;color:var(--muted);font-weight:600;letter-spacing:.03em}
tr.pick td{background:var(--green)}
ol{margin:6px 0 0;padding-left:22px}li{margin:9px 0}
li b{font-weight:700}.cost{color:var(--rust)}
.foot{color:var(--muted);font-size:12px;text-align:center;margin:22px 0 0}
</style></head><body><div class="wrap">

<div class="card">
  <h1>两条 Aha 之间：等了多久、按了多少下</h1>
  <p class="sub">同 27 段，同一局。上面一张是「等了几秒」，下面一张是「按了几下」——两张图共用横轴。</p>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="27 段间隔的秒数与点击数">
    ${bands.join('')}
    <line class="grid" x1="${PAD}" y1="${H - 34 - ((H - 70) * 300) / 360}" x2="${W - PAD}" y2="${H - 34 - ((H - 70) * 300) / 360}"/>
    <text class="axis" x="4" y="${H - 34 - ((H - 70) * 300) / 360 + 4}">300s</text>
    ${bars(secs, 360, 'var(--ink)', (v) => Math.round(v) + 's', false)}
    <line class="rule" x1="${PAD}" y1="${H - 34}" x2="${W - PAD}" y2="${H - 34}"/>
    <text class="axis" x="${W - PAD}" y="26" text-anchor="end">秒 · 均值 ${secA.m.toFixed(0)}s · 标准差 ${secA.s.toFixed(1)}s</text>
  </svg>
  <p class="cap">平的：${Math.min(...secs).toFixed(0)}–${Math.max(...secs).toFixed(0)} 秒，标准差 ${secA.s.toFixed(1)} 秒。27 根柱子挤在一起分不出高低。</p>
</div>

<div class="card">
  <h2>同样是这 27 段，换个 Y 轴</h2>
  <p class="sub">点击数（含印字、卖字这些没有选择成分的动作）。</p>
  <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="27 段间隔的点击数">
    ${bands.join('')}
    <line class="grid" x1="${PAD}" y1="${H - 34 - ((H - 70) * 500) / 560}" x2="${W - PAD}" y2="${H - 34 - ((H - 70) * 500) / 560}"/>
    <text class="axis" x="4" y="${H - 34 - ((H - 70) * 500) / 560 + 4}">500</text>
    <line x1="${PAD}" y1="${H - 34 - ((H - 70) * 10) / 560}" x2="${W - PAD}" y2="${H - 34 - ((H - 70) * 10) / 560}"
          stroke="var(--rust)" stroke-width="1" stroke-dasharray="4 3" opacity=".8"/>
    <text class="axis" x="4" y="${H - 34 - ((H - 70) * 10) / 560 + 4}" style="fill:var(--rust)">10</text>
    <text class="axis" x="${W - PAD - 2}" y="${H - 34 - ((H - 70) * 10) / 560 - 6}" text-anchor="end" style="fill:var(--rust)">后面 25 段全在这条红线下，每段 0–10 下</text>
    ${bars(clks, 560, '#8a9a76', (v) => String(v))}
    <line class="rule" x1="${PAD}" y1="${H - 34}" x2="${W - PAD}" y2="${H - 34}"/>
    <text class="axis" x="${W - PAD}" y="26" text-anchor="end">点击 · 均值 ${clkA.m.toFixed(1)} · 标准差 ${clkA.s.toFixed(1)}</text>
  </svg>
  <p class="cap">两根红柱是第一章的两段，吃掉全剧 ${pct}% 的点击。</p>
</div>

<div class="card">
  <h2>所以「点击的均值/标准差」要分段报</h2>
  <div class="big">
    <div class="box hot"><b>全部 27 段 · 点击</b><div class="n">${clkA.m.toFixed(2)}<small>均值</small></div><div class="n">${clkA.s.toFixed(2)}<small>标准差</small></div></div>
    <div class="box"><b>后面 25 段 · 点击</b><div class="n">${clkR.m.toFixed(2)}<small>均值</small></div><div class="n">${clkR.s.toFixed(2)}<small>标准差</small></div></div>
  </div>
  <p class="cap" style="margin-top:14px">左边那个数说的是「教程有多长」，右边才是节奏。两条都真。</p>
</div>

<div class="card">
  <h2>要动，只能动第一章</h2>
  <p class="sub">唯一的旋钮是第一章的发行门槛（现在 ${CURRENT / 1000}k）。下面是五个值各跑一遍的实测。</p>
  <svg viewBox="0 0 ${vW} ${vH}" role="img" aria-label="门槛与时长标准差、点击均值的关系">
    <path class="series" stroke="var(--ink)" d="${vline((v) => v.secStd, 40)}"/>
    <path class="series" stroke="var(--rust)" d="${vline((v) => v.clk.m, 44)}"/>
    ${vdots((v) => v.secStd, 40, 'var(--ink)')}${vdots((v) => v.clk.m, 44, 'var(--rust)')}
    ${vlab}
    <text class="axis" x="${W - PAD}" y="24" text-anchor="end">黑＝时长标准差（越低越好）</text>
    <text class="axis" x="${W - PAD}" y="40" text-anchor="end" style="fill:var(--rust)">红＝点击均值（越低越好）</text>
  </svg>
  <table><thead><tr><th>发行门槛</th><th>A02→A03</th><th>时长标准差</th><th>点击均值/标准差</th></tr></thead><tbody>
  ${variants.map((v) => `<tr${v.gate === CURRENT ? ' class="pick"' : ''}><td>${v.gate / 1000}k</td><td>${v.gap2.toFixed(0)}s</td><td>${v.secStd.toFixed(1)}s</td><td>${v.clk.m.toFixed(2)} / ${v.clk.s.toFixed(2)}</td></tr>`).join('')}
  </tbody></table>
  <p class="cap" style="margin-top:10px">两条线反向：教程越长，时长越匀、点击越难看。全程五档都 ≥ 2 小时（${variants.map((v) => Math.round(v.total / 60)).join('/')} 分钟）。</p>
</div>

<div class="card">
  <h2>四个选项，挑一个</h2>
  <ol>
    <li><b>A · 不动（现在这样）</b>　时长最匀（18.7s / CV 0.069）；代价是全部段点击 40.48 / 131.60 一直难看。契约已经写明这个数要分段报。</li>
    <li><b>B · 门槛降到 26k</b>　点击降到 37.19 / 120.35，时长标准差涨到 21.4s。<span class="cost">A02→A03 变成 217s，落到 2σ 带外。</span></li>
    <li><b>C · 门槛降到 22k</b>　点击 35.15 / 113.62，时长标准差 24.6s。<span class="cost">那一段落得更远（188s）。</span></li>
    <li><b>D · 改第一章机制</b>　让教程的时间自己走、不用按——但这只是让「点击数」不再计入，玩家手上还在按。我不建议把它当成解法。</li>
  </ol>
  <p class="cap" style="margin-top:12px">我的建议：<b>A</b>。那两根柱子量的是「教程的长度」，不是节奏；后面 25 段在五档里几乎不动（点击 3.24–3.36 / 2.67–2.73），说明第一章动不了后面的节奏。除非你要的就是那个总数好看——那就选 B。</p>
</div>

<p class="foot">数据：<code>node scripts/pacing.mjs</code> · commit 0450ab4 · 参考对局最多 1114 次点击、全程 ${(tot / 60).toFixed(1)} 分钟</p>
</div></body></html>
`;

writeFileSync(`${ROOT}/public/eli5-pacing.html`, html);
console.log(`written public/eli5-pacing.html · ${html.length} bytes · 门槛档 ${variants.map((v) => v.gate / 1000 + 'k').join(' ')}`);
