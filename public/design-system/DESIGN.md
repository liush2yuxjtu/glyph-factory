# 字工厂 / Glyph Factory — 设计系统

> 本文件**只做说明**，不承载任何设计数值。数值真源是 [`tokens.css`](./tokens.css)，
> 组件设计真源是 [`components.html`](./components.html)。两者冲突时以它们为准。

| | |
|---|---|
| 版本 | v3（与 `glyph-engine-v3.js` 同代） |
| 取值口径 | `public/play.html` `:root`，2026-09-20 核对 |
| 基线提交 | `7ebd57bc051ff2a3f64cfec4d339f275940e8507` |
| 覆盖范围 | 玩家面 `/play.html` + 6 个评审/文档页 |
| 不在范围 | `/product-demo`（React 页，独立样式，未纳入本系统） |

## 1. 设计意图

这是一个关于**印刷与语言演化**的增量游戏。视觉语言直接从「铅字印刷」取隐喻，三条规则撑起全部样式：

1. **纸与墨。** 底是纸（`--paper`），字与边框是墨（`--ink`），面板是未裁的白纸（`--panel`）。没有渐变装饰，没有柔光。
2. **硬投影。** 所有阴影都是零模糊的硬偏移（`--shadow-1/2/3`），像铅字压在纸上。按下去，投影消失、方块位移 `--press-shift`——触感是「按下」而不是「淡出」。
3. **直角。** 全局只有一处圆角（世界模型的 `pulse` 用 50%）。圆角在这个系统里是噪音。

第四条是**行为**规则，比三条外观规则更重要：

4. **纸夹原则（hidden → discovered → persistent）。** 未发现的系统必须完全退出版面，不能占位、不能留空壳。这条由全局 `[hidden]{display:none!important}` 强制，因为 `display:grid/flex` 会把它复活。发现之后永久保留，稀缺性永远不再隐藏一个已经发现的面。

## 2. 层级与不变量

| 层 | 文件 | 地位 |
|---|---|---|
| 设计数值 | `tokens.css` | **唯一真源**。所有色值、字阶、间距、描边、阴影、动效时长只能在这里写。 |
| 组件设计 | `components.html` | **唯一真源**。组件的结构、变体、状态、版式只能在这里写。第 1–12 节已上线，第 13–15 节为提案（标 `提案`）。 |
| 参考依据 | `references/` | 竞品/参考屏记录。只记看过的东西与它支撑的判断。 |
| 令牌预览 | `preview/index.html` | 派生层。运行时读 `tokens.css`，不复制数值。 |
| 说明 | `DESIGN.md` | 本文件。不含数值。 |
| 清单 | `manifest.json` | 包索引与校验和。 |
| 资产 | `assets/` | 无二进制资产，见其 README。 |

不变量：

- 消费层（预览、未来的 play.html）**只读**真源，不得反向覆盖。
- tweaks 先写回对应真源，再让消费层跟随。
- 一行内联 `style="color:#..."` 就是一次漂移，应当先补令牌再写样式。

## 3. 组件清单

12 组组件，全部可在 [`components.html`](./components.html) 现场看到变体与状态。

| # | 组件 | 类名 | 变体 |
|---|---|---|---|
| 1 | 报头 | `.masthead` `.brand` `.stamp` `.eyebrow` `.head-actions` | — |
| 2 | 状态行 | `.statusline` | — |
| 3 | 评审面板 | `.director` `.director-row` `.director-note` | — |
| 4 | 篇章条 | `.act-strip` `.act-chip` | `.current` `.done` |
| 5 | 指标格 | `.metrics` `.metric` | `.primary` |
| 6 | 按钮 | `button` `.primary-actions` | `.major` `.danger` `:hover` `:active` `:focus-visible` `:disabled` |
| 7 | 焦点卡 | `.aha-focus` | — |
| 8 | 世界卡 | `.world-card` `.world-visual` `.world-metrics` `.pulse` | `.stopped` |
| 9 | 面板 | `.panel` `.panel-head` | — |
| 10 | 机器卡 | `.machines` `.machine` | 可购 / 不可购 |
| 11 | 历史格 | `.aha-list` `.aha-item` | `.seen` `.active`（`.locked` 为死变体） |
| 12 | 日志 / 结局 / 页脚 | `.log` `.ending` `.footer` `.sr-only` | — |
| **13** | **幕内分段进度条** `提案` | `.act-progress` `.act-progress-track` | `.done` `.now` |
| **14** | **成就行** `提案` | `.aha-rows` `.aha-row` | `.earned` `.locked`（复活） |
| **15** | **Aha 全屏时刻** `提案` | `.aha-burst` | 单数字 / 胶囊 / 进度点 |

