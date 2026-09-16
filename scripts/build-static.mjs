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
  'intent.html',
  'glyph-factory-v3-preview.webm',
];
const [html, engine, controller, preview, intent] = await Promise.all([
  readFile(new URL('play.html', publicDir), 'utf8'),
  readFile(new URL('glyph-engine-v3.js', publicDir), 'utf8'),
  readFile(new URL('glyph-game-v3.js', publicDir), 'utf8'),
  readFile(new URL('preview.html', publicDir), 'utf8'),
  readFile(new URL('intent.html', publicDir), 'utf8'),
]);

if (!html.includes('lang="zh-CN"') || !html.includes('/glyph-engine-v3.js') || !html.includes('/glyph-game-v3.js')) {
  throw new Error('v3 游戏入口缺失或脚本引用不完整。');
}
if (!engine.includes('GlyphEngineV3') || !engine.includes("aha('A28'")) {
  throw new Error('Acts Engine v3 或 28 个 Aha 未完整交付。');
}
if (!controller.includes('director-select') || !controller.includes('E.SAVE_KEY') || !controller.includes('renderDisclosure')) {
  throw new Error('v3 UI / Director Mode / progressive disclosure controller 缺失。');
}
if (!preview.includes('glyph-factory-v3-preview.webm') || !preview.includes('A28')) {
  throw new Error('PR preview 页面或内嵌视频引用缺失。');
}
if (!intent.includes('不用，就不存在') || !intent.includes('Hidden until actionable')) {
  throw new Error('intent.html progressive disclosure design contract 缺失。');
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
  intent: 'intent.html',
  trailer: 'glyph-factory-v3-preview.webm',
  ahaMoments: 28,
  progressiveDisclosure: true,
  sha256: digest(html + engine + controller + preview + intent),
  bytes: Buffer.byteLength(html) + Buffer.byteLength(engine) + Buffer.byteLength(controller) + Buffer.byteLength(preview) + Buffer.byteLength(intent),
};
await writeFile(new URL('build.json', out), JSON.stringify(manifest, null, 2) + '\n');
console.log(`静态构建完成：Acts Engine v${manifest.version} · ${manifest.ahaMoments} Aha · progressive disclosure · ${manifest.bytes} text bytes · preview video included`);
