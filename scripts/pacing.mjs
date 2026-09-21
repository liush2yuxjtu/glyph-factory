// 节奏读数：跑一遍参考对局，把相邻两条 Aha 之间的点击间隔打出来。
//
//   node scripts/pacing.mjs            # 人读的报告
//   node scripts/pacing.mjs --json     # 机器读，给调参循环用
//
// 唯一真源是 tests/pacing.mjs，和 tests/game-v3.test.mjs 里的「通关」断言共用同一个驱动。
import { loadEngine, playthrough, pacingReport, gaps } from '../tests/pacing.mjs';

const E = loadEngine();
const run = playthrough(E);
const rep = pacingReport(E, run, 'decisions');
const raw = pacingReport(E, run, 'clicks');

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ decisions: rep, clicks: raw, finished: run.stopped }, null, 2));
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

const units = [['decisions', rep], ['clicks', raw]];
for (const [name, r] of units) {
  console.log(`── ${name} ──  均值 ${r.mean.toFixed(2)}  标准差 ${r.std.toFixed(2)}  CV ${r.cv.toFixed(3)}  范围 ${r.min}–${r.max}`);
}
console.log();

console.log(`${pad('间隔', 16)} ${pad('ACT', 5)} ${'decisions'.padStart(10)} ${'clicks'.padStart(8)} ${'秒'.padStart(8)}`);
for (const g of rep.list) {
  const c = gaps(E, run, 'clicks').find((x) => x.to === g.to);
  const flag = g.inverted ? '  ← 逆序' : g.sameTick ? '  ← 同拍' : g.gap === 0 ? '  ← 静默拍' : (g.gap > Math.ceil(rep.mean + 2 * rep.std) ? '  ← 过长' : '');
  console.log(`${pad(`${g.from}→${g.to}`, 16)} ${pad(g.act, 5)} ${num(g.gap, 10)} ${num(c ? c.gap : 0, 8)} ${num(g.seconds, 8)}${flag}`);
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
