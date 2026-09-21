import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { playthrough, pacingReport } from './pacing.mjs';

const source = readFileSync(new URL('../public/glyph-engine-v3.js', import.meta.url), 'utf8');
const E = new Function(`${source}\nreturn GlyphEngineV3;`)();
const t = 1789526400000;
const doIt = (g, type, props = {}) => E.act(g, { type, ...props }, g.updatedAt);

test('ships all 28 ordered aha moments', () => {
  assert.equal(E.AHAS.length, 28);
  assert.deepEqual(E.AHAS.map((a) => a.id), Array.from({ length: 28 }, (_, i) => `A${String(i + 1).padStart(2, '0')}`));
});

test('finished v2 save migrates into Act II with resources preserved', () => {
  const g = E.restore({ version: 2, glyphs: 12, credits: 8, lifetimeGlyphs: 5000, keyboards: 2, typists: 1, presses: 1, contracts: 3, finished: true, updatedAt: t, startedAt: t }, t);
  assert.equal(g.version, 3);
  assert.equal(g.glyphs, 12);
  assert.equal(g.credits, 8);
  assert.equal(g.act, 2);
  assert.equal(g.published, true);
  assert.equal(g.stopped, false);
});

test('publishing Tomorrow transitions into Act II instead of ending the game', () => {
  let g = E.fresh(t);
  g = { ...g, lifetimeGlyphs: 5000, glyphs: 200, credits: 300, presses: 1, contracts: 3 };
  g = doIt(g, 'publish');
  assert.equal(g.published, true);
  assert.equal(g.act, 2);
  assert.equal(g.stopped, false);
  assert.ok(E.ahaUnlocked(g, 'A03'));
});

test('director snapshot for A22 is deterministic and machine-language ready', () => {
  const a = E.directorState('A22', t);
  const b = E.directorState('A22', t);
  assert.deepEqual(a, b);
  assert.equal(a.act, 5);
  assert.ok(a.machineGlyphs >= 1);
  assert.ok(E.ahaUnlocked(a, 'A22'));
});

test('A03 composition turns glyph relationship into an automatic rule', () => {
  // Carving a rule now costs credits as well as stock: a rule is machinery you pay for, and
  // the ACT II economy needs a sink or the later acts have nothing to spend into.
  let g = { ...E.fresh(t), act: 2, published: true, glyphs: 10, credits: 40 };
  g = doIt(g, 'compose-rule');
  assert.equal(g.ruleActive, true);
  assert.equal(g.composed, 1);
  g = E.advance(g, t + 8000);
  assert.ok(g.composed >= 3);
  assert.ok(E.ahaUnlocked(g, 'A04'));
});

test('an active rule composes on the live 500ms tick, not only on a catch-up', () => {
  const base = { ...E.fresh(t), act: 2, published: true, glyphs: 100, ruleActive: true, composed: 1 };
  // floor(elapsed / 4) is 0 on every 500ms live tick, so the old formula left a running rule
  // inert for the whole session and fired it only when the player came back from offline.
  let stepped = base;
  for (let i = 1; i <= 40; i++) stepped = E.advance(stepped, t + i * 500);
  const leap = E.advance(base, t + 20000);
  assert.equal(leap.composed, 6, '20s in one jump is 5 compositions plus the manual one');
  assert.equal(stepped.composed, leap.composed, 'live ticks must produce the same rule output as one jump');
});

test('A06 readership creates demand after publication', () => {
  // `meaning >= 10` is part of A06 now: a newspaper manufactures demand only for something
  // the player has already learned is worth printing. Without it the readers crossed 100 on
  // their own and A06 announced itself before A05 had ever happened.
  const g = E.advance({ ...E.fresh(t), act: 2, published: true, readers: 99, composed: 20, meaning: 10 }, t + 10000);
  assert.ok(g.readers > 100);
  assert.ok(g.demand > 1);
  assert.ok(E.ahaUnlocked(g, 'A06'));
});

