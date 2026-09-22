// 采集第一步：把「要拍哪几个状态」变成真实的存档快照。
//
//   node scripts/flows/snapshots.mjs > scripts/flows/snapshots.json
//
// 为什么不让采集脚本自己现编状态：README 里那条规矩——**画的是读数不是记忆**。
// 这九个玩家面状态全部来自 `tests/pacing.mjs` 那一次参考对局，是走到那一刻的真实存档；
// 评审面的六个状态由 `directorState()` 现取。所以屏幕上的每一个数字都能追回到一次真实对局。
//
// 曾经这九个状态是采集脚本自己造的，脚本又住在 gitignore 的 `test-results/` 里，
// 被清掉之后整条链路就断了（这次就是这样）。所以它现在入库。
import { loadEngine, playthrough } from '../../tests/pacing.mjs';

const E = loadEngine();
const strip = (g) => JSON.parse(JSON.stringify({ ...g, updatedAt: 0, startedAt: 0 }));

// 玩家面九个状态。前三个是第一章的手速阶段——那一段没有「第几条 Aha」可挂，
// 只能按第一个出现的动作类型抓，所以用一个包装器在真实对局里顺手记下来。
// P06 取 A20 而不是 A17：这一屏的说明是「数字出版让库存指标退场」，
// 取在 digitize 之前的话那句话说的那件事根本没发生。
const ACT_SNAPSHOT = { A05: 'P04', A12: 'P05', A20: 'P06', A23: 'P07', A27: 'P08' };
const firstOf = {};
// `E.act` 永远返回新对象，所以判「这一下有没有生效」要和参考对局用同一把尺子——
// 按 `next !== g` 判的话，`sell` 在库存还是 0 的第一次尝试就会被记下来。
const bare = (x) => JSON.stringify({ ...x, log: 0, updatedAt: 0, ruleCredit: 0 });
const wrapped = { ...E, act: (g, command, now) => {
  const base = E.advance(g, now);
  const next = E.act(g, command, now);
  const type = command && command.type;
  if (type && !firstOf[type] && bare(next) !== bare(base)) firstOf[type] = strip(next);
  return next;
} };

const run = playthrough(wrapped);
const out = {
  player: {
    P01: strip(E.fresh(0)),
    P02: firstOf.sell,
    P03: firstOf['research-auto'],
  },
  director: {},
};

for (const [aha, id] of Object.entries(ACT_SNAPSHOT)) {
  const at = run.ahaAt.get(aha);
  if (!at) throw new Error(`参考对局没有走到 ${aha}；快照表要跟着引擎改`);
  out.player[id] = strip(at.state);
}
out.player.P09 = strip(run.state);

// 评审面六个状态：导演模式逐个走一遍，每个都取它自己那一刻的真实快照。
out.director = { R01: 'A01', R02: 'A03', R03: 'A12', R04: 'A16', R05: 'A22', R06: 'A28' };

for (const [id, state] of Object.entries(out.player)) {
  if (!state) throw new Error(`${id} 没有抓到状态——参考对局里那个动作可能没发生过`);
  if (state.version !== E.VERSION) throw new Error(`${id} 的存档版本不是 ${E.VERSION}`);
}
if (!run.stopped) throw new Error('参考对局没有通关，抓出来的终局状态是假的');

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
console.error(`快照：玩家面 ${Object.keys(out.player).length} 个，评审面 ${Object.keys(out.director).length} 个；`
  + `全程 ${((run.end - run.start) / 60000).toFixed(1)} 分钟`);
