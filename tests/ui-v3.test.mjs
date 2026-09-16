import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/play.html', import.meta.url), 'utf8');

test('play page boots Acts Engine v3 and exposes Director Mode controls', () => {
  assert.match(html, /glyph-engine-v3\.js/);
  assert.match(html, /glyph-game-v3\.js/);
  assert.match(html, /id="director-select"/);
  assert.match(html, /id="director-apply"/);
  assert.match(html, /id="aha-list"/);
});
