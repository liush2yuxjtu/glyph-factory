import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/app/GameShell.tsx', import.meta.url), 'utf8');

test('root shell points at v3 play page without injecting legacy enhancers', () => {
  assert.match(source, /src="\/play\.html"/);
  assert.doesNotMatch(source, /game-accessibility-i18n/);
  assert.doesNotMatch(source, /simple-interaction/);
  assert.doesNotMatch(source, /injectEnhancements/);
});
