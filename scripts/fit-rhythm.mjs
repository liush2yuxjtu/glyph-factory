// 节奏拟合：把四条阶梯的刻度重排成「每一幕首段短、末段长」，并把全程拉回两小时以上。
//
//   node scripts/fit-rhythm.mjs            # 拟合并写回引擎
//   node scripts/fit-rhythm.mjs --dry      # 只打印读数，不写文件
//   node scripts/fit-rhythm.mjs --rounds 8 # 形状迭代轮数
//
// **为什么这是一段代码，而不是一组手调的数字。** 一段等待的秒数 = 那一段的刻度差 ÷ 那时钟的
// 增速；增速随状态（组合字、传播、街区、Agent……）变，状态又随刻度变。手调一个刻度会让下游
// 每一段都跟着动，改十几次也对不上形状。这个脚本把「目标秒数」写清楚，让机器去解那个不动点。
//
// 形状的真源是 intent.md 的 U7；这里只实现它那一条：「首段 ×0.45、末段 ×1.7、其余 ×1.0，
// 按幕归一化」。判据（CV ≤ 0.45、最长÷最短 ≤ 6、无一段短于 60 秒、全程 ≥ 7200 秒）在
// tests/game-v3.test.mjs 里，形状本身在 tests/rhythm-structure.test.mjs 里——这里都不重复。
import { readFileSync, writeFileSync } from 'node:fs';
import { playthrough, gaps } from '../tests/pacing.mjs';

const ENGINE = new URL('../public/glyph-engine-v3.js', import.meta.url);

export const SHAPE_HEAD = 0.45;
export const SHAPE_TAIL = 1.7;
export const shape = (n) => Array.from({ length: n }, (_, i) => (i === 0 ? SHAPE_HEAD : i === n - 1 ? SHAPE_TAIL : 1));