test('A10 scarcity arrives with the viral word, not before it', () => {
  // Paper runs out because something went viral. Readership alone cannot produce the crisis:
  // readers grow by themselves, and they reached the old threshold while the player was still
  // working out A08/A09 — the crisis then fired four clicks *before* the word ever spread.
  const quiet = E.advance({ ...E.fresh(t), act: 2, published: true, readers: 1999 }, t + 10000);
  assert.equal(quiet.paperCrisis, false, 'a readership alone does not exhaust the paper');
  const loud = E.advance({ ...E.fresh(t), act: 2, published: true, readers: 1999, viralWords: 1 }, t + 10000);
  assert.equal(loud.paperCrisis, true, 'and it does as soon as the word is out');
  assert.ok(E.ahaUnlocked(loud, 'A10'));
  assert.ok(!E.ahaUnlocked(quiet, 'A10'));
});

test('A13 concepts spend meaning and change society', () => {
  // A concept needs a district to live in and a press to print it: `concepts < districts` is
  // what stops `discover-dialect` (+25 meaning) from funding this command one click at a time.
  let g = { ...E.fresh(t), act: 3, meaning: 100, districts: 2, worldScale: 1, credits: 200 };
  g = doIt(g, 'make-concept');
  assert.equal(g.concepts, 1);
  assert.equal(g.societyEffects, 1);
  assert.ok(g.meaning < 100);
  assert.ok(E.ahaUnlocked(g, 'A13'));
});

test('a concept cannot outnumber the districts that carry it', () => {
  const g = { ...E.fresh(t), act: 3, meaning: 500, districts: 1, concepts: 1, worldScale: 1, credits: 5000 };
  const after = doIt(g, 'make-concept');
  assert.equal(after.concepts, 1, 'no district, no new concept');
  assert.equal(after.meaning, 500, 'and the meaning is not spent on the refused attempt');
});

test('A16 and A18 move from authorship to self-expanding agents', () => {
  // Delegation that can replicate itself costs meaning and credits, doubling with each factory:
  // a flat price made agentFactories a free faucet that multiplied everything downstream.
  let g = { ...E.fresh(t), act: 3, worldScale: 2, districts: 4, concepts: 2, meaning: 400, credits: 2000 };
  g = doIt(g, 'launch-agents');
  assert.equal(g.act, 4);
  assert.equal(g.agents, 1);
  g = doIt(g, 'editor-autonomy');
  g = doIt(g, 'spawn-agents');
  assert.equal(g.agentFactories, 1);
  assert.ok(g.agents >= 5);
  assert.ok(E.ahaUnlocked(g, 'A18'));
});

test('a second agent factory costs more than the first', () => {
  const base = { ...E.fresh(t), act: 4, agents: 5, editorAutonomy: true, digital: true, meaning: 5000, credits: 5000 };
  const one = doIt(base, 'spawn-agents');
  const two = doIt(one, 'spawn-agents');
  assert.equal(two.agentFactories, 2);
  const firstCost = 5000 - one.credits;
  const secondCost = one.credits - two.credits;
  assert.ok(secondCost > firstCost, `second factory (${secondCost}) must cost more than the first (${firstCost})`);
});

test('A22 machine glyph emerges from autonomous digital archive', () => {
  let g = { ...E.fresh(t), act: 4, agents: 5, editorAutonomy: true, agentFactories: 3, digital: true, archives: 5 };
  g = doIt(g, 'discover-machine-glyph');
  assert.equal(g.act, 5);
  assert.equal(g.machineGlyphs, 1);
  assert.ok(E.ahaUnlocked(g, 'A22'));
  // Finding a glyph and the machines adopting it are two separate moments. Seeding the use
  // counter at its own threshold fired both on one click and the player saw two
  // announcements for a single decision.
  assert.equal(g.machineGlyphUse, 0, 'the glyph is not in use the moment it is found');
  assert.ok(!E.ahaUnlocked(g, 'A23'), 'adoption must not be granted by the discovery click');
  assert.ok(E.ahaUnlocked(E.advance(g, t + 40000), 'A23'), 'machines adopt the glyph as they use it');
});

