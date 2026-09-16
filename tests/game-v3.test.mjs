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