13–15 是 2026-09-20 依据 Mobbin 参考新增，**尚未进入 `public/play.html`**，依据见 §5 与 [`references/mobbin-2026-09.md`](./references/mobbin-2026-09.md)。

### 关键状态一览

| 状态 | 视觉 | 行为 |
|---|---|---|
| default | `--panel` 底，`--bw-line` 描边，`--shadow-1` | — |
| hover | 底变 `--green` | 仅 `:not(:disabled)` |
| active | 位移 `--press-shift`，阴影归零 | 瞬时，无 transition |
| focus-visible | `--focus-ring` 锈色环，偏移 `--focus-offset` | 键盘可达 |
| disabled | `opacity: var(--disabled-opacity)` | `cursor:not-allowed`，不响应 hover |
| hidden | `display:none !important` | 不占版面（纸夹原则） |

## 4. 审计结果

### 4.1 摘要

**审查表面 7 个 · 令牌 112 个（其中色值 40 + 提案别名 17） · 组件 15 组（12 已上线 + 3 提案） · 发现问题 6 项 · 评分 78/100**

### 4.2 命名一致性

| 问题 | 涉及 | 建议 |
|---|---|---|
| 同名令牌跨页不同值 | `--muted` `--line` `--paper` `--panel` | 以 `tokens.css` 为准，逐页并轨 |
| 同一变量名在 globals.css 里是另一种类型 | `--shadow`：play.html 是阴影，globals.css 是颜色 `#0d0d09` | 删 globals.css 的组件层；`--shadow` 标记为遗留别名 |
| 已声明未使用的令牌 | `--gold` | 删 |

### 4.3 令牌覆盖

| 类别 | 已定义 | 各页复制 `:root` | 页内硬编码色值 |
|---|---|---|---|
| 色值 | 40 | 7 个页面各 1 份 | play 47 · eli5 25 · preview 17 · aha 13 · intent 13 · 404 8 · 500 8 |
| 间距 | 14 | 0 | 内联 padding/gap 普遍写死数值 |
| 排版 | 22 | 0 | 字阶已收敛，`20px` / `13px` / `12px` / `15px` 仍是裸值 |
| 描边阴影 | 12 | 0 | 已收敛 |

> 说明：`play.html` 的 47 个颜色字面量里，9 个是 `:root` 声明本身，其余 38 个是仍需收编的真实硬编码——它们现在**都已在本包有名字**，并轨只是替换动作。

### 4.4 漂移明细

| 令牌 | play / aha / intent | preview.html | eli5-aha.html | 判定 |
|---|---|---|---|---|
| `--muted` | `#657064` | `#637063` | — | preview 漂移 |
| `--line` | `#bcc4ae` | `#bac3ad` | `#bec4b2` | 两处漂移 |
| `--paper` | `#efe9d8` | `#efe9d8` | `#f1eddf` | eli5 漂移 |
| `--panel` | `#fffaf0` | `#fffaf0` | `#fffdf5` | eli5 漂移 |

以 `#bcc4ae` 与 `#bac3ad` 为例：肉眼几乎不可分辨，但它们是两次独立取值，说明这些页面是**复制粘贴**而非引用。任何一次调色都会只改到一半页面。

### 4.5 死代码

