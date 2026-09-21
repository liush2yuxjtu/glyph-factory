---
name: verify
description: Verify Glyph Factory changes against the exact candidate SHA — launch the dev server, drive the real browser surfaces with the committed driver, run the 28-case Aha invariant/transition suite on chromium and webkit, check the action disclosure contract (affordability disables, never hides), the progression contract (an active rule must run, and its gating resource must be on screen), the Aha legibility contract (every one of A01–A28 must announce itself in the player's log) and the rhythm contract (the gaps between consecutive Aha moments: order, no same-click pairs, mean and standard deviation of the click gaps), and capture visual and interaction evidence. Use for general verification, proving an Aha change is safe, checking the 28/28 claim, verifying an action reveal/enable change, verifying an advance() cadence / Act II progression change, verifying that an Aha is perceivable on the player surface, or verifying game pacing / rhythm after a threshold, cost or gate change.
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

It runs end to end as of 2026-09-21. Between 2026-09-20 and then it aborted on its own first
stage: `verify-player.mjs` shells out to `node --test`, Node ≥ 20 prints `ℹ tests 91` where the
audit's parser required `# tests (\d+)`, and the fast stage was rejected *after* passing. That
was a reporter-format drift, never a product regression, but it made the canonical gate
unusable and the hand-run below was the workaround. `scripts/intent-audit.mjs` now accepts
either prefix (`ℹ` or `#`) and still treats a missing field as unproven, so the
nonempty/unskipped floor is unchanged. Verified on this machine: all seven stages PASS, 217
tests, `test-results/intent-audit/report.json` with `status: "PASS"`.

If it aborts on the fast stage again, read that stage's own log
(`test-results/intent-audit/fast.log`) before assuming a product failure: a reporter format
change looks exactly like a red gate. The hand-run equivalent, if the gate itself is broken:

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

### The rhythm contract: the gaps between Aha moments

A per-act count says an act did not collapse. It says nothing about **where inside the act**
the discoveries land: an act can hold 40 decisions and still hand the player five insights in
five clicks and then 35 clicks of nothing. The rhythm metric is therefore per **gap between
consecutive Aha moments** — how many clicks the player makes between Aha N and Aha N+1.

Two things make that measurable instead of a matter of taste:

- The engine is deterministic, so with a fixed start and a fixed policy the whole playthrough
  — and therefore the gap vector — is reproducible to the click.
- The policy is the game's own guidance, not a walkthrough. `tests/pacing.mjs` presses what the
  chapter calls for and, when it cannot, satisfies exactly the shortfall the engine reports in
  `commandReady().binding` — the same string a player reads on a greyed button (`还差 …`) — or
  the act-progress line (`gateProgress().binding`). A reference player that invents its own
  budget measures the bot, not the game; the first version of this harness did exactly that and
  reported 770 clicks in one act that a player following the on-screen text spends 5 on.

```bash
node scripts/pacing.mjs           # mean/std/CV, per-gap table, per-act clicks and seconds
node scripts/pacing.mjs --trace   # which verbs each gap was spent on
node scripts/pacing.mjs --json    # machine-readable, for comparing two revisions
```

`npm run verify:fast` runs the same playthrough inside the suite
(`tests/game-v3.test.mjs`, "a plain playthrough reaches the ending, and the rhythm between Aha
moments holds"), so a threshold change that wrecks the rhythm fails the fast gate as well.

| Assertion | Why it is a contract and not taste |
|---|---|
| Firing order equals A01…A28 | The list, and the narrative behind it, are ordered. Readers, articles, machine use and noise all grow on their own, so any trigger written as "an absolute value was reached" eventually overtakes the click that was supposed to cause it. |
| No two moments on one click | The focus card shows one moment. Two on one click means one of them is announced to nobody. |
| A 0-click gap must be ≥ 20s wide, and there are at most 3 | A designed breath (the night shift writing articles) is legitimate; a collision is not. |
| mean gap ∈ [3, 7] decisions | Under 3 the chapter is one press per insight; over 7 the player is grinding, not discovering. |
| std ≤ 5 | The number this metric exists for. |
| max gap ≤ 20 | One stretch may not carry a whole act. |
| Every act ≥ 5 decisions, and all 28 fire | The 2026-09 collapse got back in through this door once already. |

Reference numbers for the 2026-09-21 rebalance: **27 gaps, mean 4.59 decisions, std 3.75,
CV 0.82, 0 inversions, 0 same-click pairs, 2 silent beats (25s and 39s)**. Before it: mean
4.85, std 10.61, CV 2.19, 6 inversions (A05/A06, A09/A10, A13/A14, A19/A20, A23/A24,
A26/A27) and 2 same-click pairs. The full vector, in A01…A28 order:
`16 11 3 1 5 3 6 7 1 1 3 5 5 10 6 4 1 11 5 5 4 0 5 1 0 4 1`. ACT I keeps the two largest
gaps (16 and 11) because it is the manual tutorial act; excluding it the remaining 25 gaps
sit at mean 3.88, std 2.80, and the tail is the two act climaxes (A14→A15 = 10 at the world
gate, A18→A19 = 11 across the agent factories).

Read the units honestly: `decisions` excludes `print`/`sell`/`toggle-auto` (no choice in
them), `clicks` counts everything. A01→A02 is 321 clicks but 16 decisions — the difference is
a tutorial that is supposed to be clicked through, not a defect to flatten.

**How to use it on a change.** Any edit to a threshold, cost, rate or gate moves this vector.
Run `node scripts/pacing.mjs --json` before and after and compare `mean`, `std`, `inverted`,
`sameTick` and the per-gap list. Two failure shapes to look for: a *reordering*, where a
discovery that used to follow another now precedes it (that is a copy change the diff will not
show you), and a *clumping*, where several gaps go to 1-2 and one goes to 15+ (that is the
2026-09 collapse in miniature).

The lever that moved this metric most was not a number but a shape: **an act gate that asks
for the same resource the act's discoveries spend.** While Act II's gate demanded `meaning`
on top of the meaning each discovery costs, the reference player accumulated the whole
chapter's meaning during one passive wait and then paid for the next three discoveries out of
stock — three gaps of 1 in a row. Dropping `meaning` from that gate and pricing it into the
discoveries themselves (reading a letter 35, coining a word 55, spreading one 70) took the
act from `1 8 1 1 6 5 1` to `1 5 3 6 7 1 1`. Any gate that double-counts a currency the
chapter already spends will flatten the rhythm the same way.

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
`readers >= 250` **and** `meaning >= 20`; A05 (压缩) → A07 → A08 → A09 fire on real clicks;
A11 needs the paper crisis first; the city opens on its own once the Act II gates are met
(`meaning >= 80, composed >= 10, paperCrisis, deletedNoise >= 1`) — **entering Act III and
finding the map are two different beats since 2026-09-21**, and `#world-card` becomes visible
on the transition; 观察一个新方言 raises districts to 2 (A12), 创造一个概念 fires A13, and
**then** 展开城市地图 fires A14 (`districts >= 2`, `meaning >= 40`, `credits >= 150`). Walking
a dead state to the ending is a committed suite now — the reference playthrough in
`tests/game-v3.test.mjs` — so this recipe is for watching it on the real surface, not for
proving the gate is completable.

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
+ 9 hand-written contract tests. Run both engines: they are separate CI matrix rows and
WebKit is where `getClientRects()`/`:has()` visibility differences would show up.

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
- **Ordering is asserted for one path, and only one.** The reference playthrough asserts the
  firing order equals A01…A28 and that no two fire on one click, from a dead state to the
  ending. It does not enumerate the state machine: a player who takes a different route can
  still reach a later gate before an earlier one, and `directorState` fixtures bypass the
  question entirely by pre-recording `ahaSeen`.
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
- **The rhythm metric is one reference player.** It is a deterministic playthrough with a
  stated policy, not a distribution over players. It cannot show that a *different* legal
  route is equally well paced, and it says nothing about wall-clock feel: a 0-click beat is
  scored as a gap of 0 even when it lasts 200 seconds, and two revisions with identical gap
  vectors can differ in total play time. Read it next to the per-act seconds column.
- **The cadence test proves tick-equivalence, not balance.** `live ticks == one jump` says the
  rule's output is no longer lost to tick granularity. It says nothing about whether the
  resulting curves are balanced — readership is quadratic in time once `composed` grows, and
  no test bounds that. It is also why gap 1 of the playthrough opens at 321 clicks: the
  tutorial act is hand-printing, and that is a design choice, not a regression.
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
- **`public/design-system/flows.html` is now older than the engine.** It is redrawn from
  `scripts/flows/screens.json`, which was captured from a build before the 2026-09-21
  rebalance, so its gate tables and readings describe the previous flow (notably `map-city`
  as an Act II exit). Rebuilding it needs a fresh browser capture from a running build, which
  is not part of any committed script. Until that capture is redone, cite the engine and
  `node scripts/pacing.mjs` — not the flows page — as the current flow truth.
- **No run in this session executed the Aha suite against a deployment.** Every result here
  is a local artifact built from the working tree; `report.json` says so in its own `scope`
  field. A local green is not a Preview or production claim.

## Gotchas

- **`review-dist/` is required and is not built by `npm run dev`.** A fresh clone fails the
  suite with a build error, not a test failure. Same for `dist/` — see "Build before any
  browser suite" above; the failure reads as `setUpClass ERROR`, not as a test failure, so
  a run showing `discovered 22, run 3, errors 1` is a missing build, not a product defect.
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
  may have a newer one. CI installs the pin. Only the sync API is used, so either works,
  but a version-only difference is not a candidate regression.
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
