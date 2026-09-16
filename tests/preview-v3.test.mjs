import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';

const html = readFileSync(new URL('../public/preview.html', import.meta.url), 'utf8');

test('preview page embeds the deployed WebM and all 28 Aha IDs', () => {
  assert.match(html, /<video[^>]+controls/);
  assert.match(html, /glyph-factory-v3-preview\.webm/);
  for (let i = 1; i <= 28; i++) assert.match(html, new RegExp(`A${String(i).padStart(2,'0')}`));
  assert.match(html, /\?director=1/);
});

test('preview video is a non-empty WebM asset', () => {
  const video = new URL('../public/glyph-factory-v3-preview.webm', import.meta.url);
  assert.ok(statSync(video).size > 20_000);
});