| 位置 | 性质 | 证据 |
|---|---|---|
| `src/app/globals.css` 的组件类 | v1 印刷厂配色的僵尸层 | `.masthead` `.metric` `.bigAction` `.pixelScene` `.printer` `.upgradeCard` `.terminal` 等无任何 React 组件引用；`GameShell` 已改为 `<iframe>` |
| `src/app/page.module.css` | 死文件 | 全仓无 `import`；`/product-demo` 用的是自己的 `product-demo/page.module.css` |
| `.aha-item.locked` | 死变体 | CSS 有定义，`renderAhas()` 只赋 `seen` 与 `active`。**提案 14 `.aha-row.locked` 是它的正式归宿**，上线后本行可销 |
| `--gold: #e2bd67` | 死令牌 | `grep -c 'var(--gold)'` 在全部 js/html 中为 0 |

`globals.css` 仍被 `layout.tsx` 引入，所以它的 `body` 背景与 `box-sizing` **是生效的**；失效的只有组件类。清理时不要整文件删除。

### 4.6 可访问性

WCAG 2.1 相对亮度实算（`preview/index.html` 有活体自检）：

| 组合 | 比值 | 判定 |
|---|---|---|
| `--ink` on `--panel` | 16.05:1 | AA |
| `--ink` on `--paper` | 13.77:1 | AA |
| `--green` on `--ink`（major 按钮） | 12.75:1 | AA |
| `--log-ink` on `--ink` | 11.84:1 | AA |
| `--world-ink` on `--world-bg` | 10.48:1 | AA |
| `--danger-ink` on `--danger-bg` | 7.12:1 | AA |
| `--rust` on `--panel` | 5.46:1 | AA |
| `--muted` on `--panel` | 4.98:1 | AA |
| **`--muted` on `--paper`** | **4.27:1** | **仅 AA-large** |

其余可达性事实：按钮最小高度 `--touch` 44px；`prefers-reduced-motion:no-preference` 才启用唯一的 pulse 动画；焦点环用 `:focus-visible` 而非 `:focus`，鼠标点击不出环；`.sr-only` 提供跳转链接。

### 4.7 优先级行动

1. **把 `--muted` 压到 4.5:1 以上。** 玩家面有 8 处、`public/` 全域有 19 处辅助文字压在它上面（`var(--muted)` 引用计数）。把 `#657064` 压深到 4.5:1 即可过线，代价是次要信息更重一点。改一处 `tokens.css` 即可全局生效——前提是先完成第 2 项。
2. **并轨 7 份 `:root`。** 先做，否则改任何颜色都只改到部分页面。见 §5 的阻塞说明。
3. **清理死代码。** 删 `page.module.css`、删 `globals.css` 的组件类（保留 `body` / `box-sizing` 部分）、删 `--gold` 与 `.aha-item.locked`。
4. **收编剩余裸值。** `play.html` 还有 38 个颜色字面量与若干裸间距，可机械替换为已有令牌。

## 5. 参考与差距（2026-09-20 · Mobbin）

### 5.1 Mobbin 没有这个品类

用户要求找 Mobbin 上同类游戏的参考。**实测结论是否定的**，证据：

- Mobbin `Game UI` 屏分类（`/explore/mobile/screens/game-ui`）：59 张截图、去重 27 个 app，全是 Duolingo、KakaoBank、Khan Academy、Finch、Grab、Taobao 这类**游戏化产品**——Mobbin 的 "Game UI" 指非游戏 app 里的游戏化界面，不是游戏。
- 站内检索 AdVenture Capitalist / Cookie Clicker / Melvor Idle / Egg, Inc. / Idle Miner：**0 条**。

Mobbin 是产品/App 设计库，不覆盖增量游戏。所以这里不提供"同类游戏参考"——那只能编。

### 5.2 但它的模式分类和目标组件一一对应

| Mobbin 分类 | 本系统对应组件 | 屏量 |
|---|---|---|
| `/screens/progress` | `.act-strip` `.act-chip` | 2,200+ |
| `/screens/achievements-awards` | `.aha-list` `.aha-item` `.aha-focus` | — |
| `/ui-elements/tile` | `.metric` | 4,800+ |
| `/ui-elements/chip` `/card` `/stacked-list` | `.act-chip` `.machine` `.log` | — |
| `/ui-elements/progress-indicator` | **无** | — |
| `/screens/confetti` `/acknowledgement-success` | **无** | — |

