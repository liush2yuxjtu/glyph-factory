import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('正式玩家版本以简体中文为默认语言', async () => {
  const [html, privacy, policy] = await Promise.all([
    readFile(new URL('public/play.html', root), 'utf8'),
    readFile(new URL('public/player-privacy-v3.js', root), 'utf8'),
    readFile(new URL('docs/development/player-language-policy.zh-CN.md', root), 'utf8'),
  ]);

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(privacy, /localStorage\.setItem\(LOCALE_KEY, 'zh-CN'\)/);
  assert.match(privacy, /document\.getElementById\('lang-toggle'\)\?\.click\(\)/);
  assert.match(policy, /正式玩家版本必须以\*\*简体中文作为默认语言和第一语言\*\*/);
});

test('中文玩家界面清理关键英文残留', async () => {
  const privacy = await readFile(new URL('public/player-privacy-v3.js', root), 'utf8');

  for (const chinese of ['世界模型', '系统', '智能体', '传播网络', '资金', '最近 40 条']) {
    assert.ok(privacy.includes(chinese), `缺少中文玩家文案：${chinese}`);
  }

  assert.match(privacy, /replace\(\/Agent\/g, '智能体'\)/);
  assert.match(privacy, /replace\(\/\\bcredits\\b\/gi, '资金'\)/);
  assert.match(privacy, /\['WORLD', '世界'\]/);
  assert.match(privacy, /\['SILENCE', '静默'\]/);
});

test('语言规范要求保留主动英文切换而不是强制锁死中文', async () => {
  const [privacy, policy] = await Promise.all([
    readFile(new URL('public/player-privacy-v3.js', root), 'utf8'),
    readFile(new URL('docs/development/player-language-policy.zh-CN.md', root), 'utf8'),
  ]);

  assert.match(privacy, /if \(!savedLocale && document\.documentElement\.lang === 'en'\)/);
  assert.match(policy, /玩家明确切换到英文后，可以保存这个偏好/);
});
