import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/preview.html', import.meta.url), 'utf8');

test('preview page embeds the deployed WebM and all 28 Aha IDs', () => {
  assert.match(html, /<video[^>]+controls/);
  assert.match(html, /glyph-factory-v3-preview\.webm/);
  for (let i = 1; i <= 28; i++) assert.match(html, new RegExp(`A${String(i).padStart(2,'0')}`));
  assert.match(html, /\?director=1/);
});

test('preview video is a non-empty WebM/EBML asset', () => {
  const bytes = readFileSync(new URL('../public/glyph-factory-v3-preview.webm', import.meta.url));
  assert.ok(bytes.length > 8_000);
  assert.equal(bytes.subarray(0, 4).toString('hex'), '1a45dfa3');
});

// Reading the EBML header directly replaces the ffprobe step the GitHub workflow used to run:
// macOS ships no ffprobe, so the same check could only execute on CI. Pure Node keeps it
// executable on the machine the developer is actually on.
function readVint(bytes, at, keepMarker = false) {
  const first = bytes[at];
  if (first === undefined || first === 0) return null;
  let length = 1;
  for (let mask = 0x80; !(first & mask); mask >>= 1) length += 1;
  if (length > 8 || at + length > bytes.length) return null;
  let value = keepMarker ? first : first & (0xff >> length);
  for (let i = 1; i < length; i += 1) value = value * 256 + bytes[at + i];
  return { value, length, unknown: !keepMarker && value === 2 ** (7 * length) - 1 };
}

// TimecodeScale (ns per tick, 1 ms unless declared) and Duration (in ticks) live under
// Segment > Info. Unknown-size masters are legal EBML and are read to their parent's end.
function readWebmDurationSeconds(bytes) {
  let timecodeScale = 1e6;
  let duration = null;
  const walk = (start, end) => {
    let at = start;
    while (at < end) {
      const id = readVint(bytes, at, true);
      if (!id) return;
      const size = readVint(bytes, at + id.length);
      if (!size) return;
      const bodyStart = at + id.length + size.length;
      const bodyEnd = size.unknown ? end : Math.min(bodyStart + size.value, end);
      if (id.value === 0x18538067 || id.value === 0x1549a966) walk(bodyStart, bodyEnd);
      else if (id.value === 0x2ad7b1 && bodyEnd - bodyStart <= 6) timecodeScale = bytes.readUIntBE(bodyStart, bodyEnd - bodyStart);
      else if (id.value === 0x4489 && bodyEnd - bodyStart === 8) duration = bytes.readDoubleBE(bodyStart);
      else if (id.value === 0x4489 && bodyEnd - bodyStart === 4) duration = bytes.readFloatBE(bodyStart);
      at = bodyEnd;
    }
  };
  walk(0, bytes.length);
  return duration === null ? null : (duration * timecodeScale) / 1e9;
}

test('preview video really plays, not just parses: EBML duration clears 20s', () => {
  const bytes = readFileSync(new URL('../public/glyph-factory-v3-preview.webm', import.meta.url));
  const seconds = readWebmDurationSeconds(bytes);
  assert.ok(Number.isFinite(seconds), 'expected a Duration element under Segment > Info');
  assert.ok(seconds >= 20, `preview video runs ${seconds}s, under this repo's 20s floor`);
});