test('A24 compression folds meaning into a compact representation, and takes more than one press', () => {
  // 100 meaning → 10,000 compressed meaning per press. The A24 threshold is five presses, so
  // the act does not collapse into a single click the moment the glyph is discovered.
  let g = { ...E.fresh(t), act: 5, meaning: 1000, machineGlyphs: 1, machineGlyphUse: 1000, credits: 3000 };
  g = doIt(g, 'compress-language', { amount: 100 });
  assert.equal(g.compressedMeaning, 10000);
  assert.ok(!E.ahaUnlocked(g, 'A24'), 'one press is not the whole insight');
  for (let i = 0; i < 4; i++) g = doIt(g, 'compress-language', { amount: 100 });
  assert.equal(g.compressedMeaning, 50000);
  assert.ok(E.ahaUnlocked(g, 'A24'));
  // Compressing a language no machine is using is compressing nothing.
  const idle = { ...E.fresh(t), act: 5, meaning: 1000, machineGlyphs: 1, machineGlyphUse: 0, credits: 3000 };
  assert.equal(doIt(idle, 'compress-language', { amount: 100 }).compressedMeaning, 0);
});

// The headline defect from the flow audit: ACT I took 651 clicks and the four acts after it
// took 35, because every gate was fed by exactly its own previous click. Counting decisions per
// act caught that collapse — but not the next one, because a per-act total says nothing about
// where inside the act the discoveries land. The gaps between *consecutive* Aha moments are what
// the player actually feels, so they are the metric here.
//
// Reference numbers for this revision: 27 gaps, mean 4.3 decisions, std 3.9, no gaps fired out
// of order, no two on the same click, and the only 0-click gaps are passive breaths of 25s+.
// The bands below are deliberately wide — they exist to catch a collapse, not to freeze tuning.
test('a plain playthrough reaches the ending, and the rhythm between Aha moments holds', () => {
  const run = playthrough(E);
  assert.equal(run.stopped, true, 'a player following the legal actions must be able to finish');
  const missing = E.AHAS.map((a) => a.id).filter((id) => !run.state.ahaSeen.includes(id));
  assert.deepEqual(missing, [], `a playthrough must not skip milestones: ${missing.join(', ')}`);
  for (const [act, n] of Object.entries(run.decisionsByAct)) {
    assert.ok(n >= 5, `ACT ${act} collapsed to ${n} decisions`);
  }
  assert.ok(run.decisionsByAct[6] >= 3, 'the ending is still a decision, not a formality');

  const rep = pacingReport(E, run, 'decisions');
  // 顺序：后一条不许抢在前一条之前发生。读者、噪音、机器用量都是自己涨的，
  // 只要门槛写成「绝对值到了就算」，它们就会抢跑——原来有 6 对是倒着的。
  assert.deepEqual(rep.inverted, [], `an Aha fired before the one it follows: ${rep.inverted.join(', ')}`);
  // 同拍：一次点击点亮两条，焦点卡只会显示后一条，前一条玩家根本没收到公告。
  assert.deepEqual(rep.sameTick, [], `two Aha moments on one click: ${rep.sameTick.join(', ')}`);
  // 静默拍可以存在（读者、文章、机器用量都是自己涨上去的那几拍），但必须是「等了一会儿」
  // 而不是「同一下」，而且不能多——一局里大部分发现都是零点击的等待，就是节奏又塌了。
  for (const beat of rep.silent) {
    assert.ok(beat.seconds >= 20, `${beat.pair}: ${beat.seconds}s apart is a collision, not a breath`);
  }
  assert.ok(rep.silent.length <= 3, `${rep.silent.length} discoveries arrived without a click between them`);
  // 节拍本身：均值不许塌到「一路点下去」也不许拉成「半天看不到一个」。
  assert.ok(rep.mean >= 3 && rep.mean <= 7, `mean gap ${rep.mean.toFixed(2)} is outside the 3–7 band`);
  // 标准差是这次真正在管的那条：修之前是 10.6（后面几章的戏全挤在几段里演完）。
  assert.ok(rep.std <= 5, `gap std ${rep.std.toFixed(2)} is too wide`);
  assert.ok(rep.max <= 20, `a gap of ${rep.max} means one stretch carries a whole act`);
});

