---
name: verify-aha
description: Verify Glyph Factory's 28 Aha moments against the exact candidate SHA — build review-dist, run the real-browser invariant/transition suite on chromium and webkit, drive the in-app 28/28 audit, and report what the result does and does not prove. Use when asked to verify the aha moments, prove an Aha change is safe, or check the 28/28 claim.
---

# Verify the 28 Aha moments

`.claude/skills/verify/` owns candidate binding, evidence layout, and the general
"drive the real surface" contract. `.claude/skills/run-glyph-factory/` owns launching and
driving the dev server. **This skill owns one question only: does each of A01–A28 actually
hold, against this exact SHA?**

All paths are relative to the repo root.

## What "verifying one Aha" means here

An Aha is not a string in a list. Each one is a *reachable state* plus the *real action*
that leaves it. Verification therefore asserts three separate things per ID:

1. **Boundary invariant** — the preview state satisfies that ID's gate. The gate table is
   `public/aha-review-contract.js:4-14` (`rules`) and the act table is line 15 (`acts`).
2. **Event recorded** — `state.ahaSeen` actually contains the ID. This is deliberately not
   "the number happens to be large enough": the moment must have fired.
3. **Real transition** — a visible, enabled button in `#primary-actions` is clicked and the
   resulting state must match that command's entry in the `transitions` table
   (`aha-review-contract.js:28-39`). A click that changes nothing fails.

Plus, for every ID: **A28** additionally requires `#rate === '0'`, `#ending` visible, and
zero enabled actions; and **every** case runs `assert_player()`, which asserts the player
iframe's `inner_text` *and* `aria_snapshot` contain no match for
`META` (`tests/intent-browser/test_aha.py:19`) — `A01..A28`, `AHA`, `ACT <n>`,
`Director Mode`, `导演模式`.

`rules`/`acts` are a hand-rewritten second copy of the engine's thresholds, not an import
of `GlyphEngineV3.AHAS`. Loosening a gate in the engine therefore breaks this check rather
than silently passing it. The only intentional coupling is catalogue identity and order.

## Candidate

Bind to the exact SHA. The suite serves `review-dist/` from a thread-local origin, so the
artifacts you test are the ones you just built from that SHA's working tree.

```bash
git rev-parse HEAD
```

## Build

`review-dist/` must exist first, or the suite raises
`Build review-dist with node scripts/build-aha-review.mjs first.`

```bash
npm run build:review      # build-static.mjs (writes dist/) + build-aha-review.mjs (writes review-dist/)
```

`build-aha-review.mjs` refuses to run when `VERCEL_ENV=production` — the internal review
runtime is preview-only by construction. Do not remove that guard to make a local run work.

## Run — authoritative

```bash
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py aha
GLYPH_BROWSER=webkit   python3 scripts/run-browser-contracts.py aha
```

The runner is fail-closed (`scripts/run-browser-contracts.py:16-23`): PASS requires
`discovered >= 37`, `run == discovered`, `wasSuccessful()`, and **zero** skipped, expected
failures, or unexpected successes. Exit code is 0/1. It writes
`test-results/intent-audit/aha-<browser>.json`.

37 = 28 generated `test_state_AXX_real_invariant_and_action` cases (`test_aha.py:214-227`)
+ 9 hand-written contract tests. Run both engines: they are separate CI matrix rows and
WebKit is where `getClientRects()`/`:has()` visibility differences would show up.

The player suite is the other half of the leak boundary — run it too when the diff touches
`build-static.mjs`, the privacy layer, or `play.html`:

```bash
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player   # minimum 19
```

## Run — in-app 28/28

The review page carries its own verifier (`public/aha-review-ui.js:54-63`, `#verify-all`),
which loops `GlyphAhaAudit.ids` calling `exercise` in the review iframe. Drive it through
the committed driver rather than hand-rolling Playwright:

```bash
python3 .claude/skills/run-glyph-factory/driver.py aha
```

Expect `28 / 28 PASS · 状态不变量、真实动作效果、终态与存档隔离全部通过。` This is a
*tool-assisted pass*, not a scripted pass — say so when you report it, and pair it with the
suite above.

## Anti-false-green checks

Four of the nine explicit tests exist to prove the verifier can fail. A PASS is only
meaningful if these are green in the same run:

| test | what it poisons |
|---|---|
| `test_noop_click_cannot_report_success` | Cap the button's click; `exercise` must fail with `print did not produce its required state transition` |
| `test_full_verifier_rejects_a_broken_action_not_just_unit_detector` | Same poison, through `#verify-all`; must report `fail` and name `A01` |
| `test_wrong_state_is_rejected_even_when_requested_select_value_matches` | Set the director `<select>` to `A22` without switching state; must error `actual preview does not match requested ID` |
| `test_missing_runtime_is_fail_closed` | Stub the review runtime; `#verify-all` must be disabled and status must not contain `28 / 28 PASS` |

`test_all_28_verification_is_repeatable_and_preserves_real_save` runs the whole audit twice
and asserts the real player save and `glyph-factory-ui-reveals-v3` are byte-identical
before and after (ignoring `updatedAt`/`startedAt`).

## Evidence

Suite artifacts land in `test-results/aha-<browser>/` — one full-page PNG and one Playwright
trace `.zip` per test method, including `test_state_A01…A28_...png`. Copy the result JSONs
and the run logs into the verifier's candidate directory:

`/tmp/glyph-factory-verify/<sha>/`

Record: SHA, both browser results, the driver's `aha` line, and the screenshot paths. A
green `npm test` is **not** a UI PASS for this question — it only covers the Node layer.

## What a PASS here does not prove

State these limits when reporting; they are the difference between an honest and an
overclaimed verdict.

- **Only 3 of 28 have a real-play path.** `test_F01/F02/F03` operate the production UI;
  the other 25 arrive by director fixture. The suite proves "this state satisfies its gate
  and this action moves it", not "a player playing normally reaches it".
- **Ordering and mutual exclusion are untested.** Nothing asserts A03 cannot fire before
  A02, or that reaching A17 leaves A22's gate alone.
- **No pixel assertions.** Visibility is asserted as `hidden` / `getClientRects()`;
  the stored PNGs are evidence for a human, not compared by any assertion.
- **`28 / 28 PASS` is scoped to `review-dist`** — engine plus review runtime. The *player*
  guarantee comes from `build-static.mjs` baking `data-audience="player"` and the
  `!important` hide rules into `dist/`, which `test_player.py` then asserts on the real
  artifact. Do not quote the 28/28 as a player-package claim.

## Gotchas

- **`review-dist/` is required and is not built by `npm run dev`.** A fresh clone fails the
  suite with a build error, not a test failure.
- **Playwright version drift.** `tests/browser/requirements.txt` pins `1.57.0`; a machine
  may have a newer one. CI installs the pin. Only the sync API is used, so either works,
  but a version-only difference is not a candidate regression.
- **The suite installs its own clock.** `page.clock.install(FIXED)` + `pause_at` +
  `run_for(1500)` in teardown make the run deterministic; do not add wall-clock `sleep`s.
- **Teardown fails the test on any console error, page error, or failed request.** A test
  that shows `ok` may still be reporting through that path — read the log, not just the
  dots.
- **macOS has no GNU `timeout`.** Bound long runs with the driver's own flags or run in the
  background; `timeout 300 python3 ...` is `command not found`.

## Maintaining this skill

Re-run both browser legs and the driver `aha` command before editing this file, and keep
the "does not prove" section current — new F-tests or an ordering assertion would retire a
bullet there.
