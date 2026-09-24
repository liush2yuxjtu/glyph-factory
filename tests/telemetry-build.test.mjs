import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));

// PostHog is injected by build-static.mjs only when POSTHOG_PROJECT_TOKEN is set. Each build here
// states its own environment, so the result does not depend on whether the machine running the
// suite (Vercel's production build included) has a token configured.
test('player build telemetry is opt-in and fails closed on a malformed token', async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), 'glyph-telemetry-build-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await cp(join(root, 'scripts'), join(fixture, 'scripts'), { recursive: true });
  await cp(join(root, 'public'), join(fixture, 'public'), { recursive: true });
  const base = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('POSTHOG_')));
  const build = (extra) => spawnSync(process.execPath, ['scripts/build-static.mjs'],
    { cwd: fixture, env: { ...base, ...extra }, encoding: 'utf8', timeout: 15000 });
  const dist = join(fixture, 'dist');

  await t.test('no token: not one byte of telemetry', async () => {
    assert.equal(build({}).status, 0);
    for (const file of await readdir(dist)) {
      assert.doesNotMatch(await readFile(join(dist, file), 'utf8'), /posthog/i, file);
    }
    assert.equal(JSON.parse(await readFile(join(dist, 'build.json'), 'utf8')).telemetry, 'none');
  });

  await t.test('token: the loader is inlined into both entry pages with the minimal config', async () => {
    assert.equal(build({ POSTHOG_PROJECT_TOKEN: 'phc_buildContract', POSTHOG_HOST: 'https://eu.i.posthog.com/' }).status, 0);
    const html = await readFile(join(dist, 'play.html'), 'utf8');
    assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), html);
    const config = JSON.parse(html.match(/\}\)\((\{.*?\})\)<\/script>/)[1]);
    assert.equal(config.token, 'phc_buildContract');
    assert.equal(config.src, 'https://eu-assets.i.posthog.com/static/array.js');
    assert.equal(config.options.api_host, 'https://eu.i.posthog.com');
    assert.equal(config.options.autocapture, false);
    assert.equal(config.options.disable_session_recording, true);
    assert.equal(config.options.persistence, 'memory');
    // The listeners must be in <head>, ahead of the game scripts, or a boot crash is missed.
    assert.ok(html.indexOf("addEventListener('error'") < html.indexOf('src="/glyph-engine-v3.js"'));
    assert.equal(JSON.parse(await readFile(join(dist, 'build.json'), 'utf8')).telemetry, 'posthog');
  });

  await t.test('a malformed token or host stops the build instead of shipping it', () => {
    assert.notEqual(build({ POSTHOG_PROJECT_TOKEN: 'phc_x"</script><script>alert(1)' }).status, 0);
    assert.notEqual(build({ POSTHOG_PROJECT_TOKEN: 'phc_ok', POSTHOG_HOST: 'http://insecure.example' }).status, 0);
    assert.notEqual(build({ POSTHOG_PROJECT_TOKEN: 'phc_ok', POSTHOG_HOST: 'https://x.example/path' }).status, 0);
  });
});
