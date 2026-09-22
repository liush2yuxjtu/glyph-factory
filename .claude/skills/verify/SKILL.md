---
name: verify
description: Verify Glyph Factory changes against the exact candidate SHA — launch the dev server, drive the real browser surfaces with the committed driver, run the 28-case Aha invariant/transition suite on chromium and webkit, check the action disclosure contract (affordability disables, never hides), the cost-gate contract (one engine table decides what an action costs, and a button must never be lit while the engine refuses it), the pacing contract (no act may collapse to a handful of decisions), the progression contract (an active rule must run, and its gating resource must be on screen) and the Aha legibility contract (every one of A01–A28 must announce itself in the player's log), and capture visual and interaction evidence. Use for general verification, proving an Aha change is safe, checking the 28/28 claim, verifying an action reveal/enable change, verifying an action cost or act-gate change, verifying an advance() cadence / Act II progression change, verifying the game is still completable at a sane pace, or verifying that an Aha is perceivable on the player surface.
---

# Verify Glyph Factory

Upstream behavior reference:
`https://raw.githubusercontent.com/asgeirtj/system_prompts_leaks/main/Anthropic/claude-code/skills/verify/SKILL.md`

This is the project's only verify skill. `.claude/skills/run-glyph-factory/` owns launching
and driving the dev server; this skill owns candidate binding, the evidence layout, the
general "drive the real surface" contract, and the one deep question it also answers:
**does each of A01–A28 actually hold, against this exact SHA?**

All paths are relative to the repo root.

## Candidate

Verify the exact commit/PR candidate. For deployed behavior, use the exact Preview/Pages URL for that SHA.

```bash
git rev-parse HEAD
```

## Launch

From repo root:

```bash
npm run dev
```

Default Next.js readiness is the local URL printed by the dev server.

The repository also provides:

```bash
npm run verify:fast     # Node contract suite + build-static.mjs
npm run verify          # the above + unittest discover tests/browser
npm run intent-audit    # the canonical aggregate gate — see below
```

`npm run verify` runs the Node contract suite, static build, and the player browser layer
through **raw `unittest discover`**, which does not enforce a nonempty/unskipped floor. A
green `npm run verify` is therefore supporting evidence only; the fail-closed runner below
is the authoritative form of the same suite. Still drive the user-facing surface for UI
changes.

### `npm run intent-audit` — the canonical gate, and its current defect

`public/aha.md` ("Non-negotiable result semantics") makes `npm run intent-audit` the
authoritative acceptance run: static contract + player Chromium/WebKit + Aha
Chromium/WebKit + negative controls, with **any** failure, skip, zero-case run, missing
dependency, or stage that did not execute counting as not-ALL-PASS. It records `commit`,
`dirty`, and a `sourceSha256` over `public/ src/ scripts/ tests/ .github/ aha.md intent.md
package.json package-lock.json vercel.json` into
`test-results/intent-audit/report.json`, and its stages are, in order:
`fast` → `review-build` → `player-chromium` → `player-webkit` → `aha-chromium` →
`aha-webkit` → `diff-check`.

**As of 2026-09-20 it aborts on the first stage on this machine** (`scripts/intent-audit.mjs:40-42`):

```
error: "Fast gate did not prove nonempty, unskipped success"
stages: [{ name: "fast", status: "PASS", exitCode: 0 }]
```

The fast stage *passes*; the audit's parser then rejects it. `verify-player.mjs` shells out
to `node --test`, and Node ≥ 20 prints `ℹ tests 83` (an illustrative count, not this repo's
total) where the audit's regex requires
`# tests (\d+)`. This is a Node-reporter-format drift, not a product regression. It is not
count- or content-dependent — the regex matches the reporter's *prefix*, so a clean
checkout fails the same way; verified directly with
`/^# tests (\d+)$/m.test('ℹ tests 83') === false`. Fixing it is a one-line regex change in
`scripts/intent-audit.mjs`; until then, reproduce the audit by running its five substantive
stages by hand and reporting them individually:

```bash
npm run verify:fast
npm run build:review
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player
GLYPH_BROWSER=webkit   python3 scripts/run-browser-contracts.py player
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py aha
GLYPH_BROWSER=webkit   python3 scripts/run-browser-contracts.py aha
git diff --check
```

Say plainly that this is the hand-run equivalent, not `intent-audit` itself.

### Build before any browser suite

Every browser suite serves a built artifact, so `dist/` must exist first or the run dies in
`setUpClass` rather than failing a test:

- `run-browser-contracts.py player` → `test_player.PlayerContract` raises
  `Build the player bundle first: node scripts/build-static.mjs`.
- `run-browser-contracts.py aha` → the review suite raises
  `Build review-dist with node scripts/build-aha-review.mjs first.`
- `test_player.py` also refuses to run against a review build
  (`playerSpoilers is not False`).

`npm run verify:fast` and `npm run build:review` both write `dist/`; `npm run build:review`
additionally writes `review-dist/` and is the one to use when you need the Aha suite. A
cold `run-browser-contracts.py player` on a fresh clone fails for this reason alone.

## There is no CI — every gate in this file runs here

This repository has no GitHub Actions. Two workflows used to exist —
`.github/workflows/game.yml` (fast contracts → player/aha browser matrix → `Player merge gate`
→ Vercel deploy) and `.github/workflows/replit-localization.yml`. Their coverage moved into
this skill; for each check, the command below is now the **only** place it runs.

| What used to be a workflow job | Run this instead |
|---|---|
| `Fast engine and player-build contracts` | `npm run verify:fast` |
| `Build the separate internal review artifact` | `npm run build:review` |
| `Player regression (chromium / webkit)` | `GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player`, then `webkit` |
| Aha suite, both engines | `... run-browser-contracts.py aha` under each `GLYPH_BROWSER` |
| `Validate internal review video` (ffprobe ≥ 20 s) | `npm test` — `tests/preview-v3.test.mjs` reads the EBML `Duration` element directly, so this now works on macOS, which has no ffprobe |
| Replit verifier fixtures + public Replit acceptance | **removed 2026-09-22, not replaced.** `test_verifier.py` and `verify_live.py` were deleted with the workflow, so `deploy/replit-localization/glyph-language.js` now ships with no coverage at all. Do not re-add the live check as a substitute here — the decision was to stop checking that adapter |
| `Player merge gate` | the rows above, all green, **on the same commit**. There is no summary job to read any more, so an unrun or skipped stage is a FAIL — never a pass by omission |
| Vercel deploy | not this skill's job. `vercel.json` sets `outputDirectory: dist`, so Vercel's Git integration deploys the push on its own. A READY badge was never a verification result and still is not |

Nothing runs these on your behalf. Report each stage that you actually ran, name the ones you
did not, and do not describe an unrun stage as passing.

## Drive

Use the committed driver rather than hand-rolling Playwright —
`.claude/skills/run-glyph-factory/driver.py` (`smoke`, `shot <surface>`, `play`,
`publish`, `review`, `aha`, `demo`). It starts and stops the dev server itself, writes
screenshots plus `report.json` to `--out`, and exits non-zero on a failed check. See
`.claude/skills/run-glyph-factory/SKILL.md` for the full contract and the gotchas that
make raw locator clicks fail here (the 500ms `replaceChildren` re-render, the runtime
privacy strip on `/`, the auto-sell deadlock on stock-cost actions).

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

When the question is specifically whether A01–A28 still hold, use the dedicated suite
below. The driver's `aha` command is a tool-assisted pass only — pair it with that suite.

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

### The disclosure contract: affordability disables, it never hides

`renderActions()` in `public/glyph-game-v3.js` splits every action into **reveal** and
**enable**. Reveal decides whether the button exists at all and is latched in
`glyph-factory-ui-reveals-v3`; enable decides whether it is clickable. The rule, stated in
the function itself and in `aha.md`'s `hidden → discovered → persistent` contract:

> Reveal conditions must use latched or monotonic facts. Affordability only disables a
> discovered action; it never hides it.

This is not stylistic. With auto-sell on, `advance()` runs `sold = Math.floor(g.glyphs)`, so
`s.glyphs` sits in `[0, 1)` permanently. **Any reveal condition reading `s.glyphs` or
`s.credits` is unreachable for exactly the players who engaged with the automation the game
rewarded them for** — `publish` needs 200 stock, `compose-rule` needs 2, `condense` needs
20. A reveal that also gates on stock produces a button that never appears, with no
in-game explanation. That was the state before 2026-09-20, when `publish` used
`E.canPublish(s)` for reveal *and* enable.

Verify a disclosure change at both layers:

**Node (always).** `tests/progressive-disclosure.test.mjs` →
`affordability never hides a discovered action` statically parses every `add('key', reveal,
enable, ...)` call and asserts reveal ≠ enable, that reveal matches nothing for
`\bs\.(?:glyphs|credits)\b`, and that `'toggle-auto'` is emitted exactly once (the toggle
must render in every act, or publishing with auto-sell on strands the player with no way to
stop it). Negative control — restore `add('publish', E.canPublish(s), E.canPublish(s), …)`
and it must fail naming `'publish'`.

It parses **both** registration forms: the `add(…)` helper and direct
`rememberReveal('action:<key>', <reveal>)` calls. The second form was a blind spot —
`contract` used it and kept `c && s.glyphs>=c.glyphs`, so a player who turned auto-sell on
before ever holding the first contract's 20 glyphs never saw the button, and the suite was
green throughout. It now asserts its own detector still rejects that exact shape, so a green
run cannot just mean the pattern stopped matching anything.

**There is a third form, and it is the one that bites: `buttons.push(actionButton(…))` with a
hand-written `enabled`.** A button pushed straight into the list never consults
`E.commandReady()`, so it stays lit while the engine silently refuses the click — the exact
defect this contract exists to prevent, reproduced from the other direction. It happened again
on 2026-09-21 to `discover-dialect` the moment that action acquired a cost, and no test caught
it; CodeRabbit did. Route every costed action through `add(…)`. When you add a cost to an
action, grep for its command name in `glyph-game-v3.js` and confirm exactly one registration,
through the helper.

**Browser (for any stock-cost action you changed).** Two committed cases cover this:
`test_sell_stays_visible_disabled_and_persistent_after_zero_and_reload` (*sell*) and
`test_contract_survives_auto_sell_stranding_the_one_stock_cost_it_has` (*contract*, seeded
with auto-sell on and 320 lifetime glyphs). Nothing covers publish/compose/condense. Seed
the stranded state and assert on `/` — the privacy-stripped player route — not just
`play.html`:

```js
// add_init_script, NOT a post-goto evaluate: the page autosaves on `pagehide`,
// so writing localStorage after a goto and then reloading is clobbered by the
// in-memory state on the way out.
{ version: 3, glyphs: 0.8, credits: 478.5, lifetimeGlyphs: 12800,
  keyboards: 11, typists: 10, presses: 8, contracts: 3, act: 1,
  manualBoost: true, autoSellUnlocked: true, autoSell: true,
  published: false, ahaSeen: ['A01','A02'] }
```

Assert all four, then toggle auto-sell off and assert the button flips to enabled within
~4s (≈120 glyphs/s):

1. the button is present in `#primary-actions`;
2. it is `disabled`;
3. its `.action-sub` states the shortfall;
4. when auto-sell is the cause, `.action-sub` contains `自动出售正在清空库存`.

Also assert the privacy boundary still holds in the same pass — the iframe body text must
contain no match for `AHA`, `ACT `, `A01`, `导演模式`, `Director`.

### The progression contract: a running rule must run, and its resource must be on screen

Act II is the one act whose pacing is not "click the thing you can see". Its gates are
`readers` (A06 at 100, A07's letter at 250, A10's paper crisis at 1000) and `composed`. Both
numbers do exist in the DOM — `renderWorld()`'s Act II panel is exactly
`READERS / DEMAND / COMPOSED / DELETED` — but `renderDisclosure()` hides the world card
until `s.act >= 3`, so until 2026-09-20 **nothing on the player surface showed either one**.
Two defects compounded into a reportable dead state ("i cannot trigger more aha moments"):

1. **An active rule produced nothing while the player watched.** `advance()` used
   `Math.floor(elapsed / RULE_PERIOD)`, which is `0` for every 500 ms live tick — `tick()`
   calls `advance` twice a second with ~0.5 s of elapsed time, so only a multi-second
   catch-up (offline return, `visibilitychange`) could ever cross the 4 s boundary. A04's
   own title is 「规则开始自动运行」. The engine's unit test passed anyway because it
   advanced 8 s in a single call. So the rule only ever ran when the player was *away*.
2. **The only feedback was a lie.** `刻模`'s `.action-sub` was static discovery copy
   (`2 字 → 一条可重复规则`), so every click re-logged `刻模成功：木 + 木 → 林。` and changed
   nothing visible — `composed` (its only output) was itself hidden. A working button reads
   as broken.

The fix is one engine change and two renderer changes, and the invariant to verify is the
one that was violated: **a running rule must produce the same output from many short ticks
as from one long jump.**

**Node (always).**

```bash
npm test    # tests/game-v3.test.mjs → "an active rule composes on the live 500ms tick…"
```

The test asserts the identity rather than a magic number: 40 × 500 ms ticks and one 20 s
jump must both yield `composed === 6` from `composed: 1`. Pre-fix the stepped run yields
**1** — the manual click only. Negative control: restore
`Math.floor(elapsed / RULE_PERIOD)` with no remainder carried and the assertion must fail;
verified at `7ebd57b+`, stepped `composed=1` vs leap `composed=6`.

**Browser (for any `advance()` cadence or Act II surface change).**
`tests/browser/test_player.py::test_act_two_shows_readership_and_a_rule_that_is_really_running`
seeds the reported dead state and asserts readership is visible while the world card is
*not*, that the button says `已刻 14 条` / `读者 +`, and that `composed` grows under
`clock.run_for` with no clicks. To prove the act actually *completes* rather than merely
moves, drive the whole gate on the player route — this is the end-to-end recipe, seed the
state, then `clock.run_for`, click by `data-command`, and read back `localStorage`:

```js
{ version: 3, act: 2, published: true, readers: 137, demand: 1.2, glyphs: 2700,
  credits: 97700, lifetimeGlyphs: 214600, meaning: 457.8, noise: 5.2,
  composed: 14, ruleActive: true, autoSellUnlocked: true, autoSell: false,
  keyboards: 11, typists: 10, presses: 8, contracts: 3, manualBoost: true,
  ahaSeen: ['A01','A02','A03','A04','A05'] }
```

Must reach, in order: `readers` visible on the metric row; `read-letter` appears once
`readers >= 250`; A07 → A08 → A09 → A11 fire on real clicks; A10 fires from readership
alone; `map-city` appears; clicking it gives `act === 3, worldScale === 1, districts === 1`
and fires **A14 only** — A12 needs the first 观察一个新方言, because `map-city` no longer
grants the second district (see the legibility contract below); **and only then** does
`#world-card` become visible. Fifteen assertions, all passing at `7ebd57b+` — the run is
reproducible but the script lives in `/tmp`, so treat it as a recipe to re-drive, not a
committed suite. Say that when you report it.

Two boundaries this must not cross, both pinned by existing tests:

- **`#world-card` stays hidden until Act III.** `test_layout_expands_only_when_world_is_discovered`
  (`test_player.py:156`) and `test_F02_city_and_world_require_real_actions`
  (`test_aha.py:124`) assert it hidden at Act II *even with `paperCrisis` and `meaning: 75`
  already true*. Putting readership on the metric row instead of unhiding the world card is
  what keeps `aha.md`'s S10/S11 intact.
- **Reveal is still behavioral.** The 读者 metric appears when readership first exists
  (`s.readers > 0 || s.published`) and then persists — it is not a "show everything at
  Act II" switch. A fresh save must still render exactly one metric: `test_fresh_game_is_small_and_survives_timer_renders`
  now lists `readers` beside `credits`/`meaning`/`noise` in its hidden-on-fresh loop.

The engine exports `RULE_PERIOD` (4) and `RULE_READERS` (0.015) so the renderer reports the
real coefficient instead of a second copy; if you change the cadence, change it there.

### The cost-gate contract: one table decides what an action costs

Added 2026-09-21. `glyph-engine-v3.js` owns two tables and nothing else may restate them:

| Table | Answers | Read by |
|---|---|---|
| `ACT_GATES` + `gateMet(g, act)` | what it takes to leave an act | the act-transition actions, and `gateProgress()` for the progress bar |
| `COMMAND_COSTS` + `commandReady(g, type)` | what a single action costs | `act()`'s own guards, and `renderActions()` to grey the button |

Before this, each act-transition condition was written into its own action *and* copied into the
progress bar, so the bar could read "one step left" while the button already worked. Verify a
cost change at both layers:

- **Node.** `the engine never accepts a command its own cost gate calls unaffordable` walks all
  28 director states × every costed command × three resource paddings and asserts the direction
  that matters for the disclosure contract: a command the gate calls unaffordable must never be
  accepted. It does **not** assert the converse — `commandReady` deliberately models costs only,
  not act windows or one-shot guards, so an affordable command may still be a no-op.
- **Two traps when seeding it.** `act()` runs `advance()` first, so readiness and acceptance must
  be judged on the same advanced state, not on the raw snapshot — one tick of production can
  afford a cheap command. And padding resources can cross a milestone on its own, so the
  baseline has to be `advance(seeded, at)` rather than `seeded`, or a refused command looks
  accepted because `syncAhas()` changed something.

`COMMAND_SPENT` rides in the same table: a one-shot that has already fired (`digitize`,
`editor-autonomy`, `map-city`, …) reports not-ready, so the button greys out with its own
「已完成」 copy instead of sitting there doing nothing. A spent action that still renders enabled
is a bug — it is what made the review suite's `exercise()` pick a no-op button and fail.

### The pacing contract: no act may collapse

Added 2026-09-21, after the flow audit. The original defect: ACT I took 651 clicks and the four
acts after it took 35, because every gate was fed by exactly its own previous click. Deltas that
granted the next Aha's threshold outright (`digitize` +100 articles, `machineGlyphUse` seeded at
its own 1000) made each later act one click per insight.

