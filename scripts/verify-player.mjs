import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = new Set(process.argv.slice(2));
if ([...args].some((arg) => arg !== '--fast')) {
  console.error('Usage: node scripts/verify-player.mjs [--fast]');
  process.exit(2);
}
function run(command, parameters) {
  const result = spawnSync(command, parameters, { cwd: root, stdio: 'inherit', env: process.env });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}
const tests = readdirSync(new URL('../tests/', import.meta.url)).filter((name) => name.endsWith('.test.mjs')).sort();
if (!tests.length) throw new Error('No Node tests discovered. Refusing a false-green verification.');
run(process.execPath, ['--test', ...tests.map((name) => `tests/${name}`)]);
run(process.execPath, ['scripts/build-static.mjs']);
if (!args.has('--fast')) {
  run(process.env.PYTHON || 'python3', ['-m', 'unittest', 'discover', '-s', 'tests/browser', '-p', 'test_*.py', '-v']);
}
