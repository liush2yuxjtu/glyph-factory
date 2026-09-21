// U7 的验收：四条设计承诺，**每条自带负对照**。缺了负对照，一条承诺就只是一句愿望——
// 「我们加了微事件」和「微事件真的让等待里有东西可点」是两句话，只有后者能被证伪。
//
// 这份文件不和 game-v3.test.mjs 的 U1 节奏断言放在一起，因为两者守的东西不一样：
// U1 守的是「等待有形状、但形状有界」，它对**拉平的曲线也必须通过**——那恰好是这里的
// 负对照一。混在一个 test 里，"过"和"该失败"的区分就没了。
//
// 真源是 intent.md 的 U7；这里的断言是它的当前读数，不是它的替代品。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadEngine, playthrough, gaps, pacingReport, evaluateEngine } from './pacing.mjs';
import { measure as measureSource, reshape } from '../scripts/fit-rhythm.mjs';

const E = loadEngine();
const SOURCE = readFileSync(new URL('../public/glyph-engine-v3.js', import.meta.url), 'utf8');
const seconds = (run) => (run.end - run.start) / 1000;
// 参考对局按 to.act 归段，所以第一章的第二段（A02→A03）算在第二章名下——按 `from` 排掉。
// 那一段玩家做的仍然是第一章的手速活，把它算进「这一幕的形状」会让首段变成 398 秒。
const grown = (list) => list.filter((g) => g.from !== 'A01' && g.from !== 'A02');
const byAct = (list) => {
  const m = new Map();
  for (const g of list) { if (!m.has(g.act)) m.set(g.act, []); m.get(g.act).push(g); }
  return m;
};

test('U7·快慢有结构：每一幕首段最短、末段最长，位置对得上而不是抖出来的', () => {
  const run = playthrough(E);
  const acts = [...byAct(grown(gaps(E, run, 'decisions')))].filter(([, list]) => list.length >= 3);
  assert.ok(acts.length >= 5, `只有 ${acts.length} 幕够长到能读出形状`);
  for (const [act, list] of acts) {
    const secs = list.map((g) => g.seconds);
    const head = secs[0], tail = secs[secs.length - 1];
    const middle = secs.slice(1, -1);
    assert.ok(head <= Math.min(...middle), `ACT ${act} 的首段 ${head.toFixed(0)}s 不是这一幕最短的`);
    assert.ok(tail >= Math.max(...middle), `ACT ${act} 的末段 ${tail.toFixed(0)}s 不是这一幕最长的`);
    assert.ok(tail >= head * 2, `ACT ${act} 末段 ${tail.toFixed(0)}s 只有首段 ${head.toFixed(0)}s 的 ${(tail / head).toFixed(2)} 倍，形状看不出来`);
  }
});

test('U7·快慢有结构 · 负对照：拉平曲线，U1 仍须全绿，而形状这条必须失败', () => {
  // 把曲线拉平：每一幕的目标秒数全取这一幕自己的均值，再重排一遍阶梯。
  // **不能**直接写一组等距刻度——秒数 = 刻度差 ÷ 增速，各幕的增速差好几倍，等距刻度量出来
  // 反而更不平（试过，CV 1.29）。所以用和调参时同一个 reshape，只换目标。
  const flatten = (passes = 3) => {
    let src = SOURCE;
    for (let i = 0; i < passes; i++) {
      const { list } = measureSource(src);
      const targets = {};
      for (const [, act] of byAct(grown(list))) {
        const mean = act.reduce((s, g) => s + g.seconds, 0) / act.length;
        for (const g of act) targets[g.to] = mean;
      }
      src = reshape(src, list, targets);
    }
    return evaluateEngine(src);
  };
  const flat = flatten();
  const run = playthrough(flat);
  const rep = pacingReport(flat, run, 'decisions');
  assert.equal(run.stopped, true, '拉平之后这一局走不完，那这条负对照证明不了什么');
  // U1 的判据（intent.md）：它守的是「形状有界」，不是「有形状」。
  assert.ok(rep.totalSeconds >= 7200, `拉平后全程 ${(rep.totalSeconds / 60).toFixed(1)} 分钟`);
  assert.ok(rep.secondsCv <= 0.45, `拉平后 CV ${rep.secondsCv.toFixed(3)}`);
  const secs = rep.seconds;
  assert.ok(Math.max(...secs) / Math.min(...secs) <= 6);
  assert.ok(Math.min(...secs) >= 60);
  // 而形状必须消失。用和上面同一条判据，不是另写一个宽松版。
  const acts = [...byAct(grown(rep.list))].filter(([, list]) => list.length >= 3);
  const stillShaped = acts.filter(([, list]) => {
    const s = list.map((g) => g.seconds);
    return s[s.length - 1] >= 2 * s[0];
  });
  assert.equal(stillShaped.length, 0, `拉平之后还有 ${stillShaped.length} 幕「首段短末段长」——形状不是设计出来的`);
});