Two invariants now hold, both under test:

1. **Accumulation, not adjacency.** A gate must depend on a resource that accrues on its own
   clock. `discover-dialect` needs `readers >= 600 × (districts + 1)`; `make-concept` needs
   `concepts < districts`. Every later action also costs something.
2. **No act is trivial.** `a plain playthrough with legal actions reaches the ending…` drives a
   full game and asserts it reaches `stopped`, sees all 28 milestones, and that **no act takes
   fewer than 5 decisions**.

Reference numbers from the probe at the time of writing (decisions per act I–VI): 28 / 272 / 10 /
13 / 452 / 59; wall clock 347 / 629 / 158 / 521 / 389 / 30 seconds. Treat a large shift in either
column as a regression signal, not as noise.

**Two gates that are easy to break by accident.** `stop-printing` requires
`ambiguityResolved`, and `resolve-ambiguity` requires `ambiguity >= AHA_GOALS.A26.need` — that
pair is what makes A26 unskippable, and loosening either one reintroduces "a milestone the
normal path walks past". Separately, `digitize` disables both `sell` and auto-sell, so if the
later acts cost credits at all there must be an equivalent income: digital publishing earns
`credits += elapsed × readers × 0.004`. Removing that line deadlocks the game with no error.

### The Aha legibility contract: every moment must be said out loud