test('A27 deletion becomes the late-game growth verb', () => {
  // The mass delete is unlocked by resolving ambiguity: while the world is still ambiguous
  // the player cannot tell noise from signal, and A27 raced ahead of A26.
  let g = { ...E.fresh(t), act: 6, infrastructure: true, noise: 1500, ambiguity: 100, ambiguityResolved: true, compressedMeaning: 50000 };
  g = doIt(g, 'delete-noise', { amount: 1000 });
  assert.equal(g.deletedNoise, 1000);
  assert.ok(E.ahaUnlocked(g, 'A27'));
});

test('A28 stop printing is a real terminal mechanic and production halts', () => {
  let g = { ...E.fresh(t), act: 6, infrastructure: true, ambiguityResolved: true, deletedNoise: 1000, compressedMeaning: 50000, keyboards: 100, glyphs: 50 };
  g = doIt(g, 'stop-printing');
  assert.equal(g.stopped, true);
  assert.equal(E.rate(g), 0);
  const h = E.advance(g, t + 3600000);
  assert.equal(h.glyphs, 50);
  assert.ok(E.ahaUnlocked(h, 'A28'));
});

test('director snapshots cover every Aha and land in the correct act', () => {
  for (const item of E.AHAS) {
    const g = E.directorState(item.id, t);
    assert.equal(g.act, item.act, item.id);
    assert.ok(E.ahaUnlocked(g, item.id), item.id);
  }
});

test('every Aha carries a player-facing world line with no internal vocabulary', () => {
  assert.equal(Object.keys(E.AHA_WORLD).length, 28);
  const seen = new Set();
  for (const item of E.AHAS) {
    const line = E.AHA_WORLD[item.id];
    assert.equal(typeof line, 'string', item.id);
    assert.ok(line.length >= 12, `${item.id}: too short to say anything`);
    assert.doesNotMatch(line, /\bA\d{2}\b|\bAHA\b|\bACT\b|Director|导演/i, item.id);
    assert.notEqual(line, item.title, item.id);
    assert.notEqual(line, item.reveal, item.id);
    assert.ok(!seen.has(line), `${item.id}: duplicate world line`);
    seen.add(line);
  }
});

// The defect this guards: an Aha's only trace was a `A## ·` line, and the privacy layer
// strips those from the player log. So the moment fired and the player saw nothing at all.
test('an Aha that fires always announces itself in the log the player can read', () => {
  for (const item of E.AHAS) {
    const seeded = E.directorState(item.id, t);
    const before = { ...seeded, log: [], ahaSeen: seeded.ahaSeen.filter((id) => id !== item.id) };
    const after = E.advance(before, t + 1000);
    assert.ok(after.ahaSeen.includes(item.id), `${item.id} did not fire`);
    const added = after.log.filter((line) => !before.log.includes(line));
    assert.ok(added.includes(E.AHA_WORLD[item.id]), `${item.id}: the world never announced it`);
    const fired = added.filter((line) => /^A\d{2} · /.test(line));
    assert.equal(fired.length, added.length - fired.length, `${item.id}: every recognition needs exactly one announcement`);
    // A fixture that also crosses a later threshold is allowed to announce both; what must
    // never happen is the player reading the newest line and it belonging to the other Aha.
    if (fired.length === 1) assert.equal(after.log[0], E.AHA_WORLD[item.id], `${item.id}: the announcement is not the newest line`);
  }
});

