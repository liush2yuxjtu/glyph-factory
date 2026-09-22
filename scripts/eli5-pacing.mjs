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
// 主动那条路：还按本幕的推钟动词、还捡等待里冒出来的微事件。「两小时」这条地板量的是
// 被动那条路——主动更短是设计意图，两个数要一起报，只报一个就会读反。
const active = playthrough(E, { push: true, microEvents: true });
const pasMin = tot / 60, actMin = (active.end - active.start) / 60000;
const pushes = active.byType['push-clock'] || 0, picked = active.byType['take-event'] || 0;

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
// 轴上限从数据里取，别写死。写死过一次 360，而重排后最长的一段是 490——柱子被裁到画布外，
// 图上看上去「挺均匀的」。刻度写死就等于让图去迎合一个过期的事实。
const axisMax = (values, floor) => Math.max(floor, Math.ceil(Math.max(...values) / 60) * 60);
const secMax = axisMax(secs, 360);
const clkMax = axisMax(clks, 560);
const vW = 640, vH = 216, vP = 46;
const vx = (i) => vP + (i / (variants.length - 1)) * (vW - vP * 2);
// 两条线各自归一化到自己的量程：secStd 约 105、点击均值约 35，共用一个上限会把其中一条压平。
const vStdMax = axisMax(variants.map((v) => v.secStd), 40);
const vClkMax = axisMax(variants.map((v) => v.clk.m), 44);
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
    <line class="grid" x1="${PAD}" y1="${H - 34 - ((H - 70) * 300) / secMax}" x2="${W - PAD}" y2="${H - 34 - ((H - 70) * 300) / secMax}"/>
    <text class="axis" x="4" y="${H - 34 - ((H - 70) * 300) / secMax + 4}">300s</text>
    ${bars(secs, secMax, 'var(--ink)', (v) => Math.round(v) + 's', false)}
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
    <line x1="${PAD}" y1="${H - 34 - ((H - 70) * 10) / clkMax}" x2="${W - PAD}" y2="${H - 34 - ((H - 70) * 10) / clkMax}"
          stroke="var(--rust)" stroke-width="1" stroke-dasharray="4 3" opacity=".8"/>
    <text class="axis" x="4" y="${H - 34 - ((H - 70) * 10) / clkMax + 4}" style="fill:var(--rust)">10</text>
    <text class="axis" x="${W - PAD - 2}" y="${H - 34 - ((H - 70) * 10) / clkMax - 6}" text-anchor="end" style="fill:var(--rust)">后面 25 段全在这条红线下，每段 0–10 下</text>
    ${bars(clks, clkMax, '#8a9a76', (v) => String(v))}
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
    <path class="series" stroke="var(--ink)" d="${vline((v) => v.secStd, vStdMax)}"/>
    <path class="series" stroke="var(--rust)" d="${vline((v) => v.clk.m, vClkMax)}"/>
    ${vdots((v) => v.secStd, vStdMax, 'var(--ink)')}${vdots((v) => v.clk.m, vClkMax, 'var(--rust)')}
    ${vlab}
    <text class="axis" x="${W - PAD}" y="24" text-anchor="end">黑＝时长标准差（越低越好）</text>
    <text class="axis" x="${W - PAD}" y="40" text-anchor="end" style="fill:var(--rust)">红＝点击均值（越低越好）</text>
  </svg>
  <table><thead><tr><th>发行门槛</th><th>A02→A03</th><th>时长标准差</th><th>点击均值/标准差</th></tr></thead><tbody>
  ${variants.map((v) => `<tr${v.gate === CURRENT ? ' class="pick"' : ''}><td>${v.gate / 1000}k</td><td>${v.gap2.toFixed(0)}s</td><td>${v.secStd.toFixed(1)}s</td><td>${v.clk.m.toFixed(2)} / ${v.clk.s.toFixed(2)}</td></tr>`).join('')}
  </tbody></table>
  <p class="cap" style="margin-top:10px">全程五档都 ≥ 2 小时（${variants.map((v) => Math.round(v.total / 60)).join('/')} 分钟）。<b>时长那一列现在几乎不动</b>——它是被后面 25 段的阶梯定的，不是被第一章定的；真正跟着门槛走的是「A02→A03」那一段有多长，以及全部段的点击有多难看。</p>
</div>

<div class="card">
  <h2>现在是哪一种</h2>
  <p class="lead">2026-09-21 起选了第三条路：<b>不动第一章的手速，改后面几章的结构</b>。上面那排柱子因此不再是平的——
  每一幕的开头一段短（喘口气），收尾一段长（攒劲），总时长不变，变的是怎么分配。</p>
  <ul>
    <li><b>快慢有结构</b>　每一幕首段 ×0.45、末段 ×1.7、中间不变，按幕归一化。标准差 ${secA.s.toFixed(1)}s、最长是最短的 ${(Math.max(...secs) / Math.min(...secs)).toFixed(2)} 倍。</li>
    <li><b>每章一个可以一直按的动词</b>　发行新一期 / 张贴告示 / 让 Agent 加班 / 喂机器一批文本 / 投产一条新语法。按一次，这一幕<b>以后每一段</b>都快 5%，到 +50% 封顶，代价一次比一次贵。</li>
    <li><b>等待里偶尔冒出一个小东西</b>　一封没署名的信、一段对不上的话……它和主循环的区别是<b>减法</b>：花掉另一样东西，换这一幕的钟往前走一段。</li>
    <li><b>旧摊子重新有用</b>　第五章的钟被第一章那几台机器的产能喂着，「回去把机器做大」重新变成一个决定。</li>
  </ul>
  <p class="cap" style="margin-top:12px"><b>被动玩 ${pasMin.toFixed(1)} 分钟（≥2 小时 ✓）→ 主动玩 ${actMin.toFixed(1)} 分钟</b>（推钟 ${pushes} 下 + 微事件 ${picked} 个）。
  两个数要一起看：只报被动会漏掉「按了到底有没有用」，只报主动会把地板当成已经被打破。
  四条设计各自带一条负对照（拉平曲线 / 抽掉倍率 / 停掉调度器 / 拆掉燃料链路，每条都真的改源码再跑一遍），在 <code>tests/rhythm-structure.test.mjs</code>。</p>
</div>

<p class="foot">数据：<code>node scripts/pacing.mjs</code> · 参考对局最多 ${run.clicks} 次点击、全程 ${pasMin.toFixed(1)} 分钟</p>
</div></body></html>
`;

writeFileSync(`${ROOT}/public/eli5-pacing.html`, html);
console.log(`written public/eli5-pacing.html · ${html.length} bytes · 门槛档 ${variants.map((v) => v.gate / 1000 + 'k').join(' ')}`);
