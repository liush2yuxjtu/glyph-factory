import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controller = await readFile(new URL('../public/glyph-game-v3.js', import.meta.url), 'utf8');
const builder = await readFile(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const intent = await readFile(new URL('../public/intent.html', import.meta.url), 'utf8');

test('future game surfaces are progressively disclosed instead of rendered disabled', () => {
  assert.match(controller, /const visibleActs = preview \? E\.ACTS : E\.ACTS\.filter\(\(act\) => act\.id <= s\.act\)/);
  assert.match(controller, /const visible = preview \? E\.AHAS : E\.AHAS\.filter\(\(item\)=>seen\.has\(item\.id\)\)/);
  assert.match(controller, /\$\('world-card'\)\.hidden = !isDirector && s\.act < 3/);
  assert.match(controller, /add\(s\.glyphs>=1, label\(ACTIONS\.sell\)/);
  assert.match(controller, /add\(s\.deletedNoise>=1000&&s\.compressedMeaning>=10000, label\(ACTIONS\.stop\)/);
  assert.doesNotMatch(controller, /b\.disabled\s*=/);
});

test('resource metrics appear only after they become meaningful', () => {
  assert.match(controller, /metric\('credits', isDirector \|\| s\.credits>0/);
  assert.match(controller, /metric\('meaning', isDirector \|\| s\.meaning>0/);
  assert.match(controller, /metric\('noise', isDirector \|\| s\.noise>0/);
});

test('intent.html ships in the static review bundle', () => {
  assert.match(builder, /'intent\.html'/);
  assert.match(builder, /progressiveDisclosure: true/);
  assert.match(intent, /不用，就不存在/);
  assert.match(intent, /Hidden until actionable/);
});
