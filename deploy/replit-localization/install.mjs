import { readFile, writeFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

// Install the tested adapter without changing game logic, dependencies, or saves.
const root = resolve(process.argv[2] || '.');
const candidates = ['client/index.html', 'index.html'];
const found = [];
for (const candidate of candidates) {
  const path = resolve(root, candidate);
  try { await access(path); found.push(path); } catch {}
}
if (found.length !== 1) {
  throw new Error(`Expected one Vite HTML entry, found ${found.length}. Inspect the app before installing.`);
}
const entry = found[0];
let html = await readFile(entry, 'utf8');
if (!/<head\b[^>]*>/i.test(html) || !/<\/head\s*>/i.test(html)) throw new Error('HTML head not found.');
if (/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["']/i.test(html)) {
  throw new Error('A CSP meta tag is present. Review script policy before installing an inline adapter.');
}
const marker = '<!-- glyph-localization:start -->';
const end = '<!-- glyph-localization:end -->';
const hasStart = html.includes(marker), hasEnd = html.includes(end);
if (hasStart !== hasEnd) throw new Error('Incomplete previous localization marker. Inspect entry before continuing.');
const script = (await readFile(new URL('./glyph-language.js', import.meta.url), 'utf8')).replace(/<\/script/gi, '<\\/script');
const block = `${marker}\n<script data-glyph-localization="local-i18n-20260915.1">\n${script}\n</script>\n${end}`;
if (hasStart) {
  const start = html.indexOf(marker), stop = html.indexOf(end, start);
  if (stop < start) throw new Error('Invalid localization marker ordering.');
  html = html.slice(0, start) + block + html.slice(stop + end.length);
} else {
  html = html.replace(/<\/head\s*>/i, `${block}\n</head>`);
}
await writeFile(entry, html);
console.log('Installed locally tested localization; game logic and saves are unchanged.');
