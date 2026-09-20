import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
  let g = { ...E.fresh(t), act: 2, published: true, glyphs: 10 };
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
  const g = E.advance({ ...E.fresh(t), act: 2, published: true, readers: 99, composed: 20 }, t + 10000);
  assert.ok(g.readers > 100);
  assert.ok(g.demand > 1);
  assert.ok(E.ahaUnlocked(g, 'A06'));
});

test('A10 scarcity flips on when readership crosses paper crisis threshold', () => {
  const g = E.advance({ ...E.fresh(t), act: 2, published: true, readers: 1000 }, t + 1000);
  assert.equal(g.paperCrisis, true);
  assert.ok(E.ahaUnlocked(g, 'A10'));
});

test('A13 concepts spend meaning and change society', () => {
  let g = { ...E.fresh(t), act: 3, meaning: 100, districts: 2, worldScale: 1 };
  g = doIt(g, 'make-concept');
  assert.equal(g.concepts, 1);
  assert.equal(g.societyEffects, 1);
  assert.ok(g.meaning < 100);
  assert.ok(E.ahaUnlocked(g, 'A13'));
});

test('A16 and A18 move from authorship to self-expanding agents', () => {
  let g = { ...E.fresh(t), act: 3, worldScale: 2, districts: 4, concepts: 2 };
  g = doIt(g, 'launch-agents');
  assert.equal(g.act, 4);
  assert.equal(g.agents, 1);
  g = doIt(g, 'editor-autonomy');
  g = doIt(g, 'spawn-agents');
  assert.equal(g.agentFactories, 1);
  assert.ok(g.agents >= 5);
  assert.ok(E.ahaUnlocked(g, 'A18'));
});

test('A22 machine glyph emerges from autonomous digital archive', () => {
  let g = { ...E.fresh(t), act: 4, agents: 5, editorAutonomy: true, agentFactories: 1, digital: true, archives: 1 };
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

test('A24 compression can turn meaning into a massive compact representation', () => {
  let g = { ...E.fresh(t), act: 5, meaning: 200, machineGlyphs: 1 };
  g = doIt(g, 'compress-language', { amount: 100 });
  assert.equal(g.compressedMeaning, 10000);
  assert.ok(E.ahaUnlocked(g, 'A24'));
});

test('A27 deletion becomes the late-game growth verb', () => {
  let g = { ...E.fresh(t), act: 6, infrastructure: true, noise: 1500, ambiguity: 100, compressedMeaning: 10000 };
  g = doIt(g, 'delete-noise', { amount: 1000 });
  assert.equal(g.deletedNoise, 1000);
  assert.ok(E.ahaUnlocked(g, 'A27'));
});

test('A28 stop printing is a real terminal mechanic and production halts', () => {
  let g = { ...E.fresh(t), act: 6, infrastructure: true, deletedNoise: 1000, compressedMeaning: 10000, keyboards: 100, glyphs: 50 };
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
