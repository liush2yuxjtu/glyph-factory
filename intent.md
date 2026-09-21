# Glyph Factory · 用户意图登记表

这份文件记**用户要什么**，原话照抄，不改写。

`aha.md` 记的是 Aha / 披露契约——**怎么实现**。这份记的是需求本身——**要实现成什么样**。
两份文件各管一头，**不再互为副本**：加产品需求改这里，改实现契约改 `aha.md`。
（在 2026-09-21 之前这两份是同一份文件的逐字节副本，那是历史遗留，已拆开。）

每条意图四栏：**原话**（用户自己怎么说的）· **操作化**（落在哪张表、哪个数上）·
**怎么验**（命令与证据路径）· **状态**。

---

## U1 · 相邻两条 Aha 之间的点击要低标准差、要好均值

> fix the clicks between different aha moments until we reach to a low std. and GOOD mean version .
> this is the baseline for yourrefrence .
> —— 2026-09-21

**操作化。** 节奏按「相邻两条 Aha 之间」读，不按幕读：幕是作者的划分，Aha 才是玩家收到的
节拍。三个单位各回答一个问题——秒（等了多久）· 决策点击（这一段有几个真判断）· 全部点击
（这一段按了多少下）。参考玩家只按屏幕上写着的东西走（`tests/pacing.mjs`），不自己拍预算，
否则量到的是机器人不是游戏。

**怎么验。** `node scripts/pacing.mjs` 六个口径全打；断言在 `tests/game-v3.test.mjs` 的
「a plain playthrough reaches the ending, and the rhythm between Aha moments holds」；
基线 `tests/pacing-baseline.json`，改门槛后用 `--diff` 对照。判据与三种坏形状见
`.claude/skills/verify/SKILL.md` 的 rhythm contract。

**状态。** 已达成。时长 CV 0.069（均值 272.8s / 标准差 18.7s）；去掉第一章教学后
决策 3.20 / 2.62、点击 3.28 / 2.68；0 逆序、0 同拍。
**「全部 27 段点击」这一口径刻意不进判定**——它量的是教程长度不是节奏，理由见 U3。

---

## U2 · 「均值好」＝至少能玩两小时

> when i say mean is good. i mean it will offer at least 2 hours time playing it .
> —— 2026-09-21

**操作化。** 读**全程秒数**，不读任何一段的平均。27 条发现各有一条会自己长的钟
（`AHA_CLOCK`：第二章读者、第四章夜间文章、第五章机器用量、第六章歧义），相邻刻度之差
按 ~280 秒写，合起来两小时。

**怎么验。** `node scripts/pacing.mjs` 报「全程 X 分钟（≥2 小时 ✓）」；断言
`totalSeconds >= 7200`。

**状态。** 已达成：122.9 分钟（7376 秒）。
已知边界：离线也累积（上限 8 小时），挂机回来的玩家会跳过一部分等待——这是放置游戏的
正常行为，不是契约漏洞；「两小时」说的是从头连续玩。

---

## U3 · 每一章都要有第一章那种可重复的手部动作

> give each new aha momement the repatable movements just like the fist aha moment. we liek this really !
> —— 2026-09-21

**操作化。** 第一章的手感是「随时有一下可按，按了世界就动」——参考对局里它每秒 2 下。
第二到六章现在没有这个：四个钟只自己涨，点击对它们的贡献最多 11%（`composed` 封顶 12 之后
只值 0.18/秒），所以按不按都是四分半，点击在第二到六章是装饰性的。
要做的是**每章一个可重复动作，直接往那一章的钟里灌**，代价随按次递增，保证被动玩仍 ≥2 小时。
设计参照见 U6。

**怎么验。** 四层，缺一层就不算：
1. **被动路径不变**：节奏断言（`npm run verify:fast`）仍全绿，全程仍 ≥7200 秒；
2. **主动路径真的更快**：参考玩家在每章用它，读数里能看到那几段秒数下降；
3. **真实可点**：浏览器契约里每章有一个可见可点的按钮，点了钟真的涨（不是只改文案）；
4. **负对照**：把递增代价去掉，2 小时地板必须被打破——否则说明这个动作没有约束力，
   「点击换时间」是假的。

**状态。** 未达成，进行中。

---

## U4 · 节奏要能被 /verify

> after job is done. add how u /verify this 游戏节奏 in good way
> —— 2026-09-21

**操作化。** 不是写一段说明，是把读数变成可复现的东西：参考玩家、报表、基线文件、
进快门的断言、以及「改完怎么对照」的流程。

**怎么验。** `.claude/skills/verify/SKILL.md` 的 rhythm contract 一节；
基线 `tests/pacing-baseline.json`；`node scripts/pacing.mjs --diff`；
可视化 `node scripts/eli5-pacing.mjs` → `public/eli5-pacing.html`。

