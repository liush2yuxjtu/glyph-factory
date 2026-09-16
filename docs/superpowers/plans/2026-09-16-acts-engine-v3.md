# Glyph Factory Acts Engine v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Chapter 1 dead-end with a six-act, 28-Aha progression, plus Director Mode, a deployed preview page, and an inline preview video.

**Architecture:** Move deterministic gameplay into `public/glyph-engine-v3.js`; keep `public/play.html` as markup/style and `public/glyph-game-v3.js` as the DOM/save controller. Tests load the shipped engine source directly. A separate `public/preview.html` reviews the feature and embeds `public/glyph-factory-v3-preview.webm`.

**Tech Stack:** Next.js 16 static public assets, vanilla JavaScript engine/UI, Node test runner, localStorage, WebM video, Vercel Git preview deployment.

**Spec:** `docs/superpowers/specs/2026-09-16-acts-engine-v3-design.md`

## Global Constraints
- All 28 Aha IDs `A01` through `A28` must be individually represented and previewable.
- Core mechanical Ahas: A01, A03, A06, A10, A13, A16, A18, A22, A24, A27, A28.
- Old saves must migrate without losing first-act resources; a finished v2 save enters ACT II.
- Normal game and Director Mode must not corrupt each other.
- Mobile-first, keyboard-accessible, reduced-motion aware.
- `/`, `/play.html`, `/preview.html`, and preview video must work on Vercel Preview.

---

### Task 1: Engine contract and failing tests

**Files:**
- Modify: `tests/game.test.mjs`
- Create later: `public/glyph-engine-v3.js`

**Interfaces:**
- Produces test expectations for global `GlyphEngineV3` with `fresh`, `restore`, `advance`, `act`, `rate`, `actIndex`, `ahaUnlocked`, `directorState`, `AHAS`.

- [ ] Add tests that load `public/glyph-engine-v3.js`, assert exactly 28 ordered Aha IDs, assert a finished v2 save migrates to ACT II, assert publishing transitions into ACT II, and assert `directorState('A22')` is deterministic.
- [ ] Run `node --test tests/game.test.mjs` and verify failure because `glyph-engine-v3.js` does not exist.
- [ ] Commit the failing tests.

### Task 2: Minimal Engine v3 progression

**Files:**
- Create: `public/glyph-engine-v3.js`
- Modify: `tests/game.test.mjs`

**Interfaces:**
- `GlyphEngineV3.fresh(now)` returns v3 state.
- `restore(raw, now)` migrates v1/v2/v3 saves.
- `act(state, command, now)` returns next deterministic state.
- `advance(state, now)` applies production/offline progression and automatic systems.
- `directorState(ahaId, now)` returns a representative state for preview.

- [ ] Implement constants for units, contracts, six acts, and all A01–A28 metadata.
- [ ] Implement defensive state sanitization and v2 migration.
- [ ] Implement Act I parity and publish→ACT II transition.
- [ ] Implement representative mechanics for composition, readership/demand, meaning scarcity, concept/city effects, agents, machine glyphs, compression, noise deletion, and final stop action.
- [ ] Run tests and make the Task 1 tests pass.
- [ ] Add focused tests for each core mechanical Aha and production halt after A28.
- [ ] Run full Node tests green.
- [ ] Commit engine + green tests.

### Task 3: Replace presentation shell

**Files:**
- Replace: `public/play.html`
- Create: `public/glyph-game-v3.js`

**Interfaces:**
- Consumes `window.GlyphEngineV3`.
- DOM IDs: `glyphs`, `credits`, `rate`, `act-title`, `aha-title`, `aha-copy`, `primary-actions`, `world-metrics`, `aha-list`, `log`, `director-select`, `director-apply`.

- [ ] Build responsive six-act layout with the current newspaper/pixel workshop visual language.
- [ ] Render the current act, active Aha, economy metrics, world metrics, and context-specific actions.
- [ ] Keep print/sell/buy/contracts in Act I; reveal composition/readership/meaning/city/agents/machine-language/noise actions by act.
- [ ] Add Director Mode via query `?director=1` and Aha selector using `directorState` without overwriting normal save until “apply” is pressed.
- [ ] Add save/export/reset, keyboard shortcuts, aria-live status, focus styles, reduced motion.
- [ ] Add a smoke assertion in tests that play.html loads both v3 scripts and exposes Director Mode controls.
- [ ] Run tests green and commit.

### Task 4: Preview page and trailer video

**Files:**
- Create: `public/preview.html`
- Create: `public/glyph-factory-v3-preview.webm`

**Interfaces:**
- Preview page links `/`, `/?director=1`, and uses `<video controls src="/glyph-factory-v3-preview.webm">`.

- [ ] Generate a short 16:9 WebM trailer with six act title cards, key state transitions, and final “停止印刷 / 世界已经写完了”.
- [ ] Create preview.html with the real video element, six-act summary, all 28 Aha IDs, and play/director links.
- [ ] Add tests that preview.html references the video and all 28 Aha IDs.
- [ ] Run tests green and commit.

### Task 5: App shell compatibility and build verification

**Files:**
- Modify only if needed: `src/app/GameShell.tsx`, `public/game-accessibility-i18n.js`, `public/simple-interaction.js`

**Interfaces:**
- Root Next app continues iframe-loading `/play.html`.

- [ ] Verify enhancement scripts do not break v3 DOM; make them safely no-op for absent legacy controls.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `node --test tests/game.test.mjs`.
- [ ] Fix only regressions caused by this PR and rerun all three commands.
- [ ] Commit compatibility fixes.

### Task 6: PR and Vercel Preview verification

**Files:** none unless verification finds a bug.

**Interfaces:** GitHub PR + Vercel Git integration.

- [ ] Open a PR from `feat/acts-engine-v3-preview` to `main` summarizing the six acts, migration, Director Mode, tests, and preview page.
- [ ] Wait for/find the Vercel Preview deployment associated with the branch/PR; require state `READY`.
- [ ] Verify preview deployment has no runtime error clusters.
- [ ] Fetch `/`, `/play.html`, `/preview.html`, and `/glyph-factory-v3-preview.webm`; require success and correct references/content types where observable.
- [ ] If verification fails, patch the branch and repeat deployment verification.
- [ ] Add a PR comment with the verified preview URLs and test/build status.