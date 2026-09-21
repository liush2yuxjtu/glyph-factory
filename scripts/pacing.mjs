// 节奏读数：跑一遍参考对局，把相邻两条 Aha 之间的点击间隔打出来。
//
//   node scripts/pacing.mjs                      # 人读的报告
//   node scripts/pacing.mjs --json               # 机器读，给调参循环用
//   node scripts/pacing.mjs --diff <baseline>    # 和一份存下来的读数比（改门槛之后必跑）
//   node scripts/pacing.mjs --unit clicks        # 把点击那一列当主角（--diff 也切过去）
//
// 唯一真源是 tests/pacing.mjs，和 tests/game-v3.test.mjs 里的「通关」断言共用同一个驱动。
import { readFileSync } from 'node:fs';
import { loadEngine, playthrough, pacingReport } from '../tests/pacing.mjs';

const E = loadEngine();
const run = playthrough(E);
// `--unit` 只决定「哪一列是主角」：--json 与逐段表两列都给，但 --diff 比的是这一列。
// 默认 decisions——点击数那一列在第一章是「每秒两下」的量级，整局放在一起没有可比性。
const unitAt = process.argv.indexOf('--unit');
const unit = unitAt >= 0 ? (process.argv[unitAt + 1] || 'decisions') : 'decisions';
if (unit !== 'decisions' && unit !== 'clicks') {
  console.error('--unit 只认 decisions 或 clicks');
  process.exit(2);
}
const reports = { decisions: pacingReport(E, run, 'decisions'), clicks: pacingReport(E, run, 'clicks') };
const rep = reports[unit];
const raw = reports[unit === 'clicks' ? 'decisions' : 'clicks'];

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ unit, decisions: reports.decisions, clicks: reports.clicks, finished: run.stopped }, null, 2));
  process.exit(0);
}

// 比对模式。三种坏形状各有各的读法：读数变了但方向对（更好）→ 就该更新 baseline；
// 重排（两条换了位置）→ diff 里看不见的文案级改动；抱团（几条塌到 1、一条涨上去）→
// 门槛又开始重复计算同一份资源；变短（全程掉到两小时以下）→ 之前没任何断言拦得住的那种。
const diffAt = process.argv.indexOf('--diff');
if (diffAt >= 0) {
  const path = process.argv[diffAt + 1];
  if (!path) { console.error('用法: node scripts/pacing.mjs --diff <baseline.json>'); process.exit(2); }
  const base = JSON.parse(readFileSync(path, 'utf8'));
  const b = base[unit] || base.decisions;
  const label = unit === 'clicks' ? '点击' : '决策';
  const say = (name, was, now, suffix = '') =>
    console.log(`${name.padEnd(14)} ${String(was).padStart(10)}${suffix}  →  ${String(now).padStart(10)}${suffix}`);
  console.log(`基线: ${path}   比对列: ${unit}\n`);
  say('全程(秒)', Math.round(b.totalSeconds), Math.round(rep.totalSeconds), 's');
  say('时长均值', b.secondsMean.toFixed(1), rep.secondsMean.toFixed(1), 's');
  say('时长标准差', b.secondsStd.toFixed(1), rep.secondsStd.toFixed(1), 's');
  say('时长 CV', b.secondsCv.toFixed(3), rep.secondsCv.toFixed(3));
  say(`${label}均值`, b.mean.toFixed(2), rep.mean.toFixed(2));
  say(`${label}标准差`, b.std.toFixed(2), rep.std.toFixed(2));
  say('逆序', b.inverted.length, rep.inverted.length);
  say('同拍', b.sameTick.length, rep.sameTick.length);
  say('静默拍', b.silent.length, rep.silent.length);
  console.log(`\n逐段（秒 / ${label}）：`);
  const byTo = new Map(rep.list.map((g) => [g.to, g]));
  let moved = 0;
  for (const old of b.list) {
    const now = byTo.get(old.to);
    if (!now) { console.log(`  ${old.from}→${old.to}  ${old.seconds.toFixed(0)}s → 消失了`); moved += 1; continue; }
    const ds = now.seconds - old.seconds;
    const dd = now.gap - old.gap;
    // 阈值按列给：决策差 4 下是大事，点击差 4 下在第一章是噪声。
    const flag = Math.abs(ds) > 60 || Math.abs(dd) > (unit === 'clicks' ? 50 : 4) ? '  ← 变了' : '';
    if (flag) moved += 1;
    console.log(`  ${old.from}→${old.to}  ${old.seconds.toFixed(0)}s→${now.seconds.toFixed(0)}s  ${old.gap}→${now.gap}${flag}`);
  }
  console.log(moved ? `\n${moved} / ${b.list.length} 段有变化。` : '\n没有变化：读数和基线一致。');
  process.exit(0);
}

