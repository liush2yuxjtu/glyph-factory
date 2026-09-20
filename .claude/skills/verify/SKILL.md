---
name: verify
description: Verify Glyph Factory changes by running its real browser surfaces and the repository's verification harness, then capturing exact-candidate visual and interaction evidence.
---

# Verify Glyph Factory

Upstream behavior reference:
`https://raw.githubusercontent.com/asgeirtj/system_prompts_leaks/main/Anthropic/claude-code/skills/verify/SKILL.md`

## Candidate

Verify the exact commit/PR candidate. For deployed behavior, use the exact Preview/Pages URL for that SHA.

## Launch

From repo root:

```bash
npm run dev
```

Default Next.js readiness is the local URL printed by the dev server.

The repository also provides:

```bash
npm run verify:fast
npm run verify
```

`npm run verify` runs the Node contract suite, static build, and browser unittest layer. Treat those as supporting harness evidence; still drive the user-facing surface for UI changes.

## Drive

Use the committed driver rather than hand-rolling Playwright —
`.claude/skills/run-glyph-factory/driver.py` (`smoke`, `shot <surface>`, `play`,
`publish`, `review`, `aha`, `demo`). It starts and stops the dev server itself, writes
screenshots plus `report.json` to `--out`, and exits non-zero on a failed check. See
`.claude/skills/run-glyph-factory/SKILL.md` for the full contract and the gotchas that
make raw locator clicks fail here (the 500ms `replaceChildren` re-render, the runtime
privacy strip on `/`, the auto-sell deadlock on the publish button).

Use Playwright/Chromium directly (and WebKit when cross-engine behavior is relevant) only
for something the driver does not cover.

Important user surfaces:
- `/`
- `/aha-lab`
- `/product-demo`
- any changed developer/asset surface present in the candidate

For Aha Lab or asset changes:
1. navigate to the exact route;
2. trigger the changed asset/screen interaction;
3. confirm the expected visual/state transition;
4. capture the resulting screen and any relevant browser errors.

When the question is specifically whether A01–A28 still hold, use
`.claude/skills/verify-aha/SKILL.md` instead. It owns the 28-case invariant/transition
suite (`scripts/run-browser-contracts.py aha`, both engines), the anti-false-green tests
that must be green in the same run, and the explicit list of what a 28/28 does not prove.
The driver's `aha` command is a tool-assisted pass only — pair it with that suite.

For product-demo changes, interact with the demo rather than accepting an idle screenshot.

### Dev-surface privacy contract

`public/` is the one player surface the `dist/` suites cannot cover: `build-static.mjs`
bakes `data-audience="player"` plus `!important` hide rules into the built artifact, so a
boundary defect that exists only in source is invisible to `test_player.py`. The controller
re-renders every 500ms, so "hidden at load" is never proof — the original defect here was a
one-shot strip that the next timer render undid, putting the Aha list and the
`AHA MOMENTS · 28` heading back in front of a player on `/`.

```bash
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player
GLYPH_BROWSER=webkit   python3 scripts/run-browser-contracts.py player
```

`tests/browser/test_player_source_privacy.py` serves `public/` directly, drives the real
first Aha, and asserts the boundary holds across timer renders and a reload. It carries its
own negative control (restore the pre-fix code, require the leak to reappear) and an
insurance test (remove the engine gate, require the runtime strip to hold anyway), so a
green run proves the assertions can fail rather than that they are vacuous.

If you touch `player-privacy-v3.js`, `glyph-game-v3.js`, or `play.html`, this suite is the
gate. `npm run verify` and the `dist/` suite will not catch you.

## Evidence

Write candidate-specific screenshots and browser observations under:

`/tmp/glyph-factory-verify/<sha-or-pr>/`

Record route, viewport/browser, action, and resulting state. Build/test success alone is not a UI PASS.

## Probe

Exercise one adjacent state: alternate asset, repeated interaction, resize/mobile viewport, missing/invalid input, or another browser engine when the diff suggests it.

## Cleanup

Stop the dev server/browser sessions started by verification. Preserve evidence.

## Maintain this verifier

Update only when actual launch commands, routes, browser harness, or proof requirements change.
