import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const controller = await readFile(new URL('../public/glyph-game-v3.js', import.meta.url), 'utf8');
const builder = await readFile(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
const privacy = await readFile(new URL('../public/player-privacy-v3.js', import.meta.url), 'utf8');
const intent = await readFile(new URL('../public/intent.html', import.meta.url), 'utf8');

test('future game surfaces stay hidden until discovery', () => {
  assert.match(controller, /const visibleActs = preview \? E\.ACTS : E\.ACTS\.filter\(\(act\) => act\.id <= s\.act\)/);
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

test('normal player UI hides design/review language and scrubs internal event lines', () => {
  assert.match(privacy, /localReviewHost/);
  assert.match(privacy, /remove\('\.head-actions a\[href="\/preview\.html"\]'\)/);
  assert.match(privacy, /remove\('#director-toggle'\)/);
  assert.match(privacy, /hide\('\.aha-focus'\)/);
  assert.match(privacy, /hide\('#act-strip'\)/);
  assert.match(privacy, /hide\('\.act-title'\)/);
  assert.match(privacy, /filter\(\(line\) => !\/\^\[›·\]\?\\s\*A\\d\{2\}/);
});

test('production bundle does not deploy designer Aha review artifacts', () => {
  assert.match(builder, /playerSpoilers: false/);
  assert.match(builder, /internalReviewArtifactsDeployed: false/);
  assert.match(builder, /writeFile\(new URL\('glyph-engine-v3\.js', out\), playerEngine\)/);
  assert.match(builder, /writeFile\(new URL\('glyph-game-v3\.js', out\), playerController\)/);
  assert.match(builder, /copyFile\(new URL\('player-privacy-v3\.js'/);
  assert.doesNotMatch(builder, /copyFile\(new URL\('preview\.html'/);
  assert.doesNotMatch(builder, /copyFile\(new URL\('intent\.html'/);
  assert.doesNotMatch(builder, /copyFile\(new URL\('glyph-factory-v3-preview\.webm'/);
});

test('intent is explicitly internal and documents the one-way reveal contract', () => {
  assert.match(intent, /内部设计\/开发材料/);
  assert.match(intent, /hidden → revealed → persistent → intentionally replaced/);
  assert.match(intent, /A01–A28/);
  assert.match(intent, /生产玩家界面不能出现 Aha/);
});
