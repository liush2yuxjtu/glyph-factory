import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const intent = readFileSync(new URL('../intent.md', import.meta.url), 'utf8');
const html = readFileSync(new URL('../public/intent.html', import.meta.url), 'utf8');
const play = readFileSync(new URL('../public/play.html', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../public/glyph-game-v3.js', import.meta.url), 'utf8');

test('canonical Aha intent requires absence before discovery', () => {
  assert.match(intent, /Hidden means absent/);
  assert.match(intent, /Runtime Surface Completeness/);
  assert.match(html, /Screens \+ Flows/);
});

test('runtime layout collapses undiscovered surfaces', () => {
  assert.match(play, /hero\.single/);
  assert.match(play, /below\.single/);
  assert.match(play, /id="systems-panel"/);
  assert.match(controller, /hero-layout/);
  assert.match(controller, /systemsPanel\.hidden/);
});
