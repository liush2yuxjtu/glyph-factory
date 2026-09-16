import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const client = readFileSync(new URL('../src/app/aha-lab/AhaLabClient.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../src/app/aha-lab/page.tsx', import.meta.url), 'utf8');

const expected = Array.from({ length: 28 }, (_, index) => `A${String(index + 1).padStart(2, '0')}`);

test('Aha Lab includes exactly A01 through A28', () => {
  for (const id of expected) assert.match(client, new RegExp(`\\[\\"${id}\\"`), `${id} trigger is missing`);
  const declared = [...client.matchAll(/\["(A\d{2})",/g)].map((match) => match[1]);
  assert.deepEqual(declared, expected);
});

test('Aha Lab drives the real game director controls', () => {
  assert.match(client, /contentDocument/);
  assert.match(client, /director-select/);
  assert.match(client, /director-preview/);
  assert.match(client, /\/play\.html\?director=1/);
  assert.match(client, /验证全部 28 个 Aha/);
});

test('Aha Lab stays out of production', () => {
  assert.match(route, /process\.env\.VERCEL_ENV === "production"/);
  assert.match(route, /notFound\(\)/);
  assert.match(route, /index: false/);
});
