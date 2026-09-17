import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, readdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'glyph-devlab-contract-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(join(root, 'scripts'), join(dir, 'scripts'), { recursive: true });
  await cp(join(root, 'public'), join(dir, 'public'), { recursive: true });
  return dir;
}

function build(cwd, vercelEnv) {
  const result = spawnSync(process.execPath, ['scripts/build-static.mjs'], {
    cwd, encoding: 'utf8', timeout: 15000,
    env: { ...process.env, VERCEL_ENV: vercelEnv },
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

test('Developer Lab is emitted only for Vercel Preview builds', async (t) => {
  const dir = await fixture(t);
  const lab = join(dir, 'dist/developer-lab.html');
  build(dir, 'production');
  assert.equal(existsSync(lab), false, 'production must not expose Developer Lab');
  build(dir, 'preview');
  assert.equal(existsSync(lab), true, 'preview must expose Developer Lab');

  const html = await readFile(lab, 'utf8');
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(html, /src='\/play\.html\?director=1'|src="\/play\.html\?director=1"|next\.src='\/play\.html\?director=1'/);
  assert.match(html, /data-aha-selector/);
  assert.match(html, /withQuiescedPlayer/);
  assert.match(html, /finally\{mountPlayer\(\);\}/);
  assert.match(html, /localStorage\.setItem\(e\.SAVE_KEY/);
  assert.match(html, /localStorage\.removeItem\(e\.SAVE_KEY/);

  const ids = [...html.matchAll(/\['(A\d{2})','/g)].map((match) => match[1]);
  assert.deepEqual(ids, Array.from({ length: 28 }, (_, i) => 'A' + String(i + 1).padStart(2, '0')));

  const emitted = await readdir(join(dir, 'dist'));
  assert.ok(emitted.includes('play.html'));
  assert.ok(emitted.includes('developer-lab.html'));
});

test('Developer Lab resource controls preserve the real shared-save contract', async (t) => {
  const dir = await fixture(t);
  build(dir, 'preview');
  const html = await readFile(join(dir, 'dist/developer-lab.html'), 'utf8');
  for (const amount of [100, 1000, 10000, 1000000]) {
    assert.match(html, new RegExp('data-dev-add="credits:' + amount + '"'));
    assert.match(html, new RegExp('data-dev-add="glyphs:' + amount + '"'));
  }
  assert.match(html, /credits:safe\(state\.credits\+amount\)/);
  assert.match(html, /glyphs:safe\(state\.glyphs\+amount\)/);
  assert.match(html, /lifetimeGlyphs:safe\(Math\.max\(state\.lifetimeGlyphs,state\.glyphs\)\+amount\)/);
});