// The pixel fonts are subset to the characters the player can see and inlined into play.html
// (the player bundle is an eight-file allowlist, so they cannot ship as files). A subset rots the
// moment someone adds copy with a new character: that glyph silently falls back to a system font
// in the middle of a pixel sentence. So, as with the flow tables, assert against a recomputation
// of the sources, not against the existence of the block.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const BEGIN = '/* pixel-fonts:begin', END = '/* pixel-fonts:end */';
const RERUN = 'run python3 scripts/pixel-font/subset.py';

const html = read('public/play.html');
const charset = Object.fromEntries(read('scripts/pixel-font/charset.txt').split('\n').filter(Boolean)
  .map((line) => [line.slice(0, line.indexOf(' ')), line.slice(line.indexOf(' ') + 1)]));

test('play.html carries exactly the font block the subsetter last wrote', () => {
  assert.ok(html.includes(BEGIN) && html.includes(END), `pixel font block missing: ${RERUN}`);
  const block = html.slice(html.indexOf(BEGIN), html.indexOf(END) + END.length);
  assert.equal(createHash('sha256').update(block).digest('hex'), charset['block-sha256'], `font block edited by hand or stale: ${RERUN}`);
  assert.match(block, /font-family:"Glyph Pixel";src:url\(data:font\/woff2;base64,/);
  assert.match(block, /font-family:"Silkscreen";src:url\(data:font\/woff2;base64,/);
});

test('every character in the player sources was accounted for when the subset was cut', () => {
  const page = html.slice(0, html.indexOf(BEGIN)) + html.slice(html.indexOf(END) + END.length);
  const text = page + ['public/glyph-engine-v3.js', 'public/glyph-game-v3.js', 'public/player-privacy-v3.js'].map(read).join('');
  const known = new Set([...charset.covered, ...charset.fallback]);
  const missing = [...new Set(text)].filter((c) => c.codePointAt(0) > 0x7e && !/\s/u.test(c) && !known.has(c));
  assert.deepEqual(missing, [], `new characters not in the pixel subset: ${RERUN}`);
});