`aha.md` forbids the player from ever seeing `A01–A28`, `AHA`, `ACT`, Director Mode or any
explanation of a mechanic. The privacy layer enforces it by stripping every `A## ·` line out
of the log (`player-privacy-v3.js`, `scrubLog`). The consequence was not noticed until
2026-09-20: **an Aha's only trace in the engine was exactly that line**, so on the player
surface all 28 moments fired and produced nothing at all. What the player actually saw was
the threshold crossing itself, which is indistinguishable from drift — `readers 99 → 103`
is not a statement, and for the five time-driven moments (A06, A10, A19, A23, A26) the
player was looking at an idle screen when the game recorded an insight.

The fix is `AHA_WORLD` in `glyph-engine-v3.js`: one world-language sentence per Aha, emitted
by `syncAhas()` immediately after the design line, containing no ID, no act number and no
mechanic explanation. It is the thing the player reads, and it is the only reason an Aha is
perceptible. Four invariants follow, and all four are committed tests:

1. **Every Aha has exactly one announcement**, distinct, ≥12 characters, containing no
   `A\d\d` / `AHA` / `ACT` / `导演` / `Director`, and equal to neither the title nor the
   reveal — `tests/game-v3.test.mjs::every Aha carries a player-facing world line…`.
2. **At the moment it fires, the announcement is the newest line the player reads.** The
   design line goes in first, the world line second, so after `scrubLog` the world line is
   index 0 of the rendered log. Node asserts `after.log[0]` whenever the fixture fires
   exactly one Aha (a fixture that also crosses a later threshold announces both, which is
   what offline catch-up legitimately does); the browser asserts it on the real DOM for all
   28, no exceptions.