右边两个"无"，正是下面的差距。逐屏记录与截图结构见 [`references/mobbin-2026-09.md`](./references/mobbin-2026-09.md)。

### 5.3 三个差距与提案

| # | 差距 | 参考屏 | 提案组件 |
|---|---|---|---|
| G1 | 幕内进度不可见（`.act-chip` 只有篇章名 + 数值区间） | Monarch「Getting Started」分段进度条 | `.act-progress` |
| G2 | Aha 行没有条件句/进度/分母，玩家不知道还差什么 | Duolingo Achievements 行 | `.aha-row`（并复活死变体 `.locked`） |
| G3 | Aha 触发没有视觉时刻（只有 A28 的 `.ending`） | Brightmind「Congrats!」全屏单数字 | `.aha-burst` |

三者画在 [`components.html`](./components.html) 第 13–15 节。

**提案层的纪律：零新增颜色。** 17 个提案令牌不是色值字面量，是既有令牌的别名 + 几何尺寸——提案组件增加的是**信息层次**，不是新配色。这条承诺在 `preview/index.html` 的 J 节逐条实算自检。

### 5.4 落地结果

设计出来之后才发现前提变了一次，如实记下：

**本 worktree 当时落后 `origin/main` 一个提交。** PR #14 `74bebd6`「make every Aha moment perceptible on the player surface」已经合并，它改的正是本节要改的那批文件，并加了 `AHA_WORLD`（每个 Aha 一句世界语言的公告，由 `syncAhas()` 写进玩家日志）。已在动工前 `git merge --ff-only origin/main` 同步，然后重新评估三个提案：

| 提案 | 与 #14 的关系 | 结果 |
|---|---|---|
| G1 `.act-progress` | #14 完全未覆盖 | **已落地**，玩家面 |
| G2 `.aha-row` | #14 解决了「触发时能感知」，「还差多少」仍无处可看 | **已落地**，但只在评审面 |
| G3 `.aha-burst` | #14 用世界线日志句解决了同一个问题 | **撤回**，理由见下 |

**G3 为什么撤回。** #14 选的是一条更轻的路径：Aha 触发时，日志里出现一句世界语言的公告。再叠加全屏打断，同一次 Aha 就有两套互相竞争的反馈；而且 28 次全屏在增量游戏里会变成惩罚（本文件 §9 原本就把这条列为待决）。撤回不是「没做」，是**做了取舍并留下理由**。

**G2 为什么只进评审面。** `#aha-list` 对玩家是隐藏的（它是设计语言，`player-privacy-v3.js` 整块摘掉），所以 Duolingo 式行**不能**放在那里给玩家。而把 28 条门槛做成玩家可见的清单，等于把整个「逐步发现」的游戏过程剧透掉——每行一个「还差 N」就是把探索变成待办表。所以：评审面按 Duolingo 补上进度条与分子分母（评审者需要看得懂），玩家面**只给当前阶段的进度**（G1），不给 28 条待办。

**玩家面到底加了什么。** 只有一处：游戏卡里的 `.act-progress`，回答「离下一个阶段还差多少」。文案是玩家语言（「还差 累计印字（6 / 5.0K）」），不含 A## / AHA / ACT / 机制解释——这条被 `tests/browser/test_player_source_privacy.py` 的边界正则逐帧扫描。

### 5.5 顺带修掉的一个既有泄漏

落地时发现：`glyph-game-v3.js` 里发行按钮就绪时的副标题是 `'这不是结局；它会打开 ACT II。'`——**含 "ACT II"，直接命中隐私契约的边界正则**。玩家一旦满足发行条件，玩家面上就会出现 ACT 字样。任何测试都没盖到（隐私测试只驱动到 A01，够不到发行门槛）。

已改为世界语言：`'这不是结局。你印出来的东西，会开始自己生长。'`（英文同步）。

### 5.6 门槛数字的唯一真源

