---
name: run-glyph-factory
description: Build, run, and drive Glyph Factory (Next.js shell + static pixel-art incremental game). Use when asked to start glyph-factory, run the game, screenshot it, drive the player loop, reach ACT II, run the Aha Lab's 28-trigger audit, or interact with the running app.
---

Glyph Factory is a mobile-first incremental game. The Next.js app under `src/app/` is
only a shell: `/` and `/aha-lab` are ~15-line React components whose entire job is an
`<iframe>` pointing at `public/play.html` and `public/aha.html`. **The game itself is
static files under `public/`** — `glyph-engine-v3.js` is the state machine,
`glyph-game-v3.js` is the renderer. Only `/product-demo` is a real React page.

Drive it with `.claude/skills/run-glyph-factory/driver.py` (Playwright/Chromium).
All paths below are relative to the repo root.

## Prerequisites

No `apt-get` line — this runs as-is on macOS. Verified on this machine:

- Node v24.19.0, npm 11.16.0
- python3 3.12.13 with playwright 1.62.0 and a populated browser cache

```bash
python3 -c "import playwright, importlib.metadata as m; print('playwright', m.version('playwright'))"
```

The repo's own browser tests pin a *different* version — `tests/browser/requirements.txt`
says `playwright==1.57.0`. The driver only uses the sync API, so either works.

## Setup

```bash
npm install
```

That is the whole setup. No env vars, no feature gates to patch, no build step for the
dev loop — the game persists only to `localStorage`.

## Run (agent path)

The driver starts `npm run dev` itself when nothing answers on the port, waits for
readiness, and tears the server down (whole process group) on exit. If a server is
already up it reuses it and leaves it running.

```bash
python3 .claude/skills/run-glyph-factory/driver.py smoke
```

| command | what it does | wall time (warm) |
|---|---|---|
| `smoke` | loads all four surfaces; 10 assertions covering the privacy strip, the 28 director states, the 28 lab triggers, the demo shell | 3.1s |
| `shot <player\|review\|aha-lab\|demo>` | one screenshot of one surface | ~3s |
| `play [--seconds N]` | prints, sells, buys automation for N seconds (default 45), samples state every 20s | N + ~15s |
| `publish [--budget S]` | plays a cold save through the ACT I → ACT II gate, then fires the compose verb (default budget 420s) | ~345s |
| `review` | 28 director states; jumps to A28 and a mid state; applies one and reloads to prove it persisted | 6.1s |
| `aha` | opens the Aha Lab, fires one trigger, then clicks its own `验证全部 28 个 Aha` | 13.7s |
| `demo` | the three-phase product demo end to end, including the running mold | 7.8s |