// E.commandReady is what greys a button out. If it ever disagrees with what act() accepts, the
// player gets a lit button that does nothing — or a greyed one that would have worked. The cost
// table does not model act windows or one-shot guards, so only the direction that matters for
// the disclosure contract is asserted: an unaffordable command must never be accepted.
test('the engine never accepts a command its own cost gate calls unaffordable', () => {
  const commands = [
    { type: 'compose-rule' }, { type: 'condense' }, { type: 'read-letter' }, { type: 'organic-word' },
    { type: 'viral-word' }, { type: 'discover-dialect' }, { type: 'make-concept' }, { type: 'spawn-agents' },
    { type: 'train-memory' }, { type: 'compress-language' }, { type: 'infrastructure' },
    { type: 'resolve-ambiguity' }, { type: 'launch-agents' }, { type: 'stop-printing' },
  ];
  const key = (g) => JSON.stringify({ ...g, log: 0, updatedAt: 0, ruleCredit: 0 });
  for (const item of E.AHAS) {
    const g = E.directorState(item.id, t);
    for (const command of commands) {
      for (const pad of [0, 1, 1000]) {
        const seeded = pad ? { ...g, glyphs: g.glyphs + pad, credits: g.credits + pad, meaning: g.meaning + pad } : g;
        // Baseline is the same tick with no command: padding resources can cross a milestone
        // on its own, and syncAhas() would then make a refused command look accepted.
        const at = t + 1000;
        // Readiness must be judged on the same state the command is actually applied to:
        // act() runs advance() first, and one tick of production can afford a cheap command
        // that the raw snapshot could not.
        const base = E.advance(seeded, at);
        const accepted = key(E.act(seeded, command, at)) !== key(base);
        const ready = E.commandReady(base, command.type).ready;
        assert.ok(ready || !accepted,
          `${item.id} + ${command.type} (pad ${pad}): accepted while its cost gate said ${JSON.stringify(E.commandReady(seeded, command.type).binding)}`);
      }
    }
  }
});

// One click, one insight. Three pairs used to fire together because the action granted the
// second Aha's threshold outright (digitize granted 100 articles, the glyph discovery granted
// 1000 uses, infrastructure granted 100 ambiguity), so the player got two announcements for
// one decision and could not tell which change caused which. An idle stretch may cross two
// thresholds at once — that is what offline catch-up means — so this pins actions only.
test('no single real action fires two Aha moments at once', () => {
  const commands = [
    { type: 'print' }, { type: 'sell' }, { type: 'buy', id: 'keyboards' }, { type: 'buy', id: 'typists' },
    { type: 'buy', id: 'presses' }, { type: 'boost' }, { type: 'research-auto' }, { type: 'toggle-auto' },
    { type: 'contract' }, { type: 'publish' }, { type: 'compose-rule' }, { type: 'condense' },
    { type: 'read-letter' }, { type: 'organic-word' }, { type: 'viral-word' }, { type: 'delete-noise' },
    { type: 'map-city' }, { type: 'discover-dialect' }, { type: 'make-concept' }, { type: 'map-world' },
    { type: 'launch-agents' }, { type: 'editor-autonomy' }, { type: 'spawn-agents' }, { type: 'digitize' },
    { type: 'train-memory' }, { type: 'discover-machine-glyph' }, { type: 'compress-language' },
    { type: 'infrastructure' }, { type: 'resolve-ambiguity' }, { type: 'stop-printing' },
  ];
  for (const item of E.AHAS) {
    const before = E.directorState(item.id, t);
    for (const command of commands) {
      const next = { ...E.act(before, command, t.updatedAt ?? t), updatedAt: t };
      const fired = next.ahaSeen.filter((id) => !before.ahaSeen.includes(id));
      assert.ok(fired.length <= 1, `${item.id} + ${command.type}: fired ${fired.join(' + ')}`);
    }
  }
});