G1/G2 都要「门槛」这一组数字。它们原先散在 `glyph-game-v3.js` 的 `renderActions` 里，每个动作各写一份（`cityReady` / `worldReady` / `machineReady` / `stopReady`）。进度条再抄一遍就是第三份。

现在收进 `glyph-engine-v3.js`：

- `ACT_GATES` — 每个阶段通往下一阶段的条件（字段 × 目标值 × 中英文标签）
- `AHA_GOALS` — 每条 Aha 的门槛，与 `trigger()` 同一个条件，写成可展示形式
- `gateProgress(g)` — 返回该阶段全部门槛的达成情况 + **第一条未达成项**
- `ahaGoal(g, id)` — 单条 Aha 的分子/分母

渲染层的 `cityReady` / `machineReady` / `stopReady` 已改为读 `E.gateProgress(s).done`。

**一个踩过的坑，记下来：** 绑定项最初按「进度比例最低」挑，结果刚印六个字、`lifetimeGlyphs` 到了 6/5000，提示却跳到 `presses 0/1`——因为 0/1 的比例比 6/5000 低。读起来像卡住了。改成**取第一条未达成项**：门槛是有序清单，进度条从左往右点亮，`now` 标记必须和文字说的是同一条。

## 6. 尚未完成：本包未接管运行时

**`public/play.html` 目前仍自带一份 `:root`**，值与 `tokens.css` 一致，但物理上是两份。

不直接 link 的原因：`scripts/build-static.mjs` 只把白名单文件拷进 `dist/`，`play.html` 若引用外部 CSS，**发布产物会掉色**。并轨需要同时改这个脚本，属于独立变更。在此之前：

- 改 `tokens.css` **不会**影响玩家面；
- 改 `play.html` 的 `:root` **不会**影响本包。

两边都改才是当前唯一正确的做法——这也是把它列为第 2 优先级的原因。

## 6.5 屏幕与流程（2026-09-21 并入）

[`flows.html`](./flows.html) 把 2026-09-20 那次流程审计的产物接进本包：17 个屏幕状态、6 条流程、29 个热点步骤。

它不是设计稿，是**读数**。构建链是 `screens.py`（真实浏览器逐屏读 DOM）→ `rebuild_svg.py`（按读数画 SVG），
屏幕上的块、按钮文字、启用/禁用状态、栅格列数全部来自实测。列数尤其：`grid-template-columns` 在元素隐藏时
只回报声明值、还会留下空轨道，只有数首行子元素才得到真实列数（390px 下篇章条实际是 2 列不是 3 列）。

**并入时做的是并轨。** 画谱原本自带一份 `:root`：令牌**名字**与本包相同、**数值**是另抄的——正是 §4.4 批评的
那种「复制粘贴而非引用」。现在它 link `tokens.css`，本地只留一层别名，零新增色值：

| 原画谱令牌 | 现在的值 |
|---|---|
| `--ground` | `var(--paper)` |
| `--sunk` | `var(--surface-4)` |
| `--rule` | `var(--ink)` |
| `--ok-fill` / `--ok-ink` / `--ok-line` | `var(--green)` / `var(--ink)` / `var(--ink)` |
| `--bad-fill` / `--bad-ink` / `--bad-line` | `var(--danger-bg)` / `var(--danger-ink)` / `var(--rust)` |
| `--warn-fill` / `--warn-ink` / `--warn-line` | `var(--surface-focus)` / `var(--focus-body)` / `var(--rust)` |
| `--info-fill` / `--info-ink` / `--info-line` | `var(--review-bg)` / `var(--review-note)` / `var(--blue)` |
| `--shadow` / `--shadow-soft` | `var(--shadow-3)` / `var(--shadow-1)` |
| `--mono` / `--sans` / `--serif` | `var(--font-num)` / `var(--font-ui)` / `var(--font-mark)` |

画谱自带的**两套深色主题一并删除**：系统的唯一视觉世界是纸与墨，本包任何一页都不另立一套配色。
`flows.html` 因此是 `public/` 里第一个**不自带 `:root`** 的页面——§4.3 那张「各页复制一份」的表从它开始可以往下降。

