import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controller = await readFile(new URL('../public/glyph-game-v3.js', import.meta.url), 'utf8');
const builder = await readFile(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const intent = await readFile(new URL('../public/intent.html', import.meta.url), 'utf8');

test('future game surfaces stay hidden until discovery', () => {
  assert.match(controller, /const visibleActs = preview \? E\.ACTS : E\.ACTS\.filter\(\(act\) => act\.id <= s\.act\)/);
  assert.match(controller, /const visible = preview \? E\.AHAS : E\.AHAS\.filter\(\(item\)=>seen\.has\(item\.id\)\)/);
  assert.match(controller, /\$\('world-card'\)\.hidden = !isDirector && s\.act < 3/);
});

test('a discovered surface is remembered and never disappears because resources dropped', () => {
  assert.match(controller, /const REVEAL_KEY = 'glyph-factory-ui-reveals-v3'/);
  assert.match(controller, /function rememberReveal\(key, condition = false\)/);
  assert.match(controller, /revealed\.add\(key\); saveReveals\(\)/);
  assert.match(controller, /rememberReveal\(`action:\$\{key\}`/);
  assert.match(controller, /b\.disabled=!enabled/);
  assert.match(controller, /rememberReveal\(`machine:\$\{u\.id\}`/);
  assert.match(controller, /rememberReveal\(`metric:\$\{key\}`/);
});

test('reset clears both game progress and remembered UI reveals', () => {
  assert.match(controller, /function clearReveals\(\)/);
  assert.match(controller, /localStorage\.removeItem\(REVEAL_KEY\)/);
  assert.match(controller, /g=E\.fresh\(\);preview=null;clearReveals\(\);save\(true\);render\(\)/);
});

test('intent.html ships in the static review bundle', () => {
  assert.match(builder, /'intent\.html'/);
  assert.match(builder, /progressiveDisclosure: true/);
  assert.match(intent, /不用，就不存在/);
  assert.match(intent, /Hidden until actionable/);
});
