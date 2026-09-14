import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

// 游戏没有外部运行时依赖；原始 HTML 同时作为离线版与线上版。
const root = new URL('../', import.meta.url);
const source = new URL('public/play.html', root);
const html = await readFile(source, 'utf8');
if (!html.includes('const Engine =') || !html.includes('lang="zh-CN"')) {
  throw new Error('游戏入口缺失或不是中文可玩版本。');
}
const out = new URL('dist/', root);
await mkdir(out, { recursive: true });
await copyFile(source, new URL('index.html', out));
await copyFile(source, new URL('play.html', out));
const manifest = { game: '字工厂', sha256: createHash('sha256').update(html).digest('hex'), bytes: Buffer.byteLength(html) };
await writeFile(new URL('build.json', out), JSON.stringify(manifest, null, 2) + '\n');
console.log(`静态构建完成：${manifest.bytes} 字节；SHA-256 ${manifest.sha256}`);