const pad = (s, n) => String(s).padEnd(n);
const num = (n, w = 6) => String(typeof n === 'number' ? n.toFixed(2) : n).padStart(w);

console.log(`通关: ${run.stopped ? '是' : '否'}   总点击 ${run.clicks}   决策点击 ${run.decisions}`);
console.log(`每幕决策点击: ${Object.entries(run.decisionsByAct).map(([a, n]) => `ACT${a}=${n}`).join('  ')}`);

// 每一幕花了多久：点击数是玩家按了多少下，秒数是这一章实际持续多长。两个都要看——
// 只数点击会漏掉「按一下等十分钟」，只看时间会漏掉「三秒里按完一整章」。
const actSeconds = {};
for (const item of E.AHAS) { const a = run.ahaAt.get(item.id); if (a) actSeconds[item.act] = a.t; }
const ends = Object.keys(actSeconds).sort((a, b) => a - b).map((k) => [k, actSeconds[k]]);
console.log(`每幕时长(秒): ${ends.map(([k, t], i) => {
  const prev = i === 0 ? run.start : ends[i - 1][1];
  return `ACT${k}=${Math.round((t - prev) / 1000)}`;
}).join('  ')}   全程=${Math.round((run.end - run.start) / 1000)}s\n`);

const units = [['decisions', reports.decisions], ['clicks', reports.clicks]];
const mark = (name) => (name === unit ? `${name} *` : name);
for (const [name, r] of units) {
  console.log(`── ${mark(name)} ──  均值 ${r.mean.toFixed(2)}  标准差 ${r.std.toFixed(2)}  CV ${r.cv.toFixed(3)}  范围 ${r.min}–${r.max}`);
}
const secs = rep.seconds;
const total = rep.totalSeconds;
console.log(`── 时长 ──  均值 ${rep.secondsMean.toFixed(1)}s  标准差 ${rep.secondsStd.toFixed(1)}s  `
  + `CV ${rep.secondsCv.toFixed(3)}  范围 ${Math.min(...secs).toFixed(0)}–${Math.max(...secs).toFixed(0)}s  `
  + `全程 ${(total / 60).toFixed(1)} 分钟${total >= 7200 ? '（≥2 小时 ✓）' : '（不足 2 小时 ✗）'}`);
console.log();

console.log(`${pad('间隔', 16)} ${pad('ACT', 5)} ${'decisions'.padStart(10)} ${'clicks'.padStart(8)} ${'秒'.padStart(8)}`);
for (const g of rep.list) {
  const c = raw.list.find((x) => x.to === g.to);
  // 判定以时长为主：玩家感觉到的是「等了多久」，另外两列是这个等待里塞了多少动作。
  const slow = g.seconds > rep.secondsMean + 2 * rep.secondsStd;
  const fast = g.seconds < rep.secondsMean - 2 * rep.secondsStd;
  const flag = g.inverted ? '  ← 逆序' : g.sameTick ? '  ← 同拍' : g.gap === 0 ? '  ← 静默拍'
    : slow ? '  ← 过长' : fast ? '  ← 过短' : '';
  const decisions_ = unit === 'decisions' ? g.gap : (c ? c.gap : 0);
  const clicks_ = unit === 'clicks' ? g.gap : (c ? c.gap : 0);
  console.log(`${pad(`${g.from}→${g.to}`, 16)} ${pad(g.act, 5)} ${num(decisions_, 10)} ${num(clicks_, 8)} ${num(g.seconds, 8)}${flag}`);
}
if (rep.inverted.length) console.log(`\n逆序（后一条先发生）: ${rep.inverted.join(', ')}`);
if (rep.sameTick.length) console.log(`同拍（一起发生，只报一条）: ${rep.sameTick.join(', ')}`);
if (rep.silent.length) console.log(`静默拍（0 次点击）: ${rep.silent.map((s) => `${s.pair} ${s.seconds}s`).join(', ')}`);

if (process.argv.includes('--trace')) {
  console.log('\n每段间隔花在哪些动作上:');
  for (let i = 0; i + 1 < E.AHAS.length; i++) {
    const a = E.AHAS[i].id; const b = E.AHAS[i + 1].id;
    const from = run.ahaAt.get(a); const to = run.ahaAt.get(b);
    if (!from || !to) continue;
    const lo = Math.min(from.clicks, to.clicks); const hi = Math.max(from.clicks, to.clicks);
    const slice = run.events.filter((e) => e.clicks > lo && e.clicks <= hi);
    const tally = {};
    for (const e of slice) tally[e.type] = (tally[e.type] || 0) + 1;
    const top = Object.entries(tally).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k}×${v}`).join(' ');
    console.log(`${pad(`${a}→${b}`, 16)} ${String(hi - lo).padStart(5)}  ${top}`);
  }
}