"Warm" means a dev server was already answering. Each command boots `npm run dev` itself
otherwise; that adds a few seconds (the server itself reports ready in ~215ms, but the
first request pays Turbopack's compile).

Flags: `--base http://localhost:3000` (point at a server you started), `--out DIR`
(default `/tmp/glyph-factory-run/<command>-<timestamp>/`), `--width`/`--height`,
`--headed` (watch it play).

Every step prints one JSON line to stdout, prefixed `PASS` or `FAIL` when it is an
assertion. Screenshots, `report.json`, and `dev-server.log` land in `--out`. The exit
code is non-zero if any check failed, so it is safe to gate on.

## Run (human path)

```bash
npm run dev    # -> http://localhost:3000, Ctrl-C to stop
```

Open `/` to play. Add `?review=1` to `play.html` for the full act/aha surface.

## Test

```bash
npm test        # node --test tests/*.test.mjs
```

87 tests, 87 pass, 0 fail, ~0.4s. This is the Node contract suite: it covers the engine,
the privacy boundary, and a byte-identical production build.

The heavier harnesses in `scripts/verify-player.mjs`, `scripts/run-browser-contracts.py`,
`tests/browser/`, and `tests/intent-browser/` are not exercised here — they drive a
`dist/` build rather than the dev server. `.claude/skills/verify/SKILL.md` owns those.

## Gotchas

- **The player build is privacy-stripped at runtime, on localhost too.**
  `public/player-privacy-v3.js` deletes the preview link and hides `#director-toggle`,
  `#director`, `.aha-focus`, `#aha-list`, `#aha-count`, `#act-strip`, `.act-kicker`,
  `.act-title`, `.act-copy`, `.eyebrow`, `#systems-note`; it also scrubs `ACT n/6` out of
  `#status` and `A01 ·` lines out of `#log`, rewrites the title, and forces zh-CN. So `/`
  on a fresh save shows one metric and one button. That is correct, not a broken render.
  **The escape hatch is `localhost` + `?review=1` or `?director=1` on `play.html`** — the
  guard returns early only then. Without it you cannot see acts, ahas, or Director Mode.

  The strip is not one-shot: it re-asserts on every controller render, and the reveal rule
  in `glyph-game-v3.js` is audience-gated (`isPlayerAudience()`), so `/` must stay
  spoiler-free **after** the first Aha lands too — that is where it used to leak the Aha
  list and the `AHA MOMENTS · 28` heading back onto the player surface. If you ever see an
  `A01 · …` card or an AHA heading on `/`, that is a regression, not a render bug.
  `tests/browser/test_player_source_privacy.py` owns it (`run-browser-contracts.py player`).

- **`#primary-actions` is destroyed and rebuilt every 500ms.** The controller calls
  `replaceChildren(...)` on each tick, so a Playwright locator can resolve a node and
  then click a detached one — you get `element was detached from the DOM` /
  `<html> intercepts pointer events` followed by a 30s timeout. Dispatch the click
  inside the page against a freshly queried node instead (that is what `CLICK` in the
  driver does). Locator clicks are fine on `/product-demo`; it is React and stable.

- **Auto-sell floors stock below 1 every tick, so no stock-cost action is reachable while
  it is on.** `advance()` does `sold = Math.floor(g.glyphs)`, which strands `canPublish`
  (`glyphs>=200`) in ACT I and `compose-rule` (`glyphs>=2`) / `condense` (`glyphs>=20`) in
  ACT II. Measured by `driver.py publish`: 332s of real play satisfied the other four
  conditions at 5.0K lifetime / 301.5 credits / 1 press / 0.3 stock — turning auto-sell off
  took stock to 203.3 in 10s. This used to be silent (`publish`'s reveal *was* `canPublish`,
  so the button simply never appeared). Since 2026-09-20 the renderer separates reveal from
  enable: reveal uses only latched/monotonic facts, and an unaffordable action renders
  **disabled with its shortfall** — plus `· 自动出售正在清空库存` when auto-sell is the cause.
  `toggle-auto` now renders in **every** act, not just ACT I. If a run stalls anyway, read
  `autoSellSub` and diff `#primary-actions` against the state before blaming the driver.

- **ACT II's gate is `readers`, and the world card that shows it is hidden until ACT III.**
  Readership drives A06 (100), A07's reader letter (250), A10's paper crisis (1000) and the
  `paperCrisis` half of the city map — and `renderWorld()`'s ACT II panel, which holds
  `READERS / DEMAND / COMPOSED / DELETED`, is gated by `renderDisclosure()` at `s.act < 3`.
  A player could therefore sit in ACT II with no way to see the number the act turns on.
  Since 2026-09-20 readership is a metric on the player surface from publication onward, and
  `刻模` reports `已刻 N 条 · 读者 +X/秒` once its rule is running instead of repeating
  discovery copy forever. `#world-card` itself stays hidden until ACT III — two tests pin
  that, so do not "fix" a stalled ACT II by unhiding it. Diagnostic script for the reported
  dead state and its 14-assertion road to ACT III: see `.claude/skills/verify/SKILL.md` →
  "progression contract".

- **`advance()`'s ACT II rule runs on its own clock, so never compare a stepped run to a
  jumped one by eye.** `ruleCredit` carries the sub-4-second remainder across ticks; a
  change that drops it makes a running rule produce nothing during live play while still
  passing any test that jumps time in one call. `tests/game-v3.test.mjs` asserts the
  identity — 40 × 500 ms ticks must equal one 20 s jump.

- **The player never sees an Aha's title or reveal, so the `A## ·` log line is not
  player-facing.** `player-privacy-v3.js` strips every `A## ·` line out of `#log`, which
  means an Aha's only *engine* trace is invisible by design. What the player reads is
  `AHA_WORLD[id]` — a separate world-language sentence `syncAhas()` prepends right after
  the design line, with no ID and no act number. If you add or rename an Aha, add its world
  line too; if you fold world copy into the `aha(...)` call, `build-static.mjs`'s strip
  regex will silently remove it from the player bundle (the build now fails closed on this).
  `driver.py aha` opens the **review** surface, where the design copy is visible — do not
  read that page as evidence of what a player sees.

- **Don't assert on the 28 aha *cards*; assert on the 28 director *options*.** A fresh
  save starts with one act chip and `0 / 28` aha items — progressive disclosure, not a
  bug. The `<select>` carries all 28 from the start, and previewing A28 flips the list
  to 28 seen.

- **The review surface follows `navigator.language`; the player build does not.** Only the
  privacy layer writes `zh-CN` into `localStorage`, and it never runs under `?review=1`. So
  a *fresh* context renders `?review=1` in English ("Hands → Automation") because headless
  Chromium reports `en-US`, while `/` renders Chinese. A context that visited `/` first
  carries the saved locale over and stays Chinese. Assert on ids and `data-command`, never
  on copy.

- **`#total` and friends are printed with K/M/B suffixes** (`31.5K`). `float()` on the
  text raises `ValueError: could not convert string to float: '1.0K'` — parse the suffix.

- **`npm run dev` prints a Turbopack warning about a `package-lock.json` outside the repo**
  (`/Users/<you>/package-lock.json`). It is noise; the server boots in ~215ms regardless.

- **macOS has no GNU `timeout`.** `timeout 120 python3 ...` fails with
  `command not found: timeout`. Pass `--budget`/`--seconds` to the driver instead.

## Troubleshooting

- **`Locator.click: Timeout 30000ms exceeded` / `element was detached from the DOM`** —
  you clicked a node the 500ms re-render replaced. Move the click in-page (see Gotchas).
- **`ValueError: could not convert string to float: '1.0K'`** — the HUD formats large
  numbers with a suffix. Parse `K`/`M`/`B` before comparing.
- **`play.html` frame never appeared** — the `/` shell had not mounted its iframe yet, or
  the dev server was still compiling on a cold start. The driver retries for 15s; a cold
  `npm install` followed by the very first `npm run dev` can exceed that once.
- **`npm install` needed** — a fresh clone has no `node_modules`; the driver's server
  start will fail before the port opens.

## Maintaining this skill

Re-run every command in the table above before changing this file. The overlap with
`.claude/skills/verify/` is deliberate: that skill owns candidate/PR verification and
evidence layout, this one owns launching and driving.