// 每一条阶梯上，「哪几段等待」由它的刻度决定。段的名字就是那个刻度的名字。
export const LADDERS = {
  READERS_LADDER: ['A04', 'A05', 'A06', 'A07', 'A08', 'A09', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16'],
  ARTICLE_LADDER: ['A17', 'A18', 'A19', 'A20', 'A21', 'A22'],
  MACHINE_LADDER: ['C0', 'C4', 'A25'],   // C0 是 A23 的刻度，C4 是 A24 的刻度
  AMBIGUITY_LADDER: ['A26', 'A27', 'A28'],
};
// 每一幕进门时那个资源已经有多少。重排刻度要连它一起看，否则第一段的长度会算错。
export const ENTRY = { READERS_LADDER: 20, ARTICLE_LADDER: 0, MACHINE_LADDER: 0, AMBIGUITY_LADDER: 60 };
const gapFor = (key) => (key === 'C0' ? 'A23' : key === 'C4' ? 'A24' : key);
// 第一章的两段不在任何阶梯上（由发行门槛和打字员刻度决定），重排时按 `from` 排掉。
export const tutorialGap = (g) => g.from === 'A01' || g.from === 'A02';

export function readLadder(src, name) {
  const m = src.match(new RegExp(`const ${name} = \\{([^}]*)\\}`));
  if (!m) throw new Error(`找不到 ${name}`);
  const out = {};
  for (const part of m[1].split(',')) {
    const [k, v] = part.split(':').map((s) => s.trim());
    if (k) out[k] = Number(v);
  }
  return out;
}
// 写出去时按数值排序：这张表是「一条链从早到晚」，文件里的键顺序也该是那个顺序。
function writeLadder(src, name, obj) {
  const body = Object.entries(obj).sort((a, b) => a[1] - b[1]).map(([k, v]) => `${k}:${Math.round(v)}`).join(', ');
  const re = new RegExp(`const ${name} = \\{[^}]*\\}`);
  if (!re.test(src)) throw new Error(`找不到 ${name}`);
  return src.replace(re, `const ${name} = {${body}}`);
}

export function measure(src) {
  const engine = new Function(`${src}\nreturn GlyphEngineV3;`)();
  const run = playthrough(engine);
  return { engine, run, list: gaps(engine, run, 'decisions') };
}

// 不在发现链上、但同属一条阶梯的刻度（方言的第二、三次代价，五次压缩各自的门槛）。
// 它们按固定的相对位置跟着走，否则重排之后会出现「代价高于它后面那个发现」。
function rederive(next) {
  const r = next.READERS_LADDER;
  r.D0 = r.A11 + ((2165 - 1790) / (2665 - 1790)) * (r.A12 - r.A11);
  r.D2 = r.A14 + ((6290 - 5960) / (8070 - 5960)) * (r.A15 - r.A14);
  const m = next.MACHINE_LADDER;
  for (let i = 1; i <= 3; i++) m[`C${i}`] = m.C0 + (i * (m.C4 - m.C0)) / 4;
  return next;
}

/**
 * 按目标秒数重排四条阶梯，返回新的引擎源码。
 * @param {string} src 引擎源码
 * @param {{to:string, seconds:number}[]} list 参考对局的逐段读数
 * @param {Record<string, number>} targets 段名（`to`）→ 目标秒数；没写的段保持原样
 * @param {number} [scale] 再整体乘一个系数（用来校正总时长）
 */
export function reshape(src, list, targets = {}, scale = 1) {
  const byTo = new Map(list.map((g) => [g.to, g]));
  const next = {};
  for (const [name, keys] of Object.entries(LADDERS)) {
    const marks = readLadder(src, name);
    const ordered = keys.slice().sort((a, b) => marks[a] - marks[b]);
    const out = {};
    let prev = ENTRY[name];   // 原刻度里的上一个点，用来取这一段原本有多长
    let cursor = ENTRY[name]; // 新刻度走到哪了——必须累加，否则写出来的不是一条链
    for (const key of ordered) {
      const delta = marks[key] - prev;
      const gap = byTo.get(gapFor(key));
      const target = gap ? targets[gap.to] : null;
      const scaled = (target && gap.seconds > 0 ? delta * (target / gap.seconds) : delta) * scale;
      cursor += Math.max(1, scaled);
      out[key] = cursor;
      prev = marks[key];
    }
    next[name] = out;
  }
  let out = src;
  for (const [name, obj] of Object.entries(rederive(next))) out = writeLadder(out, name, obj);
  return out;
}

/** 按幕把目标秒数写成 shape(n) 归一化到「这一幕现在的总秒数」。 */
export function shapeTargets(list) {
  const byAct = new Map();
  for (const g of list) {
    if (tutorialGap(g)) continue;
    if (!byAct.has(g.act)) byAct.set(g.act, []);
    byAct.get(g.act).push(g);
  }
  const targets = {};
  for (const [, act] of byAct) {
    const total = act.reduce((s, g) => s + g.seconds, 0);
    const w = shape(act.length), sum = w.reduce((a, b) => a + b, 0);
    act.forEach((g, i) => { targets[g.to] = Math.max(90, (w[i] / sum) * total); });
  }
  return targets;
}

const stats = (secs) => {
  const mean = secs.reduce((a, b) => a + b, 0) / secs.length;
  return {
    mean,
    std: Math.sqrt(secs.reduce((a, b) => a + (b - mean) ** 2, 0) / secs.length),
    min: Math.min(...secs), max: Math.max(...secs),
  };
};
const line = (label, secs) => {
  const s = stats(secs);
  return `${label}：均值 ${s.mean.toFixed(1)}s  标准差 ${s.std.toFixed(1)}s  CV ${(s.std / s.mean).toFixed(3)}  最短 ${s.min.toFixed(0)}  最长 ${s.max.toFixed(0)}  ÷ ${(s.max / s.min).toFixed(2)}`;
};

// 第一章没有阶梯：它的两段由「打字员买到几个」和发行门槛决定，只能搜一遍。
function fitActOne(src) {
  let best = null;
  for (const need of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const patched = src.replace(/A02:\{key:'typists',need:\d+\}/, `A02:{key:'typists',need:${need}}`);
    const { list } = measure(patched);
    const byTo = new Map(list.map((g) => [g.to, g]));
    const a = byTo.get('A02'), b = byTo.get('A03');
    if (!a || !b) continue;
    const total = a.seconds + b.seconds, w = shape(2), sum = w[0] + w[1];
    const err = Math.abs(a.seconds - (w[0] / sum) * total) + Math.abs(b.seconds - (w[1] / sum) * total);
    if (!best || err < best.err) best = { need, err, seconds: [a.seconds, b.seconds] };
  }
  return best;
}

export function fit({ rounds = 8, totalTarget = 7300, log = console.log } = {}) {
  let src = readFileSync(ENGINE, 'utf8');
  const act1 = fitActOne(src);
  if (act1) {
    src = src.replace(/A02:\{key:'typists',need:\d+\}/, `A02:{key:'typists',need:${act1.need}}`);
    log(`第一章：打字员 ${act1.need} → ${act1.seconds.map((s) => s.toFixed(0)).join(' / ')} 秒`);
  }
  for (let round = 0; round < rounds; round++) {
    const { list } = measure(src);
    src = reshape(src, list, shapeTargets(list));
    log(line(`形状第 ${round + 1} 轮`, measure(src).list.map((g) => g.seconds)));
  }
  // 形状定了之后再校正总时长：按幕归一化保的是**比例**，不是全程——中间任何一次增速改动
  // 都会让全程漂。两小时是硬地板，所以单独拉回来。
  for (let round = 0; round < 6; round++) {
    const { run, list } = measure(src);
    const total = (run.end - run.start) / 1000;
    log(`总时长校正第 ${round + 1} 轮：${(total / 60).toFixed(1)} 分钟`);
    if (total >= totalTarget) break;
    src = reshape(src, list, {}, totalTarget / total);
  }
  return src;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  const dry = process.argv.includes('--dry');
  const at = process.argv.indexOf('--rounds');
  const src = fit({ rounds: at >= 0 ? Number(process.argv[at + 1]) || 8 : 8 });
  if (dry) console.log('\n--dry：没有写回引擎。');
  else { writeFileSync(ENGINE, src); console.log(`\n已写入 ${ENGINE.pathname}`); }
}
