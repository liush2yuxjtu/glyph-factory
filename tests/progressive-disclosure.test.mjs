import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, cp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const allowed = ['404.html', '500.html', 'build.json', 'glyph-engine-v3.js', 'glyph-game-v3.js', 'index.html', 'play.html', 'player-privacy-v3.js'].sort();
const engine = (source) => vm.runInNewContext(`${source}\nGlyphEngineV3;`, {}, { timeout: 2000 });
const plainState = (state) => { const copy = JSON.parse(JSON.stringify(state)); delete copy.log; return copy; };

// Exercise the real builder in isolation. Parallel Node test files cannot contaminate dist/.
test('production build contracts', async (t) => {
  const fixture = await mkdtemp(join(tmpdir(), 'glyph-player-contract-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await cp(join(root, 'scripts'), join(fixture, 'scripts'), { recursive: true });
  await cp(join(root, 'public'), join(fixture, 'public'), { recursive: true });
  const dist = join(fixture, 'dist');
  await mkdir(join(dist, 'docs'), { recursive: true });
  for (const path of ['intent.html', 'preview.html', 'glyph-factory-v3-preview.webm', 'docs/design.md', 'runtime.js.map']) {
    await writeFile(join(dist, path), 'INTERNAL REVIEW MATERIAL');
  }
  const build = () => {
    const result = spawnSync(process.execPath, ['scripts/build-static.mjs'], { cwd: fixture, encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  };
  build();

  await t.test('rebuild removes stale review artifacts, nested docs and source maps', async () => {
    assert.deepEqual((await readdir(dist)).sort(), allowed);
    await writeFile(join(dist, 'intent.html'), 'stale file from a previous deployment');
    build();
    assert.deepEqual((await readdir(dist)).sort(), allowed);
  });

  const html = await readFile(join(dist, 'play.html'), 'utf8');
  const sourceEngine = await readFile(join(root, 'public/glyph-engine-v3.js'), 'utf8');
  const playerEngine = await readFile(join(dist, 'glyph-engine-v3.js'), 'utf8');
  const controller = await readFile(join(dist, 'glyph-game-v3.js'), 'utf8');
  const privacy = await readFile(join(dist, 'player-privacy-v3.js'), 'utf8');

  await t.test('every emitted runtime parses and every script URL resolves to an emitted file', async () => {
    for (const script of [playerEngine, controller, privacy]) assert.doesNotThrow(() => new vm.Script(script));
    const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(scripts.length, 3);
    for (const script of scripts) assert.ok(allowed.includes(script.replace(/^\//, '')), `Missing script: ${script}`);
    assert.equal(await readFile(join(dist, 'index.html'), 'utf8'), html);
    assert.doesNotMatch(html, /href="\/(?:intent|preview|eli5-aha)(?:\.html)?"/);
  });

  await t.test('actual deployed catalog contains no designer titles or reveal explanations', () => {
    const source = engine(sourceEngine);
    const player = engine(playerEngine);
    assert.equal(player.AHAS.length, source.AHAS.length);
    for (const item of player.AHAS) {
      assert.equal(item.title, '', item.id);
      assert.equal(item.reveal, '', item.id);
    }
    for (const item of source.AHAS) {
      assert.ok(item.reveal.length > 0);
      // The design copy must not survive anywhere in the payload, not just in the AHAS entries.
      assert.ok(!playerEngine.includes(item.reveal), `${item.id}: reveal copy shipped to players`);
    }
    // The inverse contract: the world lines ARE player copy and must survive the same strip.
    // Without them an Aha fires and the player surface shows nothing at all, which is exactly
    // the defect this pins — the `A## ·` line that used to carry the moment is scrubbed.
    for (const item of player.AHAS) {
      const line = player.AHA_WORLD[item.id];
      assert.equal(typeof line, 'string', `${item.id}: no world line in the player build`);
      assert.ok(line.length >= 12, `${item.id}: world line is too short to say anything`);
      assert.doesNotMatch(line, /\bA\d{2}\b|\bAHA\b|\bACT\b|Director|导演/i, item.id);
    }
  });

  await t.test('source and deployed engines produce identical gameplay across all stages', () => {
    const source = engine(sourceEngine);
    const player = engine(playerEngine);
    const now = 1800000000000;
    const commands = [
      { type: 'print' }, { type: 'sell' }, { type: 'buy', id: 'keyboards' },
      { type: 'boost' }, { type: 'research-auto' }, { type: 'contract' },
      { type: 'publish' }, { type: 'compose-rule' }, { type: 'condense' },
      { type: 'read-letter' }, { type: 'organic-word' }, { type: 'viral-word' },
      { type: 'delete-noise' }, { type: 'map-city' }, { type: 'discover-dialect' },
      { type: 'make-concept' }, { type: 'map-world' }, { type: 'launch-agents' },
      { type: 'editor-autonomy' }, { type: 'spawn-agents' }, { type: 'digitize' },
      { type: 'train-memory' }, { type: 'discover-machine-glyph' },
      { type: 'compress-language', amount: 100 }, { type: 'infrastructure' },
      { type: 'resolve-ambiguity' }, { type: 'stop-printing' },
    ];
    // Internal fixtures stay in tests. No player/debug URL is used.
    for (const id of source.AHAS.map((item) => item.id)) {
      let a = { ...source.directorState(id, now), glyphs: 6000, credits: 1000, meaning: 1000 };
      let b = player.restore(JSON.stringify(a), now);
      a = source.restore(JSON.stringify(a), now);
      for (let i = 0; i < commands.length; i++) {
        a = source.act(a, commands[i], now + i * 500);
        b = player.act(b, commands[i], now + i * 500);
        assert.deepEqual(plainState(b), plainState(a), `${id} / ${commands[i].type}`);
      }
    }
  });

  await t.test('manifest integrity is calculated from actual player bytes', async () => {
    const manifest = JSON.parse(await readFile(join(dist, 'build.json'), 'utf8'));
    const payload = html + playerEngine + controller + privacy;
    assert.equal(manifest.playerSpoilers, false);
    assert.equal(manifest.internalReviewArtifactsDeployed, false);
    assert.equal(manifest.sha256, createHash('sha256').update(payload).digest('hex'));
    assert.equal(manifest.bytes, Buffer.byteLength(payload));
  });

  await t.test('repeated builds are byte-identical', async () => {
    const before = await Promise.all(allowed.map((name) => readFile(join(dist, name))));
    build();
    const after = await Promise.all(allowed.map((name) => readFile(join(dist, name))));
    assert.deepEqual(after, before);
  });
});

// The renderer's own disclosure rule: affordability may disable a discovered action,
// never hide it. Auto-sell floors stock below 1 every tick, so any reveal condition
// reading stock or credits is unreachable for exactly the players who automated first.
test('affordability never hides a discovered action', async () => {
  const source = await readFile(join(root, 'public/glyph-game-v3.js'), 'utf8');

  // Pull every add('key', revealWhen, enabled, ...) call's two leading arguments.
  const calls = [];
  for (let at = source.indexOf('add('); at >= 0; at = source.indexOf('add(', at + 1)) {
    if (/[\w.$]/.test(source[at - 1] || '')) continue; // skip `revealed.add(key)` and friends

    let depth = 0, end = at + 3;
    for (; end < source.length; end += 1) {
      if (source[end] === '(') depth += 1;
      else if (source[end] === ')') { depth -= 1; if (depth === 0) break; }
    }
    const args = [];
    let current = '', nested = 0;
    for (const character of source.slice(at + 4, end)) {
      if ('([{'.includes(character)) nested += 1;
      if (')]}'.includes(character)) nested -= 1;
      if (character === ',' && nested === 0) { args.push(current.trim()); current = ''; } else current += character;
    }
    args.push(current.trim());
    calls.push({ key: args[0], reveal: args[1], enabled: args[2] });
  }

  assert.ok(calls.length >= 20, `expected the full action grid, parsed ${calls.length}`);
  for (const call of calls) {
    assert.notEqual(call.reveal, call.enabled, `${call.key}: reveal and enable are the same expression`);
    assert.doesNotMatch(call.reveal, /\bs\.(?:glyphs|credits)\b/, `${call.key}: reveal reads spendable stock or credits`);
  }

  // One toggle for every act: publishing with auto-sell on must not strand the player.
  assert.equal(source.match(/'toggle-auto'/g).length, 1);
});