3. **The player build keeps the world lines while the design copy is blanked.**
   `scripts/build-static.mjs` strips `aha(...)` titles/reveals by regex; `AHA_WORLD` is a
   separate literal so it survives. The build now fails closed if any of the 28 lines is
   missing from the stripped payload, or if a design title leaked into it. Keep world copy
   **out of the `aha(...)` call** — folding it in would silently strip the player's version.
4. **One real action never fires two Ahas.** Four pairs used to, because the action granted
   the second Aha's threshold outright: `digitize` added 100 articles (A19+A20),
   `discover-machine-glyph` seeded `machineGlyphUse: 1000` (A22+A23), `infrastructure`
   seeded `ambiguity: 100` (A25+A26), and `map-city` granted `districts: 2` (A12+A14). Each
   now starts below its own threshold and the moment arrives when it becomes true. The city
   therefore opens with `districts: 1`, and `test_F02_city_and_world_require_real_actions`
   clicks 观察一个新方言 twice before 把地图缩到世界.

**Node (always).**

```bash
npm test
```

`tests/game-v3.test.mjs` carries invariants 1, 2 and 4, plus the existing cadence identity.
Invariant 4 runs all 28 director states × all 30 real commands.

It also carries the two contracts added on 2026-09-21:

```bash
# Node must be given the pattern BEFORE the file list; `npm test -- --test-name-pattern` puts it
# after, and the flag is then ignored — all 91 run and the filter silently does nothing.
node --test --test-name-pattern 'playthrough with legal actions' tests/*.test.mjs          # pacing
node --test --test-name-pattern 'never accepts a command its own cost gate' tests/*.test.mjs
```