test('U7·复利推钟 · 负对照：抽掉倍率，主动玩家必须退回被动玩家的长度', () => {
  const passive = playthrough(E);
  const active = playthrough(E, { push: true });
  const off = seconds(passive), on = seconds(active);
  assert.ok(active.byType['push-clock'] >= 15, `主动玩家一局只按了 ${active.byType['push-clock'] || 0} 下推钟`);
  assert.ok(on <= off * 0.92,
    `主动 ${(on / 60).toFixed(1)} 分钟 对 被动 ${(off / 60).toFixed(1)} 分钟：按下去没换到多少时间，这个动词基本是装饰`);
  // 把倍率那一项拆掉：动词还在、代价还照付，只是不再加速。主动路径必须退回被动路径的长度
  // （甚至更长——白付的代价不会退）。不退回，说明上面那段短不是这个动词造成的。
  const noBoost = loadEngine(['? 1 + boostNow(g) : 1);', '? 1 : 1);']);
  const wasted = seconds(playthrough(noBoost, { push: true }));
  assert.ok(wasted >= off * 0.98,
    `倍率拆掉之后主动路径仍有 ${(wasted / 60).toFixed(1)} 分钟，比被动 ${(off / 60).toFixed(1)} 分钟快——加速不是从倍率来的`);
});

test('U7·微事件 · 负对照：关掉调度器，等待期重新变成没有任何可点的东西', () => {
  // 调度器就是 `actSeconds` 这一个数，所以「关掉它」不需要开关：把秒数停住就行。
  const base = {
    ...E.fresh(0), act: 4, agents: 10, editorAutonomy: true, agentFactories: 2,
    digital: true, archives: 5, overnightArticles: 99999, meaning: 5000, credits: 5000,
  };
  assert.equal(E.commandReady({ ...base, actSeconds: E.EVENT_EVERY - 1 }, 'take-event').available, false,
    '还没到点，等待里就已经有东西可以点了');
  const due = { ...base, actSeconds: E.EVENT_EVERY };
  assert.equal(E.commandReady(due, 'take-event').ready, true, '到点了却没有任何东西可以点');
  // 点掉它：本幕的钟往前走一段，别的什么都不会白送。now 传 0 = 不走时间，
  // 于是量的就是这一次点击本身的效果，不含引擎顺手推进的那部分。
  const after = E.act(due, { type: 'take-event' }, 0);
  const gain = after.overnightArticles - due.overnightArticles;
  assert.ok(Math.abs(gain - E.clockRate(due) * E.EVENT_SECONDS) < 1e-9,
    `一次事件把钟推了 ${gain}，按增速算应该是 ${E.clockRate(due) * E.EVENT_SECONDS}`);
  assert.equal(after.meaning, due.meaning - 60, '代价没有真的付掉');
  assert.equal(after.eventsTaken, due.eventsTaken + 1);
  // 一次只排一个：刚点掉、秒数还没再走够，就又不可以点了。
  assert.equal(E.commandReady(after, 'take-event').available, false, '事件可以连着点，那不叫「等待里出现的东西」');
  // 被动路径上一个都不捡——「全程 ≥ 两小时」量的就是这条路，捡了就不是地板了。
  const passive = playthrough(E);
  assert.equal(passive.byType['take-event'] || 0, 0);
  assert.ok(seconds(playthrough(E, { microEvents: true })) < seconds(passive) * 0.97,
    '捡了事件和没捡一样长，那这些事件就是换皮装饰');
});

test('U7·旧动作供新层：第五章的钟被旧层产能喂着，拆掉这根线它就不动了', () => {
  const at = (machines) => ({ ...E.fresh(0), act: 5, machineGlyphs: 1, agentFactories: 2, ...machines });
  const small = at({ keyboards: 2, typists: 2 });
  const big = at({ keyboards: 40, typists: 40, presses: 40 });
  assert.ok(E.rate(big) > E.rate(small) * 10, '两边的旧层产能没拉开，这条对照读不出来');
  assert.ok(E.clockRate(big) > E.clockRate(small) * 1.5,
    `把旧摊子做大，第五章的钟没有明显变快（${E.clockRate(small).toFixed(1)} → ${E.clockRate(big).toFixed(1)}）——燃料链路没接上`);
  const cut = loadEngine((src) => {
    assert.ok(src.includes('+ rate(g) / 10'), '燃料链路那一项在源码里找不到，负对照会变成一句空话');
    return src.replace('+ rate(g) / 10', '');
  });
  assert.equal(cut.clockRate(big), cut.clockRate(small), '链路拆了，第五章的钟还在跟着产能走');
  // 参考对局里这条链路是活的：第一幕之后玩家还会回去买机器（不买的话 rate 会一路冻在进场值）。
  const run = playthrough(E);
  assert.ok((run.byType.buy || 0) > 40, `一局只买了 ${run.byType.buy || 0} 台机器，旧层没有被重新动过`);
  // `stopped` 之后 rate 按定义就是 0（停止印刷），所以读结局那台机器时要把它摘掉，
  // 否则这条断言量的是「游戏结束了」，不是「产能有没有长起来」。
  assert.ok(E.rate({ ...run.state, stopped: false }) > E.rate(run.ahaAt.get('A03').state) * 1.5,
    '结局时的产能和第二章开头差不多，说明旧层从第二章起就冻住了');
});

// SOURCE 留给后续：任何一条负对照如果要断言「替换的那段源码还在」，都在这里找。
void SOURCE;