**状态。** 已达成。

---

## U5 · 用户意图本身要单独存档、单独可验

> add how we verify user intent just like above in a new part in /verify the intent part please .
> save user intent with intent.md and intent.html
> —— 2026-09-21

**操作化。** 这份文件（`intent.md`）是用户意图的唯一真源，`public/intent.html` 是它的
可读版本；两者内容一致，但**都不是 `aha.md` 的副本**。`/verify` 里要有对应的一节，
说明每条意图怎么验、证据在哪。

**怎么验。** `tests/intent-audit.test.mjs` 断言两条：意图文档不再与 `aha.md` 逐字节相同，
且每条 U 编号在 `.md` 与 `.html` 里都在、都带「原话」与「怎么验」两栏。

**状态。** 已达成（本次）。

---

## U6 · 手感参照 Universal Paperclips

> so what does paperclip solve this ?
> —— 2026-09-21

**结论（来源见下）。** UP 不是靠「让人一直点」解决等待的——它中段同样有死时间，评测里
明说「第二小时里有一段在等 trust 升级，活跃玩法慢下来，有些玩家在这里流失」。
它解决的是**别让屏幕上只剩一个计时器**，靠三件事：

1. **每一阶段换一种基础资源和一种手部动词。** 第一阶段按「做回形针」，之后是定价/营销、
   分配无人机（Work/Think 滑杆）、配置探测器 Trust。手部动作没有消失，是**换了皮**。
2. **那个动词永远对着当前的瓶颈。** 玩家做的都是「一次小修补」：收入慢就调价、产量慢就买
   设备、设备贵就多做、多做要线材……瓶颈一个接一个被造出来。原文：系统「几乎不给你留反思
   的余地，因为它一直在生成新的活」。
3. **原来的按钮不删只降级。** 「Make Paperclip」按钮整局都在，到最后灰掉；结局还要你亲手
   按 120 下拆掉自己——手部动作的消失本身就是叙事。

**对字工厂的意思。** 我们已经有 UP 那种「每阶段一种新资源」（读者 / 文章 / 机器用量 / 歧义），
缺的正是第 1、2 条：**没有一个动词对着当阶段的瓶颈**。U3 就是补这个。

**怎么验。** 这条不是功能，是设计依据，验法是**可追溯**：U3 的每个动作都要能指回本节
三条之一，指不回去就说明是凭感觉加的。另外第 3 条（中段仍有死时间）是**反面参照**——
它说明「UP 也这样」不能当作我们四分钟空转的辩护，只能当作「别让屏幕上只剩计时器」的理由。

**状态。** 研究已完成，结论落在这里；实现见 U3。

---

## 可执行验收

| ID | 必须发生的事实 | 验证方式 |
| --- | --- | --- |
| U1 | 相邻两条 Aha 之间的秒数与点击数都稳定，顺序不乱、不挤在同一拍 | `node scripts/pacing.mjs` 六口径 + `tests/game-v3.test.mjs` 节奏断言 + `--diff tests/pacing-baseline.json` |
| U2 | 从头连续玩，全程不少于两小时 | `pacingReport().totalSeconds >= 7200`，报表里那行「≥2 小时 ✓」 |
| U3 | 第二到六章各有一个可重复动作，按了直接推进当阶段的钟；被动路径仍满足 U1/U2 | 节奏断言（被动）+ 参考玩家主动路径读数 + 浏览器真实点击 + 去掉递增代价后 2 小时地板必须被打破 |
| U4 | 节奏读数可复现、可对照、可回归 | `.claude/skills/verify/SKILL.md` rhythm contract；基线文件；`--diff` |
| U5 | 用户意图单独存档，且与 Aha 契约不再互为副本 | `tests/intent-audit.test.mjs` 的非同一性与完整性断言 |
| U6 | 设计上有据可依（不是凭感觉） | 本节列出的来源；U3 的实现要能对上三条之一 |

## 来源

- U6 结论来自对 Universal Paperclips 的公开分析：Oli Z. 的逐阶段拆解
  （<https://oliz.io/blog/2022/game-analysis-universal-paperclips/>）、
  Schmalzer 在 *Eludamos* 上的论文
  （<https://doi.org/10.7557/23.6174>）、以及一篇明确指出中段死时间的评测
  （<https://dinogame.gg/blog/universal-paperclips-review/>）。
  「每阶段一种新资源 + 中段仍有死时间」这两点三处互相印证。

## 非目标

- 不把 `intent.md` 当作实现文档；实现的真源是引擎表（`AHA_CLOCK` / `ACT_GATES` / `COMMAND_COSTS`）。
- 不为了满足某条意图去改判定口径。改口径要先改这份文件，并写清为什么。
