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
  assert.ok(a.meaning >= 100, 'A22 Director snapshot must expose an enabled Act V action');
  assert.ok(E.ahaUnlocked(a, 'A22'));

  const a23 = E.directorState('A23', t);
  assert.equal(a23.act, 5);
  assert.ok(a23.meaning >= 100, 'A23 Director snapshot must remain playable');
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
  assert.ok(E.ahaUnlocked(g, 'A23'));
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
