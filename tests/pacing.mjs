// 参考对局（reference playthrough）与节奏读数。
//
// 为什么要有这份：`tests/game-v3.test.mjs` 里那条「通关」断言是唯一保证「正常玩能走完」的
// 东西，但它只数**每一幕**的决策点击，于是「后面五章的戏全挤在最后 35 下里演完」这种塌缩
// 在它眼里是绿的。节奏是按**相邻两条 Aha 之间**读的，不是按幕读的：
// 幕是作者的划分，Aha 才是玩家实际收到的节拍。
//
// 驱动策略和那条测试里的是同一个：能买的机器就买，能推的动作就推，缺钱就卖、缺意义就压缩。
// 两份必须一致，否则两次读数不可比。改这里就要同时改那条测试。
import { readFileSync } from 'node:fs';

export function loadEngine() {
  const source = readFileSync(new URL('../public/glyph-engine-v3.js', import.meta.url), 'utf8');
  return new Function(`${source}\nreturn GlyphEngineV3;`)();
}

export const REFERENCE_START = 1789526400000;

// 一次决策点击 = 真的改变了状态的一下。`print`/`sell`/`toggle-auto` 不计入决策：
// 它们没有选择成分（按一下多一个字、按一下把字卖光），把它们的次数算进节奏会把
// 第一章的「手速」和后面几章的「判断」混成一个数字。
const NON_DECISIONS = new Set(['print', 'sell', 'toggle-auto']);
const strip = (s) => JSON.stringify({ ...s, log: 0, updatedAt: 0, ruleCredit: 0 });

/**
 * 走完一整局，记录每条 Aha 是在第几次点击之后发生的。
 * @returns {{ stopped: boolean, ahaAt: Map<string, {clicks:number, decisions:number, t:number, act:number}>,
 *             clicks: number, decisions: number, decisionsByAct: Record<number, number>, state: object }}
 */
export function playthrough(E, { start = REFERENCE_START, maxTicks = 200000 } = {}) {
  let t = start;
  let g = E.fresh(t);
  const ahaAt = new Map();
  const known = new Set(g.ahaSeen);
  const decisionsByAct = {};
  let clicks = 0;
  let decisions = 0;

  // 每条 Aha 归到「发生那一刻已经按了多少下」。被动累积（读者、文章、机器用量）自己会长出来，
  // 那也归在同一个计数上——玩家在那段里没按键，间隔就该读作小，这是诚实的。
  // `obs` 是观察序号：两条 Aha 共享同一个序号 = 同一拍里一起发生，玩家只收到一条公告。
  let obs = 0;
  const observe = () => {
    let fired = false;
    for (const id of g.ahaSeen) {
      if (known.has(id)) continue;
      known.add(id);
      ahaAt.set(id, { clicks, decisions, t, act: g.act, obs });
      fired = true;
    }
    if (fired) obs += 1;
  };

  const events = [];
  const cmd = (type, props = {}) => {
    const base = E.advance(g, t);
    const next = E.act(g, { type, ...props }, t);
    if (strip(next) === strip(base)) return false;
    g = next;
    clicks += 1;
    if (!NON_DECISIONS.has(type)) {
      decisions += 1;
      decisionsByAct[base.act] = (decisionsByAct[base.act] || 0) + 1;
    }
    observe();
    events.push({ clicks, decisions, type, act: g.act });
    return true;
  };

  // 缺什么补什么，补什么由引擎自己的 `commandReady().binding` 决定——那是按钮上写着
  // 「还差 …」的同一份真源。参考玩家因此不是「照着攻略走的机器人」，而是「照屏幕上那句
  // 提示走的玩家」：它不会为了攒一笔猜出来的预算去空转，也不会去做没有下一步的动作。
  // 早期版本自己拍一个 earn(3000, 200) 的预算，于是第六章之前的空转全变成假点击。
  // 缺什么补什么。补它的那个动作自己也要花钱，所以先看它的门槛——玩家按下「压缩」发现
  // 它是灰的、写着「还差 60 资金」的时候，做的正是这件事。
  const satisfy = (binding) => {
    if (!binding) return false;
    const broke = () => (g.glyphs >= 1 ? cmd('sell') : false);
    if (binding.key === 'credits') return broke();
    if (binding.key === 'meaning') return (g.credits < 60 || g.glyphs < 20) ? broke() : cmd('condense');
    if (binding.key === 'composed') return (g.credits < 40 || g.glyphs < 2) ? broke() : cmd('compose-rule');
    if (binding.key === 'glyphs') return (g.credits >= 40 && g.glyphs < 2) ? cmd('print') : broke();
    return false; // 剩下的（读者、噪音、时间）只能等，等不是点击。
  };
  const press = (type, props = {}) => {
    const gate = E.commandReady(g, type);
    if (gate.ready && cmd(type, props)) return true;
    if (satisfy(gate.binding)) return true;
    // 幕转换这类动作引擎不发布代价（它是一次性的，不是买得起的），这时候玩家看的是屏幕上
    // 另一行字：「下一个阶段 还差 …」。缺的那一项在这里补。
    const stage = E.gateProgress(g);
    return Boolean(stage && stage.binding && satisfy(stage.binding));
  };

  // 每一幕想做成一件事的顺序。第一幕是手速教学，保持原样；后面几幕是「把这一章想明白」。
  const plan = () => {
    if (g.act === 2) {
      // 这一章的发现顺序：刻三刀 → 懂意义 → 收到信 → 让读者造词 → 让它传播 → 学会删。
      if (g.composed < 3) return ['compose-rule'];
      if (g.meaning < E.AHA_GOALS.A05.need) return ['condense'];
      if (g.letters < 1) return ['read-letter'];
      if (g.organicWords < 1) return ['organic-word'];
      if (g.viralWords < 1) return ['viral-word'];
      if (g.deletedNoise < 1) return ['delete-noise'];
      return null; // 剩下的是幕门槛：缺什么由 press() 的回退去补
    }
    if (g.act === 3) {
      if (g.districts < 2) return ['discover-dialect'];
      if (g.concepts < 1) return ['make-concept'];
      if (!g.worldScale) return ['map-city'];
      if (g.districts < E.WORLD_GATE.districts) return ['discover-dialect'];
      if (g.concepts < E.WORLD_GATE.concepts) return ['make-concept'];
      if (g.worldScale < 2) return ['map-world'];
      return ['launch-agents'];
    }
    if (g.act === 4) {
      if (!g.editorAutonomy) return ['editor-autonomy'];
      if (g.agentFactories < 2) return ["spawn-agents"];
      if (!g.digital) return ['digitize'];
      if (g.archives < 4) return ["train-memory"];
      return ['discover-machine-glyph'];
    }
    if (g.act === 5) {
      if (g.compressedMeaning < E.AHA_GOALS.A24.need) return ['compress-language', { amount: 100 }];
      return ['infrastructure'];
    }
    if (!g.ambiguityResolved) return ['resolve-ambiguity'];
    if (g.deletedNoise < 1000) return ['delete-noise', { amount: 250 }];
    return ['stop-printing'];
  };

  for (let i = 0; i < maxTicks && !g.stopped; i++) {
    t += 500;
    const aff = E.UNITS.map((u) => ({ u, c: E.cost(g, u.id) }))
      .filter(({ u, c }) => g.lifetimeGlyphs >= u.unlock && g.credits >= c && g[u.id] < 10000)
      .sort((a, b) => a.c - b.c)[0];
    if (g.act === 1) {
      const ready = g.lifetimeGlyphs >= 5000 && g.presses >= 1;
      cmd('publish');
      if (!g.published) {
        if (ready) { if (g.credits < 300) cmd('sell'); }
        else if (aff) cmd('buy', { id: aff.u.id });
        else if (!g.autoSellUnlocked && g.lifetimeGlyphs >= 300 && g.credits >= 60) cmd('research-auto');
        else if (!g.manualBoost && g.lifetimeGlyphs >= 150 && g.credits >= 45) cmd('boost');
        else if (g.glyphs >= 1) cmd('sell');
        else cmd('print');
      }
    } else {
      const step = plan();
      // 计划里的事情都做完了，就照着屏幕上那行「下一个阶段 还差 …」补。参考玩家的整个
      // 行为准则就这一条：屏幕让他做什么，他就做什么；屏幕没让他做什么，他就不按。
      if (step) press(step[0], step[1] || {});
      else { const stage = E.gateProgress(g); if (stage && stage.binding) satisfy(stage.binding); }
    }
    g = E.advance(g, t);
    observe();
  }
  return { stopped: g.stopped, ahaAt, clicks, decisions, decisionsByAct, events, state: g, start, end: t };
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const stdev = (xs) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))); };