## 7. 怎么用这个包

```bash
npm run dev
# 入口        /design-system/index.html
# 组件陈列    /design-system/components.html
# 令牌预览    /design-system/preview/index.html
```

> 注意：`/design-system/` 这个**目录形式不可用**。Next 会把尾斜杠 308 到 `/design-system` 然后 404——
> `public/` 下的子目录不提供目录索引，只有写出完整文件名才命中。已实测，见 §8。

也可以直接双击 `public/design-system/index.html`——三页全部用相对路径引用，`file://` 下无需服务器。

`build-static.mjs` 不会把这些文件拷进 `dist/`，与仓库「内部评审产物不随玩家构建发布」的既有约定一致。

## 8. 运行验收（2026-09-20）

不是跑 build，而是把页面开到真实浏览器里量。基线提交 `7ebd57bc`。

| 项 | 结果 |
|---|---|
| `next dev`（Next 16.3.5 / Turbopack）三页 HTTP | 200 |
| console 错误 / 失败请求 | 0 / 0（三页 × 三档宽度） |
| `tokens.css` 真的被消费 | 三页 `--ink` 计算值均为 `#17201a` |
| 组件页区块 / 预览页色板 / 对比度行 / 间距刻度 | 12 / 40 / 13 / 10（与声明一致） |
| 「hidden 不占版面」契约 | 隐藏格宽 0，栅格实际排出 2 列 |
| 1180 / 900 / 390 三档叶子节点重叠 | 0 处 |
| 既有玩家契约回归 | `verify-player.mjs --fast` 82/82 通过 |

过程中发现并修掉两个真实缺陷：

1. **`/design-system/` 目录形式 404。** Next 把尾斜杠 308 到 `/design-system` 然后 404——`public/` 的子目录不提供目录索引。必须写完整文件名。文档与 `manifest.json` 已改。
2. **窄屏 pulse 被拉成椭圆。** 修 390px 排版时写了 `.motion>div{flex:1 1 100%}`，`.pulse` 自己也是 `div`，被一起拉伸。已改为 `:not(.pulse)` 并显式复位 `flex:0 0 70px`。**这一条断言全绿也发现不了，只有看图才看得见。**

另外两次"重叠"报警是检测器的假阳性：多行内联 `<code>` 的包围盒是并集，会与下一行的元素相交，实际字形没有碰撞。两个页面都已放大到 3× 人工确认。

证据目录：`/tmp/glyph-ds-verify/evidence-next/`（`report.json` + 三页 × 三档截图）。

> 复现命令：起 `npm run dev` 后用 Playwright 打开三页，断言 `getComputedStyle(root).getPropertyValue('--ink') === '#17201a'`。
> 注意本机 3000 端口常被另一个 checkout 的 dev server 占用，`next dev` 会自动退到 3002——**探错端口会得到一批假 404**。

## 9. 待决问题

- `--muted` 调深会不会削弱「辅助信息应该退后」的层级感？需要看一轮真实截图再定。
- `/product-demo` 是 React 页，用的是自己一套硬编码样式（`product-demo/page.module.css` 零令牌）。要不要纳入本系统？纳入意味着把 CSS Modules 改造成消费 `tokens.css`。
- `--gold` 是删掉，还是它本来打算给「工坊资金」一个专属色？删之前值得确认一次原意。
- 提案 15 `.aha-burst` 是**全屏打断**。Mobbin 的 Brightmind 范式每次达成都全屏，但 28 次全屏在增量游戏里可能变成惩罚。要不要只对「幕边界」的 Aha 全屏、其余用轻量反馈？这个需要真玩一轮才好定。
- 提案 13/14 都需要引擎侧提供"离下一幕还差多少"和"每条 Aha 还差多少"这两个数。`glyph-engine-v3.js` 目前**没有导出门槛表**（`canPublish` 是特例）。先补导出，还是渲染层硬编码？后者会把数字散进 `glyph-game-v3.js`，与本次审计批评的硬编码是同一类问题。
