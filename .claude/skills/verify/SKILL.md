---
name: verify
description: Verify Glyph Factory changes against the exact candidate SHA — launch the dev server, drive the real browser surfaces with the committed driver, run the 28-case Aha invariant/transition suite on chromium and webkit, check the action disclosure contract (affordability disables, never hides), the progression contract (an active rule must run, and its gating resource must be on screen), the Aha legibility contract (every one of A01–A28 must announce itself in the player's log) and the rhythm contract (the seconds, decision-click and raw-click gaps between consecutive Aha moments: firing order, no same-click pairs, total play time ≥ 2 hours, time CV, and — per section, never as one figure — the mean/std of the decision and click gaps, with Act I read separately as the tutorial), and capture visual and interaction evidence. Use for general verification, proving an Aha change is safe, checking the 28/28 claim, verifying an action reveal/enable change, verifying an advance() cadence / Act II progression change, verifying that an Aha is perceivable on the player surface, verifying game pacing / rhythm after a threshold, cost or gate change (two-hour play-time rebuild: tests/pacing-baseline.json), and verifying user intent itself against intent.md / public/intent.html — including the competitor-critique triage of which genre-wide faults this game does and does not have.
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

| Assertion | Why it is a contract and not taste |
|---|---|
| Firing order equals A01…A28 | The list, and the narrative behind it, are ordered. Readers, articles, machine use and noise all grow on their own, so any trigger written as "an absolute value was reached" eventually overtakes the click that was supposed to cause it. |
| No two moments on one click | The focus card shows one moment. Two on one click means one of them is announced to nobody. |
| A 0-click gap must be ≥ 60s wide, and there are at most 3 | A designed breath (the night shift writing articles, the machines adopting a glyph) is legitimate; a collision is not. |
| **Total play time ≥ 7200s** | "A good mean" is defined by the user as *at least two hours of play*. 27 gaps at ~4.5 minutes each. |
| **Time CV ≤ 0.25** | Nothing fires in five seconds and nothing parks for ten minutes. |
| **Every gap ∈ [120s, 480s]** | The floor is "this discovery was not really waited for"; the ceiling is "this stretch is idling". |
| mean gap ∈ [3, 7] decisions, over acts II–VI | Under 3 the chapter is one press per insight; over 7 the player is grinding, not discovering. |
| std ≤ 4 decisions, over acts II–VI | The number this metric exists for. |
| max gap ≤ 15 decisions, and no ACT I gap is 0 | One stretch may not carry a whole act. |
| **ACT I is the only click-heavy stretch** — exactly two gaps ≥ 100 clicks, and they are A01→A02 and A02→A03 | The tutorial is allowed to be mashing. Nothing later may be; if a third gap crosses 100 clicks, a wait has turned back into hand speed. |
| click mean ≤ 8, std ≤ 4, max ≤ 15 per gap, over acts II–VI | Where the click unit is actually meaningful. The all-sections click figure is a statement about how long the tutorial is, not about rhythm. |
| Every act ≥ 5 decisions, and all 28 fire | The 2026-09 collapse got back in through this door once already. |

**Reference numbers for the 2026-09-21 rebalance (`feat/aha-rhythm`):** 27 gaps,
**全程 122.9 分钟**, time mean 272.8s / std 18.7s / CV 0.069, range 227–321s; decisions mean
4.59 / std 5.64 overall and **3.2 / 2.6 over acts II–VI**; clicks mean 40.48 / std 131.60
overall and **3.28 / 2.68 over acts II–VI**; 0 inversions; 0 same-click pairs; 3 silent beats
(238s / 280s / 320s).

The click vector, all 27 gaps in A01…A28 order:
`493 518 4 7 0 3 7 7 1 1 3 5 5 10 6 4 1 1 1 1 4 0 5 1 0 4 1`.
The decision vector for the same run:
`26 18 3 7 0 3 6 7 1 1 3 5 5 10 6 4 1 1 1 1 4 0 5 1 0 4 1`.

Before this round: 全程 23 分钟, time mean 51.3s with a CV of ~2, 15 of the 27 gaps under
6 seconds; clicks 23.15 / 68.36 overall and 4.48 / 3.18 over acts II–VI. **So the all-sections
click figure got worse (23.15 → 40.48 mean, 68.36 → 131.60 std) while the acts-II–VI figure got
better (4.48 → 3.28 mean, 3.18 → 2.68 std).** Both statements are true and the second is the one
about rhythm — the first is the price of lengthening the tutorial so that its two gaps also sit
inside the two-hour budget. Expect this trade every time Act I's duration changes, and say which
number you are quoting.

Three things the numbers do **not** mean. ACT I is excluded from both the decision and the click
bands on purpose — it is the manual tutorial, its "decisions" are machine purchases, and a longer
tutorial inflates both spreads for reasons that have nothing to do with the later acts. The three
silent beats are not empty screens: the player can always print, sell and buy during them; what
they cannot do is *decide*, which is why the metric reads zero. And a large all-sections click
std is not by itself a defect — see the three-bullet list above for what it is and what the
legitimate levers are.

### 原始读数：一张表，六个口径

`node scripts/pacing.mjs` 默认就打全表，不需要另写脚本；`--trace` 补上「这一段花在哪些
动词上」。合起来是这样（当前 `feat/aha-rhythm` 的实测值）：

```
段        ACT   秒    决策  点击  | 这一段花在哪些动词上
A01→A02    1    247    26   493  | sell×245 print×222 buy×24 boost×1 research-auto×1
A02→A03    2    260    18   518  | sell×259 print×241 buy×17 publish×1
A03→A04    2    287     3     4  | compose-rule×3 print×1
…（27 行，A01→A02 到 A27→A28）…
A22→A23    5    280     0     0  | （等机器把字形用起来）
A25→A26    6    238     0     0  | （等歧义涨上来）
A27→A28    6    227     1     1  | stop-printing×1

口径                     n     均值     标准差     CV     最小   最大
秒   · 全部 27 段        27   272.80    18.74  0.069    227    321
秒   · 去掉第一章 25 段   25   274.36    18.51  0.067    227    321
决策 · 全部 27 段        27     4.59     5.64  1.228      0     26
决策 · 去掉第一章 25 段   25     3.20     2.62  0.820      0     10
点击 · 全部 27 段        27    40.48   131.60  3.251      0    518
点击 · 去掉第一章 25 段   25     3.28     2.68  0.816      0     10
```

六个口径不是六份读数，是同一份读数的六个面：三种单位 × 两种范围。**报数时必须说清是哪
一格**——「点击 std 131.60」和「点击 std 2.68」说的是同一局，前者是教程长度，后者是节奏。

### Act I 是唯一的旋钮

要压「点击」这一列，只有第一章能动，而唯一的旋钮是 `ACT_GATES[1]` 里那条
`lifetimeGlyphs`（发行门槛，当前 32000）。下面是五个值各实跑一遍的结果：

| 发行门槛 | A02→A03 | 全程 | 时长标准差 | 时长 CV | 点击（全部） | 点击（去第一章） |
|---|---|---|---|---|---|---|
| 14000 | 121s | 120.6 分 | 34.2s | 0.128 | 30.22 / 101.10 | 3.36 / 2.73 |
| 18000 | 153s | 121.2 分 | 29.4s | 0.109 | 32.56 / 106.48 | 3.36 / 2.73 |
| 22000 | 188s | 121.7 分 | 24.6s | 0.091 | 35.15 / 113.62 | 3.36 / 2.73 |
| 26000 | 217s | 122.2 分 | 21.4s | 0.079 | 37.19 / 120.35 | 3.24 / 2.67 |
| **32000（当前）** | 260s | 122.9 分 | **18.7s** | **0.069** | 40.48 / 131.60 | 3.28 / 2.68 |

三件事从这张表里直接读得出来，改这个旋钮之前先读一遍：

1. **五档全程都 ≥ 2 小时**（120.6–122.9 分）。两小时这条线不靠这个旋钮守，靠的是后面
   25 段的钟。
2. **「去第一章」那一列几乎不动**（点击 3.24–3.36 / 2.67–2.73）。第一章动不了后面的
   节奏——所以这是个「你要不要那个总数好看」的取舍，不是节奏问题。
3. **门槛越低，全部段点击越好看、时长越不匀**：14000 时 `A02→A03` 只有 121s，远在
   2σ 带（当前带 235–310s）之外。也就是说，压点击的代价是拿一条时长离群点去换。

当前选择是 32000（时长最匀），代价是全部段点击 40.48 / 131.60 一直难看；这是有意选的，
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
Four failure shapes to look for: a *reordering*, where a discovery that used to follow another
now precedes it (a copy change the diff will not show you); a *clumping*, where several gaps go
to 1–2 and one goes to 15+ (the 2026-09 collapse in miniature); a *shortening*, where the total
drops below two hours while every other number stays healthy — that is what happened before this
round, and no assertion in the suite caught it; and a *third heavy gap*, where a gap past Act I
crosses 100 clicks, which means a wait has become hand speed again.

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

Four review states (A16, A17, A22, A25) have **no enabled action on purpose**: the player is
waiting for a clock. They are declared explicitly in `public/aha-review-contract.js` under
`clocks`, each with the condition that says what is being waited for, and `stateErrors` fails if
a state is supposed to be a wait and is not. The reason is the disclosure contract's mirror
image: "there is nothing to click here" must never be an all-purpose excuse, so every wait has to
name its clock.


### 用户意图这一节怎么验

前几节验的是**实现**（披露契约、推进契约、Aha 可感知、节奏）。这一节验的是**需求本身**：
`intent.md` 里那六条 U 是真的做到了，还是只是写在文档里。

| 层 | 验什么 | 证据 |
|---|---|---|
| 文档 | 意图单独存档，且不是 Aha 契约的副本；每条 U 都有原话、怎么验、状态 | `tests/intent-audit.test.mjs`（非同一性 + 完整性） |
| 数值 | U1/U2 的读数 | `node scripts/pacing.mjs` + `tests/game-v3.test.mjs` 节奏断言 |
| 表面 | U3 的按钮在真实浏览器里可见、可点、真的推进当阶段的钟 | `run-browser-contracts.py player` |
| 负对照 | 把某个机制拿掉，对应断言必须变红 | 见下面每条 U 的「负对照」栏 |

**改判定口径之前先改 `intent.md`。** 反过来（先改断言让数字好看）是这份契约唯一能腐烂的方式，
所以在代码评审里看到断言松动、而 `intent.md` 没动，就该问一句。

#### 竞品批评：这三种毛病我们有没有

建 U3 之前先查了这个类型的公开批评，避免闭门造车。八处来源里能追溯到具体游戏和具体
毛病的，对照如下（**自查结果写在最后一列**）：

| 类型通病 | 谁被点名 | 反例/解法 | 字工厂自查 |
|---|---|---|---|
| **自动化抽走能动性**：解锁自动收入后「游戏在玩自己」 | 全部纯点击类；`twoaveragegamers`「automation, by definition, removes player agency」；Alharthi CHI'18 承认「重复机制可能诱发点击疲劳」 | 每阶段换一种手部动词（UP）；Automation 解锁要像升职不像开关 | **有**：第一章之后四个钟全被动，点击贡献 ≤11% |
| **均质无纹理**：一路「中等强度」，进度变成跑步机 | Clicker Heroes，`Pixel Poppers`：「a treadmill, doling out progression on longer and longer schedules... the only way to win is not to play」 | 有设计的快慢段；阈值倍率（每 25/50 翻倍）给等待可见地标 | **有**：27 段全是 273±19 秒，CV 0.069 |
| **旧动词死掉** | AdVenture Capitalist 及多数同类：新层一出，旧生成器就没意义了 | AdCap 的 Newspapers 加成其他投资；Derivative Clicker 用「买过的数量」给同层永久加成 | **有**：第一章的 印字/卖字 进第二章即死；`condense` 活到最后但只是刷钱 |
| 中后期墙 + 逼氪 | AdVenture Capitalist：后期「days or weeks between significant upgrades」，`BuzzVerdict` 认为节奏「deliberately calibrated to make that purchase attractive」 | 转生；离线收益设上限保护节奏 | **无**（本作免费、有结局、离线有 8 小时上限） |
| 事件疲劳 | AdCap：「the mechanics are identical to the main game with different art」 | —— | **无**（目前没有事件系统；这条是**别加**的依据） |
| 没有结局 → 流失 | 多数无结局的放置游戏 | Universal Paperclips 的四小时作者式结局被公认为高点 | **无**（A28 停止印刷是真结局） |
| 231 小时却毫无喜爱 | Clicker Heroes，`Eurogamer` Jon Blyth：「symptoms of loving a game, without ever feeling a scrap of fondness」 | 数字之外要有可回收的东西 | 部分：日志/世界线给了叙事回收，但没有把玩家的操作回收进叙事 |
| 加法没有减法 = 等待不是决定 | `SoloDevStack` 的 Orchard Deck：「addition with no subtraction is a wait, not a decision」；卡片收 9 次就变成下一系统的燃料 | 让产出可消耗、可转化 | **有**：四个钟只涨不消耗（歧义是唯一的例外） |

**注意这张表里有一条是「别做」**：定时事件在这个类型里有明确的反例（AdCap 事件疲劳），
所以「加事件活跃气氛」不是默认答案。多钟并行（Orchard Deck 的「几只不同速度的钟」）
比事件更契合本作：它不需要新的叙事皮肤，只需要让两件事同时在跑。

#### 已决：上面三条「有」怎么修（2026-09-21 用户拍板）

候选解法来自同一批来源，四个问题都问了用户，四条答复如下。**这份表是决定，不是菜单**；
要改先改这里，再改实现。

| 毛病 | 用户选的 | 落成什么 | 被否掉的候选与理由 |
|---|---|---|---|
| 均质（27 段全 273±19 秒） | **改成有设计的快慢** | 恢复拍 60–90 秒（每次大发现之后）· 铺垫拍 400–500 秒（幕高潮之前）· 其余 250–300 秒。**U1 的判据随之改**：`CV ≤ 0.25` → 「有快慢结构 + 跨度有界 + 无 <60 秒碎拍」 | C5 阈值地标（只改呈现，治不了根） |
| 点击不累积（点击贡献 ≤11%） | **不加手部动作，改成计划型** | 接受 Alharthi 的 playing→planning：等待期要有真正可权衡的空间 | C1 按次永久加成、C2 可储存有上限——**都否了**，所以「每章一个可重复推钟动作」这个方向不再做 |
| 旧动词死掉（印字/卖字 进第二章即死） | **换意义（Orchard Deck 式）** | 旧动作的产出变成新系统的燃料：第一章印的字成为第五章机器的训练材料 | C6 旧动作给新层加成（AdCap Newspapers 式）——被否 |
| 等待期要不要加东西 | **不加事件，用多钟并行** | Orchard Deck 的「几只不同速度的钟」：让两件事同时在跑，玩家永远至少有一件没空的事 | C3 定时事件（AdCap 事件疲劳的反例）、限时倍率、叙事微事件——都被否 |

**合并起来其实是同一件事**：均质要靠「有多条不同速度的钟在跑」来破，计划型要靠
「两条钟并行、玩家决定先推哪条」来落地。所以这一轮的实现目标可以合成一句话——

> **让每一幕同时有两条速度不同的钟在跑，玩家永远在选先推哪条；旧动作的产出变成新钟的燃料。**

推论两条，实现时别忘：
- **U1 的断言要改**（CV → 结构 + 跨度有界）。改之前先改 `intent.md`，别先松断言。
- **`intent.md` 的 U3 已被这条覆盖**（原文是「每一章都要有第一章那种可重复的手部动作」，
  用户改选「不加动作、改成计划型」）。U3 的原文是用户原话，按登记表的规矩**不改写**——
  要加一条 U7 记这次改向，或在 U3 的状态栏写明已被哪条取代。

负对照（每条都要能证伪自己）：
- 快慢结构：把曲线拉平回 CV≈0，断言仍须全绿，**但**要能指出哪一段是恢复拍、哪一段是铺垫拍——
  说不出来就说明结构是装出来的。
- 多钟并行：把第二条钟关掉，玩家在等待期应该重新变成「无事可权衡」，对应断言须变红。
- 旧动作供新层：把燃料链路断开，旧动词的点击次数必须掉下来。

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