**The director states are part of the contract, not scaffolding.** `directorState(id)` must
produce a state that can *afford* the action it is there to demonstrate — a snapshot whose own
button is greyed out reviews nothing. When you add a cost, check `directorState` grants enough
resources to cover it (credits and meaning trigger no Aha by ACT III, so raising them is safe;
readers past A06 and meaning past A05 likewise). Fifteen review-suite cases failed on
2026-09-21 for exactly this reason.

**Browser (for any `AHA_WORLD`, `syncAhas`, log, or player-surface change).**

```bash
node scripts/build-static.mjs
GLYPH_BROWSER=chromium python3 -m unittest \
  tests.browser.test_player.PlayerContract.test_every_aha_reaches_the_player_as_a_visible_world_change -v
```

The sweep seeds each Aha's predecessor state, performs the real action on the real player
build, and asserts the expected sentence — read from `public/glyph-engine-v3.js`, so this
checks source → built bundle → visible DOM rather than agreeing with itself — is present in
`#log` **and is its first line**, with `assert_no_spoilers()` on every one of the 28.
Expected copy is parsed with `^ {4}(A\d{2}): '([^']+)',$`, the same shape the build guard
uses; if you reformat `AHA_WORLD`, both break together, which is the point.

Its negative control is `test_aha_announcement_detector_rejects_an_engine_without_world_lines`:
it serves an engine whose `AHA_WORLD` is `{}` via `context.route`, requires the Aha to still
be recorded, and requires the announcement to be absent. A green sweep is only meaningful
alongside it.

