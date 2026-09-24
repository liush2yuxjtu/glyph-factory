字工厂的像素版视觉语言：一个夜里亮着台灯的印刷工坊，用 12px 像素格画出来。它替换 v3 的「纸与墨」直角系统，但沿用同一组色相（墨、纸、灯绿、锈红、导演蓝、灯金），所以老玩家仍认得出这是同一个游戏。

## 三条外观规则

1. **一切都在像素格上。** 中文用 `Fusion Pixel SC`（`--font-pixel`，设计尺寸 12px），只能用 12 的整数倍：`body` / `meta` 12px，`label` / `heading` 24px，`title` 36px。18px、20px 这种非整数倍会把字形糊掉——不要用。拉丁数字与幕号用 `Silkscreen`（`--font-display`：`display-num` 24px、`display-xl` 48px）。
2. **框是阴影，不是边框。** 面板和按钮用 `frame` / `frame-drop` 画 4px 外框，四个角各缺一个像素（NES 式缺角）。永远 `radius-0`，没有圆角、没有模糊阴影、没有渐变。
3. **按下就是下沉。** 可用按钮 = `frame-drop` + `bevel`（左上亮、右下暗）；`:active` 时换成 `frame` + `bevel-press` 并下移 4px。不可用 = `sunk` 底 + `ink-muted` 字 + 只有 `frame`，**永远不隐藏**（可负担性只禁用，不隐藏）。

## 一条行为规则（沿用 v3，比外观更重要）

**纸夹原则：hidden → discovered → persistent。** 玩家还没发现的系统完全不渲染——不占位、不画灰色空壳、不画「?」锁格。`ActTrack` 在玩家面只画已到达的幕，评审面才画全部 6 幕；资源条只显示已出现的资源。发现之后永久保留。

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

v3 把所有东西竖着堆成一列：报头 → 状态行 → 5 格指标 → 最多 11 个等权按钮 → 世界卡 → 机器 → 日志。像素版按「玩家下一步该看哪里」重排：

1. **HUD**：印章「字」+ 字工厂 + 营业状态 + 产速（`display-num`）。
2. **舞台 `WorldStage`**：当前世界尺度的像素场景（桌面 → 城市 → 传播网络 → 机器语言 → 世界 → 静默），幕号 + 幕名叠在天空上，`ActTrack` 压在地面上。每一幕「世界变大了」这件事第一次被**画出来**，而不只是写出来。
3. **资源条 `ResourceChip`**：图标 + 数值 + 名称。
4. **动作坞**：一个主动词（`is-primary`）→ 微事件（金色整行）→ 其余动作两列小按钮。原来 11 个等权按钮变成三层。
5. 世界指标、机器、日志、终局卡依次在下。1280px 下拆成左（舞台/资源/日志）右（动作/机器）两栏。

## 文案

- 玩家面只说世界语言：「还差 意义（12 / 30）」「花掉 库存字 30」。不出现 A##、ACT 编号解释、机制名。幕号只以罗马数字出现在 `ActTrack` 和舞台角标上。
- 花费行一律 `body` 12px `ink-muted`，格式「还差 X（当前 / 目标）」或「花掉 X N」。
- 日志第一人称观察句，句号收尾，不用感叹号，不用 emoji。

## 图标

`PixelIcon`：14 个 12×12 精灵（glyph coin reader meaning noise lamp letter press keyboard agent clock stop city trash），只能按整数倍放大（24 / 36 / 48px），`shape-rendering: crispEdges`。资源固定映射：库存文字 = glyph，工坊资金 = coin（方孔钱），读者 = reader，意义 = meaning，噪音 = noise。`assets/Icons/` 里是同一批精灵的 SVG 文件（日班配色）。不用 emoji，不用线性图标库。

## 使用组件

`components/bundle.js` 暴露 `window.GlyphPixel`：纯 HTML 字符串函数，无 React 依赖（游戏本体就是纯 JS）。`GlyphPixel.button({l, s, m, e, x, d})`、`chip(label, value)`、`actTrack(states, surface)`、`scene(scale)`、`logTerm(lines)`、`machine({n, t, d})`、`screen(reading, 'pixel' | 'classic')`、`toggle(name, options, current)` + `bindToggle(root, fn)`。样式在 `components/bundle.css`，类名前缀 `gp-`。

「流程」与「屏幕」两页是用真实浏览器读数（仓库 `scripts/flows/screens.json`、`flows.json`，17 屏 × 6 条流程）重新排版的，顶部有「像素 新版 / v3 旧版」切换，可以逐屏对比重构前后。
