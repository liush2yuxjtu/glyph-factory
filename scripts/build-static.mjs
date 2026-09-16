import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const publicDir = new URL('public/', root);
const out = new URL('dist/', root);
const assets = [
  'play.html',
  'glyph-engine-v3.js',
  'glyph-game-v3.js',
  'preview.html',
  'glyph-factory-v3-preview.webm',
];
const [html, engine, controller, preview] = await Promise.all([
  readFile(new URL('play.html', publicDir), 'utf8'),
  readFile(new URL('glyph-engine-v3.js', publicDir), 'utf8'),
  readFile(new URL('glyph-game-v3.js', publicDir), 'utf8'),
  readFile(new URL('preview.html', publicDir), 'utf8'),
]);

if (!html.includes('lang="zh-CN"') || !html.includes('/glyph-engine-v3.js') || !html.includes('/glyph-game-v3.js')) {
  throw new Error('v3 游戏入口缺失或脚本引用不完整。');
}
if (!engine.includes('GlyphEngineV3') || !engine.includes("aha('A28'")) {
  throw new Error('Acts Engine v3 或 28 个 Aha 未完整交付。');
}
if (!controller.includes('director-select') || !controller.includes('E.SAVE_KEY')) {
  throw new Error('v3 UI / Director Mode / save controller 缺失。');
}
if (!preview.includes('glyph-factory-v3-preview.webm') || !preview.includes('A28')) {
  throw new Error('PR preview 页面或内嵌视频引用缺失。');
}

await mkdir(out, { recursive: true });
await writeFile(new URL('index.html', out), html);
for (const asset of assets) await copyFile(new URL(asset, publicDir), new URL(asset, out));

const digest = (text) => createHash('sha256').update(text).digest('hex');
const manifest = {
  game: '字工厂 / Glyph Factory',
  version: 3,
  entry: 'play.html',
  preview: 'preview.html',
  trailer: 'glyph-factory-v3-preview.webm',
  ahaMoments: 28,
  sha256: digest(html + engine + controller + preview),
  bytes: Buffer.byteLength(html) + Buffer.byteLength(engine) + Buffer.byteLength(controller) + Buffer.byteLength(preview),
};
await writeFile(new URL('build.json', out), JSON.stringify(manifest, null, 2) + '\n');
console.log(`静态构建完成：Acts Engine v${manifest.version} · ${manifest.ahaMoments} Aha · ${manifest.bytes} text bytes · preview video included`);