Two seeding traps this suite already handles, both of which silently produce a *false green*
rather than an error: writing `localStorage` and then reloading loses the race against the
outgoing page's `pagehide` save — stage the fixture in `sessionStorage` and let an init
script apply it on the next document; and the log renders a leading `›` / `·` marker, so
compare against `line.lstrip("›·").strip()`, not the raw line.

## The 28 Aha moments (A01–A28)

### What "verifying one Aha" means here

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

### Build

The suite serves `review-dist/` from a thread-local origin, so the artifacts you test are
the ones you just built from that SHA's working tree. See "Build before any browser suite"
above for the prerequisite and its failure mode; in short:

```bash
npm run build:review      # build-static.mjs (writes dist/) + build-aha-review.mjs (writes review-dist/)
```

`build-aha-review.mjs` refuses to run when `VERCEL_ENV=production` — the internal review
runtime is preview-only by construction. Do not remove that guard to make a local run work.

### Run — authoritative

```bash
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py aha
GLYPH_BROWSER=webkit   python3 scripts/run-browser-contracts.py aha
```

The runner is fail-closed (`scripts/run-browser-contracts.py:16-23`): PASS requires
`discovered >= 37`, `run == discovered`, `wasSuccessful()`, and **zero** skipped, expected
failures, or unexpected successes. Exit code is 0/1. It writes
`test-results/intent-audit/aha-<browser>.json`.

37 = 28 generated `test_state_AXX_real_invariant_and_action` cases (`test_aha.py:214-227`)
+ 9 hand-written contract tests. Run both engines separately and report each: WebKit is where
`getClientRects()`/`:has()` visibility differences would show up, and one engine standing in
for the other is not a PASS.

The player suite is the other half of the leak boundary — run it too when the diff touches
`build-static.mjs`, the privacy layer, or `play.html`:

```bash
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player   # floor 19, currently 26
```

### Run — in-app 28/28

