---
name: verify
description: Verify Glyph Factory changes against the exact candidate SHA — launch the dev server, drive the real browser surfaces with the committed driver, run the 28-case Aha invariant/transition suite on chromium and webkit, check the action disclosure contract (affordability disables, never hides), the progression contract (an active rule must run, and its gating resource must be on screen), the Aha legibility contract (every one of A01–A28 must announce itself in the player's log) and the rhythm contract (the seconds, decision-click and raw-click gaps between consecutive Aha moments: firing order, no same-click pairs, passive play time ≥ 2 hours, the three shape bounds — time CV, longest ÷ shortest, and no gap under 60s — the per-act shape itself, the four source-patching negative controls behind the act verbs / micro-events / fuel feed, and — per section, never as one figure — the mean/std of the decision and click gaps, with Act I read separately as the tutorial), and capture visual and interaction evidence. Use for general verification, proving an Aha change is safe, checking the 28/28 claim, verifying an action reveal/enable change, verifying an advance() cadence / Act II progression change, verifying that an Aha is perceivable on the player surface, verifying game pacing / rhythm after a threshold, cost or gate change (two-hour play-time rebuild: tests/pacing-baseline.json), and verifying user intent itself — the intent document is an argument ({{INTENT}}, default intent.md), never hard-coded here.
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

### `npm run intent-audit` — the canonical gate, and the two ways it has lied

`public/aha.md` ("Non-negotiable result semantics") makes `npm run intent-audit` the
authoritative acceptance run: static contract + player Chromium/WebKit + Aha
Chromium/WebKit + negative controls, with **any** failure, skip, zero-case run, missing
dependency, or stage that did not execute counting as not-ALL-PASS. It records `commit`,
`dirty`, and a `sourceSha256` over `public/ src/ scripts/ tests/ .github/ aha.md intent.md
package.json package-lock.json vercel.json` into
`test-results/intent-audit/report.json`, and its stages are, in order:
`fast` → `review-build` → `player-chromium` → `player-webkit` → `aha-chromium` →
`aha-webkit` → `diff-check`.

It runs end to end as of 2026-09-22: all seven stages PASS, 229 tests,
`test-results/intent-audit/report.json` with `status: "PASS"`.

**Both of its historical failures were the same shape — the gate aborting inside the step it
had just passed**, and both were in how it *reads* `node --test` output, never in the product:

1. **Wrong field prefix.** `verify-player.mjs` shells out to `node --test`; Node ≥ 20's spec
   reporter prints `ℹ tests 91` where the audit's parser required `# tests (\d+)`. The fast
   stage was rejected *after* passing. Fixed by accepting either prefix.
2. **ANSI colour.** The reporter wraps those lines in escape sequences, so the line no longer
   *starts* with `#` or `ℹ` and every `^`-anchored reading misses. Same symptom — "fast gate
   did not prove nonempty, unskipped success" on a run whose own log ends in `ℹ fail 0`.
   Fixed by stripping ANSI before parsing, in `scripts/intent-audit.mjs`.

Neither fix loosened the floor — a missing field is still unproven (`undefined !== 0`). The
lesson to carry: **when this gate goes red on `fast`, read `test-results/intent-audit/fast.log`
before believing it.** A formatting change looks exactly like a product failure, and twice now
it has cost a full re-run to tell them apart. The hand-run equivalent, if the gate is broken:

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

**The question this section answers is "the clicks between two Aha moments"** — how many clicks
land between discovery N and discovery N+1. There are three readouts of that gap, and the whole
skill of reading them is knowing which one answers what:

| Readout | What it answers | Where it goes wrong |
|---|---|---|
| **seconds** | How long the player waits. This is what decides whether the game is two hours long. | Nothing — it is the primary unit. |
| **decision clicks** (`decisions`) | How many real choices fit inside that wait. | Under-counts a tutorial; that is the point. |
| **clicks** (everything) | How much raw pressing the stretch costs. | **Act I makes this number meaningless on its own — read it per-section, never as one figure.** |

A per-act count answers none of them: an act can hold 40 decisions and still hand the player
five insights in five clicks and then 35 clicks of nothing.

**How to read the click unit honestly.** `clicks` counts everything including `print`, `sell`
and `toggle-auto`; `decisions` excludes those three because there is no choice in them. In
acts II–VI the two are nearly the same (the player is making decisions, not mashing). In Act I
they diverge by two orders of magnitude: the tutorial's policy is "every 500 ms tick, buy if you
can, otherwise sell, otherwise print", so its click count is ≈ **2 × its seconds** — a 250-second
tutorial costs ~500 clicks no matter how the act is designed. Consequences:

- **Report the click mean/std per section, not as one number.** All 27 gaps currently read
  mean 40.48 / std 131.60; the 25 gaps after Act I read **mean 3.28 / std 2.68**. The first pair
  is a statement about the tutorial's length, the second is a statement about the game's rhythm.
  Quoting only the first pair says the rhythm got worse when it got better.
- **Never "fix" the all-sections click std by making the reference player idle during Act I.**
  That lowers the number by changing the measuring instrument, not the game: a player with a
  working print button and nothing else to do *will* press it. The first version of this harness
  invented its own budget and reported 770 clicks in one act that a player following the
  on-screen text spends 5 on — same mistake, opposite direction.
- If the all-sections click number must come down, the lever is Act I's **mechanics** (make the
  tutorial's time pass without requiring presses — auto-sell on by default, a print cooldown),
  never its measurement. Shortening the tutorial also works and is the cheaper change; it costs
  one 2σ time outlier, since Act I's two gaps are the only ones the two-hour budget does not pin.

Two things make that measurable instead of a matter of taste:

- The engine is deterministic, so with a fixed start and a fixed policy the whole playthrough
  — and therefore all three gap vectors — is reproducible to the click.
- The policy is the game's own guidance, not a walkthrough. `tests/pacing.mjs` presses what the
  chapter calls for and, when it cannot, satisfies exactly the shortfall the engine reports in
  `commandReady().binding` — the same string a player reads on a greyed button (`还差 …`) — or
  the act-progress line (`gateProgress().binding`).

```bash
node scripts/pacing.mjs                 # 三个单位各自的 mean/std/CV，逐段表，全程时长
node scripts/pacing.mjs --unit clicks    # 逐段表只看点击那一列（默认 decisions）
node scripts/pacing.mjs --diff <json>   # compare against a saved baseline (see below)
node scripts/pacing.mjs --trace         # which verbs each gap was spent on
node scripts/pacing.mjs --json          # machine-readable, for comparing two revisions
```

**The baseline to compare against is `tests/pacing-baseline.json`** (committed; regenerate with
`node scripts/pacing.mjs --json > tests/pacing-baseline.json` only when a rebalance is the intended
change, and say so in the commit message).

`npm run verify:fast` runs the same playthrough inside the suite
(`tests/game-v3.test.mjs`, "a plain playthrough reaches the ending, and the rhythm between Aha
moments holds"), so a threshold change that wrecks the rhythm fails the fast gate as well.

下表里的**阈值**对应 `{{INTENT}}` 里那几条带数字的需求——真源在那份文档，这里只是当前读数。
改判据先改那份文档（见「用户意图」一节的唯一硬规则），再改这里的表和 `tests/` 里的断言。

| Assertion | Why it is a contract and not taste |
|---|---|
| Firing order equals A01…A28 | The list, and the narrative behind it, are ordered. Readers, articles, machine use and noise all grow on their own, so any trigger written as "an absolute value was reached" eventually overtakes the click that was supposed to cause it. |
| No two moments on one click | The focus card shows one moment. Two on one click means one of them is announced to nobody. |
| A 0-click gap must be ≥ 60s wide, and there are at most 3 | A designed breath (the night shift writing articles, the machines adopting a glyph) is legitimate; a collision is not. |
| **Total play time ≥ 7200s** | "A good mean" is defined by the user as *at least two hours of play*. Read on the **passive** path (see below). |
| **Time CV ≤ 0.45, longest ÷ shortest ≤ 6, and no gap < 60s** | Three bounds, not one. CV alone accepts 27 identical rooms, which is itself a pacing defect; CV alone also accepts a collapse (a collapse is a *larger* CV with the shortest gap heading to zero). The ratio catches "one stretch is ten times another"; the floor catches "this discovery was not really waited for". Together they say **有形状、但形状有界**. |
| mean gap ∈ [3, 7] decisions, over acts II–VI | Under 3 the chapter is one press per insight; over 7 the player is grinding, not discovering. |
| std ≤ 4 decisions, over acts II–VI | The number this metric exists for. |
| max gap ≤ 20 decisions, and no ACT I gap is 0 | One stretch may not carry a whole act. |
| **ACT I is the only click-heavy stretch** — exactly two gaps ≥ 100 clicks, and they are A01→A02 and A02→A03 | The tutorial is allowed to be mashing. Nothing later may be; if a third gap crosses 100 clicks, a wait has turned back into hand speed. |
| click mean ≤ 8, std ≤ 5, max ≤ 20 per gap, over acts II–VI | Where the click unit is actually meaningful. The all-sections click figure is a statement about how long the tutorial is, not about rhythm. |
| Every act ≥ 5 decisions, and all 28 fire | The 2026-09 collapse got back in through this door once already. |
| **Within every act of ≥ 3 gaps: the first gap is the act's shortest and the last is its longest, and tail ≥ 2 × head** | The shape is a *position* claim, not a variance claim — variance alone is satisfied by noise. Asserted separately in `tests/rhythm-structure.test.mjs` because the CV/ratio band above must **also pass when the curve is flattened**; conflating the two would make "shaped" and "bounded" the same test. |
| **Passive floor, active ceiling** | The two-hour floor is read on the **passive** run (`playthrough(E)` — presses only what the screen asks for). `node scripts/pacing.mjs` also prints the active run (`push + microEvents`), which is *shorter by design*. Reporting the active number against the two-hour floor is a false failure; reporting the passive number as "what a player experiences" is a false pass. |
| Each of the four 2026-09-21 mechanisms carries its own negative control | `tests/rhythm-structure.test.mjs` patches the engine source and re-runs: flatten ⇒ shape fails while the band passes; remove the compounding multiplier ⇒ the active path returns to the passive length; freeze the event scheduler ⇒ the wait has nothing clickable again; cut the fuel feed ⇒ act V stops tracking the old layer's output. It is not "behaviour changes if I change the code" — it is "the number moves in the direction the design claims". |

**Reference numbers, current (`feat/aha-rhythm`, 2026-09-21 节奏结构版):** 27 gaps, passive path
**全程 121.7 分钟 / 7302s**, time mean 270.0s / std 108.9s / **CV 0.403**, range 90–490s,
longest ÷ shortest 5.43; decisions mean 5.89 / std 6.58 overall and **4.60 / 3.59 over acts II–VI**;
clicks mean 41.78 / std 152.91 overall and **4.68 / 3.60 over acts II–VI**; 0 inversions;
0 same-click pairs; **1 silent beat** (288s). Active path (push + micro events):
**97.6 分钟**, 30 presses of the act verb, 22 micro-events.

The click vector, all 27 gaps in A01…A28 order:
`217 794 4 7 0 3 7 7 1 1 3 5 5 10 6 16 1 1 1 8 4 3 9 2 2 7 4`.
The decision vector for the same run:
`10 34 3 7 0 3 6 7 1 1 3 5 5 10 6 16 1 1 1 8 4 3 9 2 2 7 4`.

Two earlier revisions, for reading a diff against an old baseline. **Before the 2026-09-21 shape
change**: 全程 122.9 分钟, time mean 272.8s / std 18.7s / **CV 0.069**, range 227–321s; decisions
3.20 / 2.62 and clicks 3.28 / 2.68 over acts II–VI; 3 silent beats. **Before the whole rebalance**:
全程 23 分钟, time mean 51.3s with a CV of ~2, 15 of the 27 gaps under 6 seconds.

**A rising time CV is not automatically a regression.** 0.069 → 0.403 across the shape change was
the design: the earlier number was the high-water mark of a metric pushed to its limit, and 27
identical rooms is the defect it was hiding. Read the three bounds together and read the per-act
shape assertion, never the CV alone. The all-sections *click* figure, by contrast, is still the
one that moves for measurement reasons (see the Act I bullets above) — expect it to get worse
every time the tutorial gets longer, and say which number you are quoting.

Three things the numbers do **not** mean. ACT I is excluded from both the decision and the click
bands on purpose — it is the manual tutorial, its "decisions" are machine purchases, and a longer
tutorial inflates both spreads for reasons that have nothing to do with the later acts. The
remaining silent beat is not an empty screen: the player can always print, sell and buy during
it; what they cannot do is *decide*, which is why the metric reads zero. And a large all-sections
click std is not by itself a defect — see the three-bullet list above for what it is and what the
legitimate levers are.

**A shape assertion is not a variance assertion, and both are needed.** The per-act row in the
table above is positional — *which* gap is short and *which* is long — and it lives in a
different file from the CV band on purpose. Variance alone is satisfied by noise, and the band
alone is satisfied by 27 identical rooms; a suite with only one of them cannot tell "designed
fast-and-slow" from either failure. Their separation is also what makes the flattening control
meaningful: flatten the curve and the band must still pass while the shape must fail.

### 原始读数：一张表，六个口径

`node scripts/pacing.mjs` 默认就打全表，不需要另写脚本；`--trace` 补上「这一段花在哪些
动词上」。合起来是这样（当前 `feat/aha-rhythm` 的实测值）：

```
段        ACT   秒    决策  点击  | 这一段花在哪些动词上
A01→A02    1    109    10   217  | sell×107 print×100 buy×10
A02→A03    2    398    34   794  | sell×397 print×363 buy×31 boost×1 research-auto×1 publish×1
A03→A04    2    130     3     4  | compose-rule×3 print×1
A04→A05    2    288     7     7  | compose-rule×6 condense×1
A05→A06    2    288     0     0  | （等读者自己涨上来）
…（27 行，A01→A02 到 A27→A28）…
A16→A17    4    263    16    16  | buy×12 condense×3 editor-autonomy×1
A22→A23    5    196     3     3  | buy×3（第五章开始，产能重新有用）
A23→A24    5    334     9     9  | compress-language×5 buy×4
A27→A28    6    442     4     4  | buy×3 stop-printing×1

口径                     n     均值     标准差     CV     最小   最大
秒   · 全部 27 段        27   269.98   108.88  0.403     90    490
秒   · 去掉第一章 25 段   25   271.32   105.37  0.388     90    490
决策 · 全部 27 段        27     5.89     6.58  1.118      0     34
决策 · 去掉第一章 25 段   25     4.60     3.59  0.780      0     16
点击 · 全部 27 段        27    41.78   152.91  3.660      0    794
点击 · 去掉第一章 25 段   25     4.68     3.60  0.769      0     16

被动 121.7 分钟 → 主动 97.6 分钟（−24.1 分钟；推钟 30 下 · 微事件 22 个）
```

`--trace` 这一列现在还会告诉你在哪几段里玩家动手了。**`buy` 出现在第四章以后**是
2026-09-21 之后才有的形状：第五章的钟被旧层产能喂着，所以「回去把旧摊子做大」重新变回一个
决定。如果某次改动之后 `buy` 在 A16 之后消失了，先查那条燃料链路，别急着调节奏——那是
「旧动词死掉」这个类型病又回来了，而它在时长那一列上看不出来。

六个口径不是六份读数，是同一份读数的六个面：三种单位 × 两种范围。**报数时必须说清是哪
一格**——「点击 std 131.60」和「点击 std 2.68」说的是同一局，前者是教程长度，后者是节奏。

### Act I 是唯一的旋钮

要压「点击」这一列，只有第一章能动。**第二章以后那两个旋钮**：`ACT_GATES[1]` 里那条
`lifetimeGlyphs`（发行门槛，当前 32000）决定第一章有多长；`AHA_GOALS.A02.need`（打字员几个，
当前 3）决定第一章的**形状**（首段多短、末段多长），它是 `scripts/fit-rhythm.mjs` 搜出来的，
不是手写的。下面是发行门槛五个值各实跑一遍的结果：

| 发行门槛 | A01→A02 | A02→A03 | 全程 | 时长标准差 | 时长 CV | 点击（全部） | 点击（去第一章） |
|---|---|---|---|---|---|---|---|
| 14000 | 109s | 259s | 119.5 分 | 105.7s | 0.399 | 31.74 / 102.95 | 4.84 / 4.21 |
| 18000 | 109s | 291s | 120.0 分 | 105.8s | 0.397 | 34.00 / 114.01 | 4.76 / 3.87 |
| 22000 | 109s | 326s | 120.6 分 | 106.3s | 0.397 | 36.52 / 126.48 | 4.68 / 3.59 |
| 26000 | 109s | 355s | 121.0 分 | 107.3s | 0.400 | 38.56 / 136.94 | 4.68 / 3.79 |
| **32000（当前）** | 109s | 398s | 121.7 分 | **108.9s** | 0.403 | 41.78 / 152.91 | 4.60 / 3.59 |

三件事从这张表里直接读得出来，改这个旋钮之前先读一遍：

1. **五档全程都 ≥ 2 小时**（119.5–121.7 分），**时长 CV 也几乎不动**（0.397–0.403）。
   两小时和形状这两条线都不靠这个旋钮守，靠的是后面 25 段的阶梯。
2. **「去第一章」那一列会动，而且方向和 2026-09-21 之前相反**：现在门槛越低，后面几章
   的点击**越难看**（4.84 → 4.60）。原因在第五章——它的钟被旧层产能喂着，第一章短了，
   玩家买到的机器就少，第五章就得花更多动作去补。所以「压总点击」不再是免费的：
   它现在会真的动到后面的节奏。
3. **全部段点击那一列仍然只反映教程长度**（31.74 → 41.78），这一半结论没变。

当前选择是 32000（后 25 段最干净），代价是全部段点击 41.78 / 152.91 一直难看；这是有意选的，
理由写在上面的断言表里。要换成别的档，改完必须重跑 `npm run verify:fast`（点击断言的
`heavy` 列表会跟着变）和 `--diff`。

**怎么自己量一档而不动工作区**：门槛是写死的常量，别为了测一档去改文件再改回来——
在内存里替换源码再 eval 就行：

```js
import { readFileSync } from 'node:fs';
import { playthrough, pacingReport } from './tests/pacing.mjs';
const src = readFileSync('public/glyph-engine-v3.js', 'utf8')
  .replace('need:32000,', 'need:22000,');          // 锚点：ACT_GATES[1] 的 lifetimeGlyphs
const E = new Function(`${src}\nreturn GlyphEngineV3;`)();
const run = playthrough(E);
const d = pacingReport(E, run, 'decisions'), c = pacingReport(E, run, 'clicks');
console.log(d.secondsStd.toFixed(1), d.totalSeconds, c.mean.toFixed(2), c.std.toFixed(2));
```

换成别的旋钮（任何 `need:` / 成本 / 速率）同理：改锚点字符串，别的都不变。同一个手法
也是量「如果改成 X 会怎样」的标准做法——**先量，再决定，别先改**。

**给非工程读者看的图**：`node scripts/eli5-pacing.mjs` 生成 `public/eli5-pacing.html`
（自包含单文件，直接开）。数字全部从参考对局现算——包括上面那张五档对照表，它每次都
重跑一遍，锚点从 `ACT_GATES[1]` 自己取，所以改了门槛这张图不会静默画成「所有档都一样」。
它画的正是这条契约的核心对照：同样的 27 段，秒数图是一排平齐的柱子，点击图是两根尖峰。

**How to use it on a change.** Any edit to a threshold, cost, rate or gate moves these vectors.
Run `node scripts/pacing.mjs` and `node scripts/pacing.mjs --unit clicks` before and after, plus
`node scripts/pacing.mjs --diff tests/pacing-baseline.json` (add `--unit clicks` for the click
column — the diff's per-gap "changed" threshold is unit-aware, 4 decisions vs 50 clicks).
Five failure shapes to look for — the first four are about the numbers, the fifth is about the
machinery behind them. A *reordering*, where a discovery that used to follow another
now precedes it (a copy change the diff will not show you); a *clumping*, where several gaps go
to 1–2 and one goes to 15+ (the 2026-09 collapse in miniature); a *shortening*, where the total
drops below two hours while every other number stays healthy — that is what happened before this
round, and no assertion in the suite caught it; and a *third heavy gap*, where a gap past Act I
crosses 100 clicks, which means a wait has become hand speed again.

The fifth: **the rhythm numbers all hold while the machinery behind them has gone inert.** Since
2026-09-21 four pieces of machinery produce the shape, the floor and the texture — the act verbs
(one per act from Act II, compounding, escalating cost), the micro-event scheduler (deterministic,
keyed to `actSeconds`), the fuel feed (Act V's clock reads the old layer's `rate`), and the
ladders themselves. Each of them can be disconnected without moving a single number in the
paragraph above, because the reference player is *passive*: it never presses a verb and never
picks up an event, so a dead verb and a live one look identical in the passive report. That is
exactly why each one carries a source-patching negative control in
`tests/rhythm-structure.test.mjs`, and why the report prints the active line next to the passive
one. **If you are reviewing a diff that touches any of the four, the passive numbers are not
evidence.** Run the control suite; that is the only thing that distinguishes "the mechanism is
there" from "the mechanism is still on screen".

Two structural lessons, both worth more than any single number:

1. **Every discovery needs its own clock, and that clock must be unlocked by the discovery
   before it.** A resource that is already growing when an act starts has been silently paying
   for that act's later insights during the earlier wait, so they arrive in a burst. This is why
   `AHA_CLOCK` exists (engine, next to `AHA_GOALS`): one entry per discovery, naming the resource
   and the reading at which it fires, read by *both* `clockMet()`, which decides when the
   discovery happens, and `COMMAND_COSTS`, which decides when the button lights up. The button's
   `还差 读者 700/740` and the engine's own gate are then the same number by construction.
   Act IV's clock is literally the newsroom: `overnightArticles`, at `agents × 0.5` per second.
2. **A gate must not ask for a resource the chapter's own discoveries spend.** While Act II's
   gate demanded `meaning` on top of the meaning each discovery costs, the reference player
   accumulated the whole chapter's meaning during one passive wait and paid for the next three
   discoveries out of stock — three gaps of 1 in a row. Dropping `meaning` from that gate and
   pricing it into the discoveries themselves (reading a letter 35, coining a word 55, spreading
   one 70) took the act from `1 8 1 1 6 5 1` to `1 5 3 6 7 1 1`.

Corollary to (1): a clock that is fed by an *unbounded* quantity is not a clock. `composed`
grows forever once the rule runs, and it used to feed readership directly
(`0.35 + composed × 0.015`), so Act III's reader rate ran away to 4/s and its clock stopped
meaning anything. It is capped at twelve compositions now, and A09's "传播速度登场" is a real
multiplier on the natural rate (`× 3`) rather than a one-shot `+750` readers that skipped 750
worth of scale in a single click.

### Wait states are part of the contract, not a gap in it

Four review states (A16, A17, A22, A25) have **no action that advances the act on purpose**: the
player is waiting for a clock. They are declared explicitly in `public/aha-review-contract.js`
under `clocks`, each with the condition that says what is being waited for, and `stateErrors`
fails if a state is supposed to be a wait and is not. The reason is the disclosure contract's
mirror image: "there is nothing to click here" must never be an all-purpose excuse, so every wait
has to name its clock.

Note the wording: since 2026-09-21 these states are no longer *empty screens*. Each act from II
on renders its compounding verb, so a wait state now has something enabled on it — a thing that
shortens the wait rather than ending it. `exercise()` keys off `clocks[id]` and therefore still
skips the click, which is correct: the assertion is "this state is a wait", not "this state is
blank". Do not tighten it into "zero enabled buttons" — that is exactly the state the rhythm
work removed.


### 用户意图：这一节验的是 `{{INTENT}}`，不是这份技能里写死的需求

前几节验的是**实现**（披露契约、推进契约、Aha 可感知、节奏）。这一节验的是**需求本身**：
那个需求文档里的每一条，是真做到了，还是只是写在纸上。

**需求文档是这一节的参数，不是常量。** 调用时把它作为参数传进来：

```
/verify intent.md              # 默认
/verify INTENT=docs/roadmap.md # 换一份需求文档
{{INTENT}}                     # 参数占位符；不传就取仓库根的 intent.md
```

技能里**不许写死任何具体需求、数字或已决方案**。原因很实在：需求会变，而写进技能的那份
不会跟着变，于是验证器会继续守护一个已经被否掉的方向——比没有验证器更糟，因为它看起来
一切正常。所有「当前要验什么」的内容住在需求文档里，这一节只写**怎么验**。

#### 四层证据，缺一层就不算

| 层 | 验什么 | 证据长什么样 |
|---|---|---|
| 文档 | 需求单独存档、不与其他契约互为副本；每条都有「原话 / 怎么验 / 状态」 | `tests/intent-audit.test.mjs`（非同一性 + 完整性断言） |
| 数值 | 需求里带数字的那几条 | `node scripts/pacing.mjs` 等读数 + `tests/*.test.mjs` 里对应的断言 |
| 表面 | 需求里要求玩家能看见/能按到的东西 | 真实浏览器契约（`run-browser-contracts.py`）或 driver |
| 负对照 | 把该机制拿掉，对应断言必须变红 | 需求文档里每条自带的「负对照」栏 |

**每一条需求都要自带负对照**，否则它是不可证伪的。写法：说出「关掉什么，什么必须坏」。
说不出来的那条，要么在文档里补，要么就别声称它被验证了。

#### 竞品批评怎么查（方法，不是结论）

给一个类型做验证时，先查这个类型的公开批评，别闭门造车。做法：

1. 只收**能追溯到具体游戏和具体毛病**的批评。泛泛的「放置游戏很无聊」不进表。
   优先设计师自述、开发者复盘、同行评审论文；纯聚合站只当线索不当依据。
2. 每条批评写成一行，四列：**通病 · 谁被点名 · 反例/解法 · 我们在不在其中**。
3. 「我们在其中」的每一条，都必须对应需求文档里的一个决定（做或不做，都要写下来）。
4. **「我们不在其中」和「我们在其中」一样重要**——它同样是一条被守住的性质，也得有负对照。

查出来的表、以及由它产生的决定，**写进需求文档**（`{{INTENT}}`），不写在这里。

#### 唯一的硬规则

**改判定口径之前先改需求文档。** 反过来（先改断言让数字好看）是这套契约唯一能腐烂的方式。
代码评审里看到断言松动、而需求文档没动，就该问一句。

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

**The mirror case, added 2026-09-21: "this act does not have it" is not "you cannot afford
it".** Two commands exist only in some states — each act's compounding verb (Act I has none,
its hand speed *is* the verb) and the micro-event (nothing exists between two of them). Those
render nothing at all, and that is rule 1 of `aha.md` (*hidden means absent*), not rule 3.
The engine decides which case applies, in `COMMAND_AVAILABLE`: `commandReady()` returns
`{ available, ready, … }`, `available === false` means do not render, and `available` but not
`ready` means grey with the shortfall. Do not "fix" a missing button by making it permanent —
ask which of the two it is. `aha.md`'s disclosure contract carries the same paragraph.

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

**What is independent here, and what is not.** `rules`/`acts` are a hand-written mapping of
*which state field each Aha is gated on* and *which act it belongs to* — not an import of
`GlyphEngineV3.AHAS` — and `stateErrors` never calls `trigger()` or `clockMet()`, so an engine
whose gating logic is wrong still fails this check.

The **threshold values**, however, are read from the engine's ladder tables
(`GlyphEngineV3.READERS_LADDER` etc., 2026-09-21). They used to be a second hand copy, and that
copy had already drifted: its `A02` row said `typists 5` where the engine required 8. A second
copy of a *tuned number* is a copy that will drift; a second implementation of the *checking
logic* is the thing worth having. If you want the numbers pinned independently, pin them
against `intent.md` and `node scripts/pacing.mjs`, not against a third transcription.

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
GLYPH_BROWSER=chromium python3 scripts/run-browser-contracts.py player   # floor 19, currently 29
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
before and after (ignoring `updatedAt`, `startedAt` and `actSeconds`).

That ignore-list is the whole subtlety. The player iframe stays **live** for the entire sweep —
its own 500 ms timer keeps running and keeps autosaving — so any field the passage of time
moves will differ across the comparison. `actSeconds` (the micro-event scheduler's counter)
joined the list on 2026-09-21 for exactly that reason: without it the test fails on "the review
changed the player's save" when all that happened is the player's own clock ticking. The same
three fields are excluded inside the review page's own isolation check
(`public/aha-review-ui.js`). **When you add a save field that grows with time, add it to both
lists** — otherwise you get a red that reads like a security failure and is actually a clock.

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
- **The disclosure contract test is static, and it says nothing about the third state.**
  `affordability never hides a discovered action` reads source text. It proves reveal ≠ enable
  and that no reveal in either parsed form reads `s.glyphs`/`s.credits`; a reveal registered by
  some third form is still
  invisible to it. It does **not** prove the button actually renders visible, that
  `rememberReveal` latches it, that `enabled` is correct, or that the shortfall copy says
  the right thing. Only the seeded browser recipe above covers that, and only for the
  actions you actually seed.
- **The rhythm metric is one reference player, on the passive path.** It is a deterministic
  playthrough with a stated policy, not a distribution over players, and the policy it uses is
  the one that *never presses* an act verb or a micro-event — so the numbers above describe a
  player who ignores half of what is on screen. That is deliberate (it is what the two-hour
  floor means), but it also means the passive report is **blind to whether those mechanisms
  still work**: a dead verb and a live one produce identical passive numbers. Read the active
  line, and run `tests/rhythm-structure.test.mjs`, whenever the diff touches them. Separately:
  a 0-click beat is scored as a gap of 0 even when it lasts 200 seconds, and two revisions with
  identical gap vectors can differ in total play time — read it next to the per-act seconds
  column.
- **The shape assertion is positional, and only that.** "First gap shortest, last gap longest,
  tail ≥ 2 × head" says the fast/slow structure sits where the design put it. It does not say
  the magnitudes are *good*, that the pattern reads as intended to a player, or that a
  differently-routed playthrough shares it. Magnitudes are judgements about `{{INTENT}}`'s
  stated shape (currently `head ×0.45 / tail ×1.7`), and the only thing separating "designed"
  from "measured" is the flattening control.
- **The cadence test proves tick-equivalence, not balance.** `live ticks == one jump` says the
  rule's output is no longer lost to tick granularity. It says nothing about whether the
  resulting curves are balanced — readership is quadratic in time once `composed` grows, and
  no test bounds that. It is also why gap 1 of the playthrough opens at 217 clicks: the
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
- **`public/design-system/flows.html` is now two rebalances older than the engine.** It is
  redrawn from `scripts/flows/screens.json`, which was captured from a build before the
  2026-09-21 rebalance, so its gate tables and readings describe the previous flow (notably
  `map-city` as an Act II exit). The same rebalance added two player-facing action surfaces —
  each act's compounding verb and the micro-event — so the captured `#primary-actions` grid is
  now short by one or two buttons per act as well. Rebuilding it needs a fresh browser capture
  from a running build, which
  is not part of any committed script. Until that capture is redone, cite the engine and
  `node scripts/pacing.mjs` — not the flows page — as the current flow truth.
- **The four mechanism controls prove coupling, not tuning.** `tests/rhythm-structure.test.mjs`
  patches source and asserts the number moves in the direction the design claims — cut the fuel
  feed and Act V stops tracking the old layer, remove the multiplier and the active path returns
  to the passive length. What that establishes is *"this mechanism is load-bearing"*. It does not
  establish that the magnitudes are right, that a player perceives them, or that the verbs are
  affordable at the moments they appear. Those are `{{INTENT}}` judgements, read off
  `node scripts/pacing.mjs` and the browser suites.
- **A negative control that silently does not apply is worse than none.** `loadEngine` takes
  either a `[from, to]` pair or a transform function. The pair form checks itself — it throws if
  the anchor string is absent — which is why the multiplier control uses it. The function form
  cannot, so every transform-based control (flattening, fuel feed) begins by asserting its own
  anchor is present. **Keep that when you add one**: a control that quietly patches nothing
  leaves the suite green while proving an empty sentence.
- **No run in this session executed the Aha suite against a deployment.** Every result here
  is a local artifact built from the working tree; `report.json` says so in its own `scope`
  field. A local green is not a Preview or production claim.

## Gotchas

- **`aha.md` has a committed byte-for-byte copy at `public/aha.md`.** `tests/intent-audit.test.mjs`
  asserts the two are identical, but `verify:fast` runs the Node suite *before*
  `build-static.mjs`, so editing the canonical file without copying it fails the gate on a test
  that looks unrelated to whatever you changed — and the audit reports it as a `fast`-stage
  failure, which reads like a product regression. `cp aha.md public/aha.md` and commit both.
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

**门槛数字不要在这一节里手抄。** 这一节原来抄过一份，`A02` 那行写着打字员 5 而引擎要的是 8，
抄的那份还正是「独立验证」的那份（见 `public/aha-review-contract.js` 的头部注释）。现在凡是
要引用门槛的地方都从引擎读：Python 侧用 `_ladder()` / `_goal()`（`tests/browser/test_player.py`），
JS 侧直接读 `E.READERS_LADDER` 这类导出。要写进说明文字的，写**读法**，不写数字。

**阶梯是拟合出来的，不是手写的。** 改任何增速、代价、门槛之后，四条阶梯会失配——
重新拟合用 `node scripts/fit-rhythm.mjs`（先 `--dry` 看读数再写回）。拟合脚本和判据是分开的
两份东西：脚本负责「怎么分」，`tests/game-v3.test.mjs`（有界）与
`tests/rhythm-structure.test.mjs`（有形状 + 四条负对照）负责「分了之后算不算数」。改脚本
不要顺手改断言，改断言之前先改 `{{INTENT}}`。
