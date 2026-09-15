import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// 游戏没有外部运行时依赖；原始 HTML 同时作为离线版与线上版。
const root = new URL('../', import.meta.url);
const source = new URL('public/play.html', root);
const enhancementSource = new URL('public/game-accessibility-i18n.js', root);
const html = await readFile(source, 'utf8');
const enhancement = await readFile(enhancementSource, 'utf8');
if (!html.includes('const Engine =') || !html.includes('lang="zh-CN"')) {
  throw new Error('游戏入口缺失或不是中文可玩版本。');
}
if (!enhancement.includes('GlyphAccessibilityI18n')) {
  throw new Error('双语与无障碍增强脚本缺失。');
}

const scriptTag = '<script src="/game-accessibility-i18n.js" defer></script>';
const deployedHtml = html.includes(scriptTag) ? html : html.replace('</body>', `${scriptTag}\n</body>`);
const out = new URL('dist/', root);
await mkdir(out, { recursive: true });
await writeFile(new URL('index.html', out), deployedHtml);
await writeFile(new URL('play.html', out), deployedHtml);
await copyFile(enhancementSource, new URL('game-accessibility-i18n.js', out));

const manifest = {
  game: '字工厂 / Glyph Factory',
  sha256: createHash('sha256').update(deployedHtml).digest('hex'),
  bytes: Buffer.byteLength(deployedHtml),
  accessibility: VERSION_SAFE(enhancement),
};
await writeFile(new URL('build.json', out), JSON.stringify(manifest, null, 2) + '\n');
console.log(`静态构建完成：${manifest.bytes} 字节；SHA-256 ${manifest.sha256}；双语与无障碍增强已启用`);

function VERSION_SAFE(sourceText) {
  const match = sourceText.match(/const VERSION = '([^']+)'/);
  return match?.[1] || 'enabled';
}
