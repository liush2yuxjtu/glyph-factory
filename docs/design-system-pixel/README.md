# 字工厂 像素 — design system sources

Pixel-art refactor of the v3 paper-and-ink system. Published as a Design System artifact:
https://claude.ai/artifact/1puffr31ceVXF6NRmSsWCW

- `project/` — the artifact's files exactly as published (tokens, README brand book, references, components, bundle, font, icons).
- `src/` — how they were produced: `gen_tokens.py` writes `tokens.json`; `bundle.src.js` + `data.json` (trimmed from `scripts/flows/screens.json` and `flows.json`) are built into `project/components/bundle.js` by `build.py`; `contrast.py` checks every text pair ≥4.5:1 in both themes.

Not wired into `public/play.html` yet — the game still ships the v3 styles.