The review page carries its own verifier (`public/aha-review-ui.js:54-63`, `#verify-all`),
which loops `GlyphAhaAudit.ids` calling `exercise` in the review iframe. Drive it through
the committed driver rather than hand-rolling Playwright:

```bash
python3 .claude/skills/run-glyph-factory/driver.py aha
```

Expect `28 / 28 PASS · 状态不变量、真实动作效果、终态与存档隔离全部通过。` This is a
*tool-assisted pass*, not a scripted pass — say so when you report it, and pair it with the
suite above.

### Anti-false-green checks

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

Write candidate-specific screenshots, browser observations, and the run artifacts under:

`/tmp/glyph-factory-verify/<sha-or-pr>/`

Record route, viewport/browser, action, and resulting state. Build/test success alone is not a UI PASS.

For the Aha suite, the per-test artifacts land in `test-results/aha-<browser>/` — one
full-page PNG and one Playwright trace `.zip` per test method, including
`test_state_A01…A28_...png`. Copy the result JSONs and the run logs into the verifier's
candidate directory.

Record: SHA, both browser results, the driver's `aha` line, and the screenshot paths. A
green `npm test` is **not** a UI PASS for the Aha question — it only covers the Node layer.

**If the change touches the player surface, the design-system atlas is now stale.** Test counts
and build success will not tell you. `public/design-system/flows.html` is a *reading* of the real
DOM (`scripts/flows/screens.json`), so it silently keeps describing the previous UI:

```bash
python3 test-results/audit-shots/screens.py   # re-capture from a running static server on :4399
cp test-results/audit-shots/screens.json scripts/flows/screens.json
python3 scripts/flows/build.py                # writes public/design-system/flows.html
```

Then look at it. The failure mode has no error message: SVG `var(--token)` referencing a token
that does not exist resolves to **black**, not to a warning, so a page can load cleanly with
every screen painted wrong. Confirm `getComputedStyle(document.querySelector('svg.sch rect')).fill`
equals the paper token, not `rgb(0, 0, 0)`.

## Probe

Exercise one adjacent state: alternate asset, repeated interaction, resize/mobile viewport, missing/invalid input, or another browser engine when the diff suggests it.

## Cleanup

Stop the dev server/browser sessions started by verification. Preserve evidence.

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
- **The disclosure contract test is static.** `affordability never hides a discovered
  action` reads source text. It proves reveal ≠ enable and that no reveal in either parsed
  form reads `s.glyphs`/`s.credits`; a reveal registered by some third form is still
  invisible to it. It does **not** prove the button actually renders visible, that
  `rememberReveal` latches it, that `enabled` is correct, or that the shortfall copy says
  the right thing. Only the seeded browser recipe above covers that, and only for the
  actions you actually seed.
- **The pacing test measures one policy, not the game.** `a plain playthrough…` finishes the
  game and counts decisions, but the counts depend on the strategy hard-coded in the test. A
  human who plays differently gets different numbers; the assertion (`no act below 5`) is a
  floor, not a curve. Treat the per-act columns as a regression signal — when they move a lot,
  re-run `node /tmp/glyph-audit/reconcile.mjs` (a second, independent policy) before believing
  either number. And its guard against "one click satisfies the next gate" is structural only
  for the one pair it names (`concepts < districts`); a new adjacency of that shape would not
  be caught.
- **A cost-gate PASS says nothing about copy.** `commandReady` decides whether a button is
  enabled and which field is named as the shortfall, but nothing asserts the label a player
  reads is the right noun for that field. `E.fieldLabel` maps the key; a wrong entry there
  produces a grammatically fine, semantically wrong sentence that every suite accepts.
- **The Act II progression recipe is not a committed suite.** The fifteen-assertion
  end-to-end run (dead state → `map-city` → Act III) lives in `/tmp`, not in `tests/`. The
  committed coverage is narrower: the Node cadence identity, and one browser test asserting
  readership is visible and `composed` grows. Nothing committed proves the *whole* gate is
  completable, so a green suite does not by itself license "Act II is unstuck".
- **The cadence test proves tick-equivalence, not pacing.** `live ticks == one jump` says
  the rule's output is no longer lost to tick granularity. It says nothing about whether
  the resulting curves are balanced — readership is quadratic in time once `composed`
  grows, and no test bounds that.
- **The Aha legibility sweep proves transport, not quality.** It asserts the authored
  sentence reaches the newest line of the player's log with no meta leak. It does not judge
  whether the sentence is *good*, and nothing asserts the announcement is still on screen
  later — `log` is a 40-entry ring, so in a busy stretch it can scroll away.
