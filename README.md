# GLYPH//FACTORY · 字工厂

A mobile-first, text-driven incremental web game with 2D pixel-style presentation. You start by printing glyphs by hand at a desk; six acts later, language has become infrastructure and the winning move is to stop printing.

The design goal is one repeated realisation: *"原来这个游戏不是我刚才以为的那个游戏。"* — each act changes what growth means, not just how fast it goes.

## The six acts

28 Aha moments (A01–A28) carry the player through six acts. Full design: [`docs/superpowers/specs/2026-09-16-acts-engine-v3-design.md`](docs/superpowers/specs/2026-09-16-acts-engine-v3-design.md).

| Act | Theme | What changes |
|---|---|---|
| I | 手工与自动化 | Print, sell, buy keyboards / typists / presses, publish 《明日》 |
| II | 字开始生长 | Composition rules (`木 + 木 → 林`), readership demand, meaning-per-glyph |
| III | 文字改变城市 | District dialects, concepts alter city state |
| IV | 机器开始写 | Reporter/editor agents, agents that create agents, digital publishing |
| V | 机器语言 | Machine-created glyphs, semantic compression |
| VI | 从增长到沉默 | Noise rises, optimisation flips to deletion, final action: 停止印刷 |

A passive playthrough (doing only what the screen says) takes a little over two hours.

## How it is built

The game is plain browser JavaScript in `public/`; Next.js is only a thin shell.

| Path | Role |
|---|---|
| `public/glyph-engine-v3.js` | `GlyphEngineV3`: deterministic state machine, no DOM. Rules, costs, Aha triggers. |
| `public/glyph-game-v3.js` | UI controller: rendering, progressive disclosure, zh-CN / en locale, `localStorage` save/export/reset |
| `public/player-privacy-v3.js` | Strips design language (Aha IDs, reveal copy) from the player surface |
| `public/play.html` | The game page |
| `src/app/` | Next.js App Router: `/` iframes `play.html`; `/aha-lab` and `/product-demo` are dev surfaces |
| `public/design-system/` | Design tokens, components, screen flows |

**Deployment does not use `next build`.** `vercel.json` sets `framework: null`; the build runs `npm test` and then `scripts/build-deployment.mjs`, which writes a static `dist/` containing only the player allowlist. Internal review pages (`aha.html`, etc.) are added only when `VERCEL_ENV=preview`.

### Error tracking (PostHog)

Opt-in at build time. When `POSTHOG_PROJECT_TOKEN` (a `phc_…` project key) is set, `scripts/build-static.mjs` inlines PostHog's CDN loader into `dist/index.html` and `dist/play.html`; without it the bundle contains no telemetry at all (`build.json` → `"telemetry": "none"`). `POSTHOG_HOST` defaults to `https://us.i.posthog.com` (use `https://eu.i.posthog.com` for the EU cloud). What is sent: uncaught errors and unhandled rejections (including ones thrown during boot, before the loader arrives) as `$exception`, plus `$pageview`. What is not: no autocapture, no session recording, and in-memory persistence, so nothing is stored next to the save. On Vercel set both variables for the Production environment; they take effect on the next explicit deploy. The Next.js app in `src/` is not deployed, so it carries no tracker.

## The two source-of-truth documents

- [`intent.md`](intent.md) — **what** the user wants, quoted verbatim, each with how it is measured and its current status.
- [`aha.md`](aha.md) — **how** it is implemented: the disclosure contract `hidden → discovered → persistent → intentionally replaced`, and the rule that every Aha announces itself in the world's own words.

Add product requirements to `intent.md`; change implementation contracts in `aha.md`.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

Open `/` to play. `play.html?review=1` shows the full act/Aha surface. Saves live in `localStorage` only. The only env vars are the optional PostHog pair above, read at build time.

## Test and verify

```bash
npm test                  # Node contract suite (engine, privacy boundary, production build)
node scripts/pacing.mjs   # rhythm between Aha moments, total play time
```

There is no CI. Every gate — including the chromium/webkit browser suites in `tests/browser/` and `tests/intent-browser/` — runs locally through the `/verify` skill (`.claude/skills/verify/`). A PR is opened only after `/verify` passes. See [`AGENTS.md`](AGENTS.md) for the rules, including the Vercel deploy budget: Git auto-deploy is off (`git.deploymentEnabled: false`), so production only changes through an explicit, billed deploy.
