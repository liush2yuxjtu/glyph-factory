// 采集第二步：六条流程的步骤表，从引擎现算。
//
//   node scripts/flows/flows.mjs > scripts/flows/flows.json
//
// 这一份原来在 template.html 里手写，而手写的代价已经付过：重排之后表里还留着
// 「viral-word 送 750 读者」和「map-city 是第二章的出口」——两条都已经不是真的了，
// 页面照旧印着。所以改成生成：步骤、代价、产生哪条 Aha 全部从引擎读，引擎改了重跑就对。
//
// 每一幕的「实测」列来自参考对局（`tests/pacing.mjs`），和 screens.json 是同一局。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEngine, playthrough } from '../../tests/pacing.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const E = loadEngine();

// 玩家语言的动作名住在渲染层——那是给玩家看的那一份，不在这里再抄一遍。

// 玩家语言的动作名直接取**采集到的按钮文字**（screens.json 的 actions），
// 不在源码里再解析一遍：那才是玩家真正读到的那个词，而且它已经是一次真实渲染的读数。
// 采集覆盖不到的动作（机器卡上的「购买」之类）在这里补一个名字。
const EXTRA = { buy: '购买机器', print: '印字', sell: '出售全部库存', 'toggle-auto': '切换自动出售', boost: '研发复写纸', 'research-auto': '研发自动出售', contract: '交付街角委托' };
const LABELS = { ...EXTRA };
// 推钟动词和微事件的名字**按幕不同**，而标签表只按命令名索引——直接用会把六幕压成
// 采集到的最后一个（「一份没人署名的退稿」出现在每一幕里）。这两个按幕从引擎取。
const perActName = (type, act) => {
  if (type === 'push-clock' && E.ACT_VERBS[act]) return `${E.ACT_VERBS[act].name} · 推钟`;
  if (type === 'take-event' && E.EVENTS[act]) return `${E.EVENTS[act].name} · 微事件`;
  return null;
};
try {
  for (const screen of JSON.parse(readFileSync(`${ROOT}scripts/flows/screens.json`, 'utf8')))
    for (const a of screen.actions) if (a.cmd && a.label) LABELS[a.cmd] = a.label;
} catch { /* 还没采集过就用 EXTRA */ }

// 包一层 `act`：记下每个动作**第一次**在哪一幕被按下、按下前的状态是什么。
// 代价是随按次递增的（推钟动词就是这样），所以只能取「第一次按」那一刻的样子，
// 取平均值没有意义，取最后那次又会让表里写着一个玩家从没见过的价钱。
const firstUse = new Map();
const clicksAt = new Map();
let click = 0;
// 判「这一下到底有没有生效」必须和参考对局用同一把尺子：`E.act` **永远**返回一个新对象，
// 所以 `next !== g` 恒为真——按它计数会把「试了但没成功」也算成一次点击，计数一路跑到
// 参考对局的点击数前面去，于是每一步都对不上它产生的那条 Aha。用同一份 `strip` 比较。
const strip = (s) => JSON.stringify({ ...s, log: 0, updatedAt: 0, ruleCredit: 0 });
const wrapped = {
  ...E,
  act: (g, command, now) => {
    const before = E.advance(g, now);
    const next = E.act(g, command, now);
    if (strip(next) !== strip(before)) {
      click += 1;
      const type = command && command.type;
      if (type && !firstUse.has(`${before.act}:${type}`)) {
        firstUse.set(`${before.act}:${type}`, { type, state: before, act: before.act });
        clicksAt.set(`${before.act}:${type}`, click);
      }
    }
    return next;
  },
};

// 用**主动**那一局：被动玩家一个推钟动词都不按、一个微事件都不捡，
// 于是这一章最重要的两行根本不会出现在表里——那才是这一轮加的东西。
const run = playthrough(wrapped, { push: true, microEvents: true });

const costOf = (type, state) => {
  const spec = E.COMMAND_COSTS[type];
  if (!spec) return '—';
  try {
    return spec(state).map(([key, need]) => `${E.fieldLabel(key)} ${need}`).join(' · ');
  } catch { return '—'; }
};
// 这一步之后最先发生的那条 Aha——玩家按这一下是为了看到什么。
const givesAfter = (clickIndex) => {
  // 不按幕过滤：很多命令**就是**把玩家推进下一幕的那一下（发行、上线 Agent、发现字形），
  // 按幕过滤会让这些行永远空着。找的是「这一下之后最先发生的那条发现」。
  let best = null;
  for (const a of E.AHAS) {
    const at = run.ahaAt.get(a.id);
    if (!at || at.clicks < clickIndex) continue;
    if (!best || at.clicks < best.at.clicks) best = { a, at };
  }
  return best ? `${best.a.id} ${best.a.title}` : '';
};

const ahasByAct = new Map();
for (const [id, at] of run.ahaAt) {
  if (!ahasByAct.has(at.act)) ahasByAct.set(at.act, []);
  ahasByAct.get(at.act).push(id);
}

// 每条流程配两块屏：这一幕的起点，和下一幕的起点。
const SCREENS = { 1: ['P01', 'P02', 'P03'], 2: ['P04', 'P05'], 3: ['P05', 'P06'], 4: ['P06', 'P07'], 5: ['P07', 'P08'], 6: ['P08', 'P09'] };

const out = [1, 2, 3, 4, 5, 6].map((act) => {
  const ids = ahasByAct.get(act) || [];
  const first = ids.length ? run.ahaAt.get(ids[0]) : null;
  const last = ids.length ? run.ahaAt.get(ids[ids.length - 1]) : null;
  const steps = [...firstUse.entries()]
    .filter(([key]) => key.startsWith(`${act}:`))
    .map(([key, { type, state }]) => ({
      cmd: type,
      label: perActName(type, state.act) || LABELS[type] || type,
      cost: costOf(type, state),
      gives: givesAfter(clicksAt.get(key)),
    }));
  return {
    fid: `F${String(act).padStart(2, '0')}`,
    act,
    title: E.ACTS[act - 1].name,
    range: E.ACTS[act - 1].range,
    ahas: ids.length,
    // 这一对必须同窗口。曾经是「整幕的决策数」配「首条到末条 Aha 的秒数」——两个窗口，
    // 印成一对实测值。F01 因此写着 45 次决策 / 109 秒，而 109 秒里只走得下十几次决策，
    // 剩下的是幕末那段没有 Aha 的尾巴。读者会拿它去估「一幕要按多少下」，估出来的数不存在。
    decisions: first && last ? last.decisions - first.decisions : 0,
    seconds: first && last ? Math.round((last.t - first.t) / 1000) : Math.round((run.end - run.start) / 1000),
    screens: SCREENS[act],
    steps,
    exit: (E.ACT_GATES[act] || []).map((c) => `${c.label} ${c.need}`),
  };
});

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
console.error(`流程 ${out.length} 条，步骤 ${out.reduce((n, f) => n + f.steps.length, 0)} 个；`
  + `每幕决策 ${out.map((f) => f.decisions).join('/')}`);