- **The sweep seeds boundary states, not a playthrough.** All 28 are driven from
  `AHA_CASES` in `test_player.py`, one action each, with the prior IDs pre-recorded in
  `ahaSeen`. It proves every moment is reachable and legible from the state just before it;
  it does **not** prove a player playing normally arrives at those states in that order.
- **Aha ordering is still only partly tested.** Invariant 4 forbids two Ahas from one
  *action*; nothing forbids a later Aha from being reachable before an earlier one, and the
  `directorState` fixtures bypass the ordering question entirely.
- **`AHA_WORLD` ships in the player bundle and is readable in devtools.** That is inherent —
  the engine has to write the sentence into the log — and it is a weaker disclosure than the
  stripped title/reveal, which are blanked precisely so the payload carries no designer copy.
  Do not describe the player package as "carries no Aha text"; it carries the world lines
  and nothing else. `tests/progressive-disclosure.test.mjs` still pins title/reveal to `''`.
- **`demand` is a dead field and A06 rests on it.** `g.demand` is set by `advance()` and by
  two actions, but nothing reads it and the only panel that renders it (`renderWorld()`'s
  Act II set) is unreachable on the player surface, because `#world-card` is hidden until
  Act III and by then the panel shows the Act III set. A06's world line describes reader
  growth instead, which is real and visible, but the resource the Aha is named after has no
  carrier anywhere. Reported, not fixed — rebalancing it is a pacing decision.
- **`npm run intent-audit` did not run.** While its regex defect stands, there is no
  single command whose green means "all layers passed". Report the five hand-run stages
  individually and say that is what you did — do not present them as `intent-audit` PASS.
- **No run in this session executed the Aha suite against a deployment.** Every result here
  is a local artifact built from the working tree; `report.json` says so in its own `scope`
  field. A local green is not a Preview or production claim.

## Gotchas

- **`review-dist/` is required and is not built by `npm run dev`.** A fresh clone fails the
  suite with a build error, not a test failure. Same for `dist/` — see "Build before any
  browser suite" above; the failure reads as `setUpClass ERROR`, not as a test failure, so
  a run showing `discovered 26, run 0, errors 1` is a missing build, not a product defect.
  (The `aha` suite discovers 37 and needs `node scripts/build-aha-review.mjs` first; it is not
  built by `npm run dev` either.)
- **Seeding `localStorage` needs `add_init_script`, not a post-`goto` evaluate.** The
  controller registers `pagehide → save(true)`, so writing a fixture save after `goto` and
  then calling `reload()` has it overwritten by the in-memory state on the way out. The
  page then loads your fixture's *absence* and autosaves a fresh game — which looks exactly
  like "the fixture didn't apply". Also `restore()` only takes the full path when
  `value.version === 3`; an unversioned fixture silently degrades to the legacy migration
  branch and discards every field it does not name.
- **Act II's world card is hidden on purpose — do not "fix" it by unhiding.** The natural
  reading of `aha.md` S11 is "the world surface appears when the city condition holds", but
  `test_F02_city_and_world_require_real_actions` pins the stricter behavior: hidden until
  `act === 3`, even at `cityReady`. Legibility for Act II belongs on the metric row and in
  `#primary-actions`, which is where `renderActions()` already carries the shortfall idiom.
- **Playwright version drift.** `tests/browser/requirements.txt` pins `1.57.0`; a machine
  may have a newer one. Nothing installs the pin for you any more — this repository has no
  CI runner, so `python -m playwright install` on the machine you are on is now the only
  source of the browsers. Only the sync API is used, so either version works, but a
  version-only difference is not a candidate regression.
- **The suite installs its own clock.** `page.clock.install(FIXED)` + `pause_at` +
  `run_for(1500)` in teardown make the run deterministic; do not add wall-clock `sleep`s.
- **Teardown fails the test on any console error, page error, or failed request.** A test
  that shows `ok` may still be reporting through that path — read the log, not just the
  dots.
- **macOS has no GNU `timeout`.** Bound long runs with the driver's own flags or run in the
  background; `timeout 300 python3 ...` is `command not found`.

## Maintain this verifier

Re-run every command above before changing this file. Update only when actual launch
commands, routes, browser harness, or proof requirements change, and keep the "does not
prove" section current — new F-tests or an ordering assertion would retire a bullet there.
