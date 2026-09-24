字工厂的像素版视觉语言：一个夜里亮着台灯的印刷工坊，用 12px 像素格画出来。它替换 v3 的「纸与墨」直角系统，但沿用同一组色相（墨、纸、灯绿、锈红、导演蓝、灯金），所以老玩家仍认得出这是同一个游戏。

## 三条外观规则

1. **一切都在像素格上。** 中文用 `Fusion Pixel SC`（`--font-pixel`，设计尺寸 12px），只能用 12 的整数倍：`body` / `meta` 12px，`label` / `heading` 24px，`title` 36px。18px、20px 这种非整数倍会把字形糊掉——不要用。拉丁数字与幕号用 `Silkscreen`（`--font-display`：`display-num` 24px、`display-xl` 48px）。
2. **框是阴影，不是边框。** 面板和按钮用 `frame` / `frame-drop` 画 4px 外框，四个角各缺一个像素（NES 式缺角）。永远 `radius-0`，没有圆角、没有模糊阴影、没有渐变。
3. **按下就是下沉。** 可用按钮 = `frame-drop` + `bevel`（左上亮、右下暗）；`:active` 时换成 `frame` + `bevel-press` 并下移 4px。不可用 = `sunk` 底 + `ink-muted` 字 + 只有 `frame`，**永远不隐藏**（可负担性只禁用，不隐藏）。

## 一条行为规则（沿用 v3，比外观更重要）

**纸夹原则：hidden → discovered → persistent。** 玩家还没发现的系统完全不渲染——不占位、不画灰色空壳、不画「?」锁格。玩家面根本不画 `ActTrack`（幕的存在本身就是剧透），评审面画全部 6 幕；资源格只显示已出现的资源。发现之后永久保留。

## 颜色

- 地面 `bg`，面板 `panel`，凹槽 `sunk`。正文 `ink`，次要文字 `ink-muted`——两者在三种底上两个主题都 ≥4.8:1。
- `accent`（灯绿）只给**主动词**和「已完成」：每屏最多一个 `is-major` 可用按钮被抬成主按钮（`is-primary`，36px 标签）。
- `lamp`（灯金）只给**微事件**（`is-event`，带「微事件」标签）和当前幕标记。绿与金上的字一律 `on-accent`。
- `danger` / `danger-fill` / `on-danger` 只给不可逆动作（停止印刷）和噪音。
- `review` / `review-fill` 只在评审面（导演预览条）出现，玩家面禁用。
- 日志永远是深色终端：`term` 底，最新一行 `term-ink` 加闪烁光标，旧行 `term-dim`。
- 场景色 `world-*` 只在 `WorldStage` 里用。
- 焦点环：4px 实心 `ink`，偏移 8px（在 `bg` 上 12:1）。

主题：`day`（日班，纸面）为默认，`night`（夜班）为同一套结构的暗色版。页面右上角的主题切换就是日/夜开关。

## 版式（这次重构改了什么）

v3 的版面骨架保留（DOM 和 id 不变，引擎、隐私层、测试的钩子都不动），换掉的是它身上的每一层皮：

1. **HUD**：锈红印章「字」+ 字//工厂 + 营业状态 + 产速与累计（`display-num`）。
2. **资源格 `ResourceChip`**：图标 + Silkscreen 数值 + 名称；库存文字是第一格并独占一行（`accent`）。
3. **动作列表**：顺序就是引擎给的顺序——焦点顺序等于视觉顺序，不靠 CSS 重排。分层靠颜色：主动词 `accent`、微事件 `lamp`、不可逆 `danger` 外框、不可负担 `sunk` 且只禁用不隐藏。标签 24px，花费行 12px。
4. **世界舞台 `WorldStage`**：从 ACT III 起才出现（之前世界面不存在，按纸夹原则不渲染）。每个世界尺度一张像素场景：桌面 → 城市 → 传播网络 → 机器语言 → 世界 → 静默。
5. 机器、日志（最新一行 `term-ink` + 光标）、终局卡。1280px 下左右两栏。

玩家面不显示幕名、幕号与 `ActTrack`（`player-privacy-v3` 与构建脚本都会隐藏它们）；这些只在评审面出现。玩家面唯一的阶段进度是「下一个阶段」分段条。

## 文案

- 玩家面只说世界语言：「还差 意义（12 / 30）」「花掉 库存字 30」。不出现 A##、ACT 编号解释、机制名。幕号只以罗马数字出现在 `ActTrack` 和舞台角标上。
- 花费行一律 `body` 12px `ink-muted`，格式「还差 X（当前 / 目标）」或「花掉 X N」。
- 日志第一人称观察句，句号收尾，不用感叹号，不用 emoji。

## 图标

`PixelIcon`：14 个 12×12 精灵（glyph coin reader meaning noise lamp letter press keyboard agent clock stop city trash），只能按整数倍放大（24 / 36 / 48px），`shape-rendering: crispEdges`。资源固定映射：库存文字 = glyph，工坊资金 = coin（方孔钱），读者 = reader，意义 = meaning，噪音 = noise。`assets/Icons/` 里是同一批精灵的 SVG 文件（日班配色）。不用 emoji，不用线性图标库。

## 使用组件

`components/bundle.js` 暴露 `window.GlyphPixel`：纯 HTML 字符串函数，无 React 依赖（游戏本体就是纯 JS）。`GlyphPixel.button({l, s, m, e, x, d})`、`chip(label, value)`、`actTrack(states, surface)`、`scene(scale)`、`logTerm(lines)`、`machine({n, t, d})`、`screen(reading, 'pixel' | 'classic')`、`toggle(name, options, current)` + `bindToggle(root, fn)`。样式在 `components/bundle.css`，类名前缀 `gp-`。

「流程」与「屏幕」两页是用真实浏览器读数（仓库 `scripts/flows/screens.json`、`flows.json`，17 屏 × 6 条流程）重新排版的，顶部有「像素 新版 / v3 旧版」切换，可以逐屏对比重构前后。
