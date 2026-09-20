import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const publicDir = new URL('public/', root);
const out = new URL('dist/', root);

const [html, engine, controller, privacy, preview, intent] = await Promise.all([
  readFile(new URL('play.html', publicDir), 'utf8'),
  readFile(new URL('glyph-engine-v3.js', publicDir), 'utf8'),
  readFile(new URL('glyph-game-v3.js', publicDir), 'utf8'),
  readFile(new URL('player-privacy-v3.js', publicDir), 'utf8'),
  readFile(new URL('preview.html', publicDir), 'utf8'),
  readFile(new URL('intent.html', publicDir), 'utf8'),
]);

if (!html.includes('lang="zh-CN"') || !html.includes('/glyph-engine-v3.js') || !html.includes('/glyph-game-v3.js')) {
  throw new Error('v3 游戏入口缺失或脚本引用不完整。');
}
if (!engine.includes('GlyphEngineV3') || !engine.includes("aha('A28'")) {
  throw new Error('Acts Engine v3 内部事件系统缺失。');
}
if (!controller.includes('E.SAVE_KEY') || !controller.includes('renderDisclosure')) {
  throw new Error('v3 UI / progressive disclosure controller 缺失。');
}
if (!privacy.includes('Aha IDs, reveal copy') || !privacy.includes('scrubLog')) {
  throw new Error('玩家隐私层缺失：内部设计语言可能泄漏到玩家界面。');
}
if (!preview.includes('glyph-factory-v3-preview.webm') || !preview.includes('A28')) {
  throw new Error('设计评审源文件缺失。');
}
if (!intent.includes('hidden → discovered → persistent') && !intent.includes('出现 → 永久保留')) {
  throw new Error('intent.html 设计契约缺失。');
}

// Production/player HTML contains no navigation to review materials. Internal review artifacts
// remain in the repository for designers/developers but are deliberately not copied to dist/.
// The global hidden rule prevents display:grid/flex from resurrecting undiscovered panels.
const audienceBoot = `<script>document.documentElement.dataset.audience='player'</script>\n<style>[hidden]{display:none!important}html[data-audience="player"] .eyebrow,html[data-audience="player"] #director,html[data-audience="player"] #director-toggle,html[data-audience="player"] .act-strip,html[data-audience="player"] .act-kicker,html[data-audience="player"] .act-title,html[data-audience="player"] .act-copy,html[data-audience="player"] .aha-focus,html[data-audience="player"] .aha-list,html[data-audience="player"] .panel-head:has(#aha-count),html[data-audience="player"] #systems-note{display:none!important}</style>`;
let playerHtml = html
  .replace('<title>字工厂 · Acts Engine v3</title>', '<title>字工厂</title>')
  .replace('<meta name="description" content="字工厂 Acts Engine v3：从一个字，到会自己演化的语言系统。">', '<meta name="description" content="字工厂：从一个字开始。">')
  .replace('</head>', `${audienceBoot}\n</head>`)
  .replace('<a href="/preview.html">预览 / Preview</a>', '')
  .replace('<button id="director-toggle" type="button">导演模式</button>', '<button id="director-toggle" type="button" hidden aria-hidden="true"></button>')
  .replace('DIRECTOR MODE / AHA', 'REVIEW MODE')
  .replace(/<section class="aha-focus" aria-live="polite">[\s\S]*?<\/section>/, '<section class="aha-focus" hidden aria-hidden="true"><small id="aha-id"></small><h2 id="aha-title"></h2><p id="aha-copy"></p></section>')
  .replace('<div class="panel-head" style="margin-top:16px"><h2>AHA MOMENTS · 28</h2><span id="aha-count">0 / 28</span></div>', '<div class="panel-head" style="margin-top:16px" hidden aria-hidden="true"><h2></h2><span id="aha-count"></span></div>')
  .replace('<div class="aha-list" id="aha-list" aria-label="Aha moments"></div>', '<div class="aha-list" id="aha-list" hidden aria-hidden="true"></div>')
;

// Strip designer reveal copy from the deployed JS payload as a second line of defense.
const playerEngine = engine.replace(
  /aha\('([^']+)',(\d+),'[^']*','[^']*'(,'[^']*')?\)/g,
  (_match, id, act, kind = '') => `aha('${id}',${act},'',''${kind})`,
);
// The strip above is a regex over `aha(...)`, so a designer copy string added anywhere else in
// that call would survive into the player bundle. The world lines are meant to survive — they
// are the only reason an Aha is perceptible — but the design copy must not. Assert both halves
// against the actual stripped payload instead of trusting the pattern.
const designCopy = [...engine.matchAll(/aha\('[^']+',\d+,'([^']*)','([^']*)'/g)];
if (designCopy.length !== 28) throw new Error(`预期 28 条 Aha 设计文案，实际 ${designCopy.length} 条。`);
for (const [, title] of designCopy) {
  if (title && playerEngine.includes(`'${title}'`)) throw new Error(`Aha 设计标题泄漏进玩家包：${title}`);
}
const worldCopy = [...engine.matchAll(/^ {4}A\d{2}: '([^']+)',$/gm)].map((match) => match[1]);
if (worldCopy.length !== 28) throw new Error(`预期 28 条玩家向世界线，实际 ${worldCopy.length} 条。`);
for (const line of worldCopy) {
  if (!playerEngine.includes(line)) throw new Error(`玩家向世界线在构建中被剥离：${line}`);
  if (/A\d{2}|AHA|ACT/i.test(line)) throw new Error(`玩家向世界线含内部术语：${line}`);
}

const playerController = controller
  .replace(
    /  const AHA_EN = \{[\s\S]*?\n  \};\n  const ACTIONS =/,
    '  const AHA_EN = {};\n  const ACTIONS =',
  )
  .replace(
    "localStorage.getItem(LOCALE_KEY) || (navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en')",
    "localStorage.getItem(LOCALE_KEY) || 'zh-CN'",
  );

// Reused local/CI output must not retain files from an older review build.
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await writeFile(new URL('index.html', out), playerHtml);
await writeFile(new URL('play.html', out), playerHtml);
await writeFile(new URL('glyph-engine-v3.js', out), playerEngine);
await writeFile(new URL('glyph-game-v3.js', out), playerController);
await copyFile(new URL('player-privacy-v3.js', publicDir), new URL('player-privacy-v3.js', out));
await copyFile(new URL('404.html', publicDir), new URL('404.html', out));
await copyFile(new URL('500.html', publicDir), new URL('500.html', out));

const digest = (text) => createHash('sha256').update(text).digest('hex');
const manifest = {
  game: '字工厂 / Glyph Factory',
  version: 3,
  entry: 'play.html',
  progressiveDisclosure: true,
  playerSpoilers: false,
  internalReviewArtifactsDeployed: false,
  sha256: digest(playerHtml + playerEngine + playerController + privacy),
  bytes: Buffer.byteLength(playerHtml) + Buffer.byteLength(playerEngine) + Buffer.byteLength(playerController) + Buffer.byteLength(privacy),
};
await writeFile(new URL('build.json', out), JSON.stringify(manifest, null, 2) + '\n');
console.log(`静态构建完成：Glyph Factory v${manifest.version} · player-safe reveal UI · ${manifest.bytes} text bytes`);