/**
 * 相邻两条 Aha 之间的间隔。gap[i] 是 A(i+2) 与 A(i+1) 之间玩家按下的次数。
 * `unit` 选 'decisions'（有选择成分的点击）或 'clicks'（全部点击）。
 */
export function gaps(E, run, unit = 'decisions') {
  const ids = E.AHAS.map((a) => a.id);
  const out = [];
  for (let i = 0; i + 1 < ids.length; i++) {
    const from = run.ahaAt.get(ids[i]);
    const to = run.ahaAt.get(ids[i + 1]);
    if (!from || !to) continue;
    out.push({
      from: ids[i], to: ids[i + 1], act: to.act,
      gap: to[unit] - from[unit],
      seconds: (to.t - from.t) / 1000,
      // 逆序：后一条比前一条先发生。玩家读到的是倒着讲的第二章/第三章。
      inverted: to[unit] < from[unit] || (to.obs < from.obs),
      // 同拍：两条在同一次观察里一起发生，焦点卡只会显示后一条。
      sameTick: to.obs === from.obs,
    });
  }
  return out;
}

export function pacingReport(E, run, unit = 'decisions') {
  const list = gaps(E, run, unit);
  const values = list.map((x) => x.gap);
  const m = mean(values);
  const sd = stdev(values);
  return {
    unit,
    values,
    list,
    mean: m,
    std: sd,
    min: Math.min(...values),
    max: Math.max(...values),
    // 变异系数：标准差 ÷ 均值。均值会随动作总数漂移，CV 才是「节奏匀不匀」的可比数字。
    cv: sd / m,
    zero: list.filter((x) => x.gap === 0).map((x) => x.to),
    inverted: list.filter((x) => x.inverted).map((x) => `${x.from}→${x.to}`),
    sameTick: list.filter((x) => x.sameTick).map((x) => `${x.from}→${x.to}`),
    // 静默拍：两条之间一次点击都没有。只有真的隔了一段时间的，才算设计上的呼吸。
    silent: list.filter((x) => x.gap === 0).map((x) => ({ pair: `${x.from}→${x.to}`, seconds: Math.round(x.seconds) })),
    decisionsByAct: run.decisionsByAct,
    clicks: run.clicks,
    decisions: run.decisions,
  };
}
