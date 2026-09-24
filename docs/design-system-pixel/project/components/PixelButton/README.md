像素按钮是游戏里每一个动词的唯一形态：24px 标签 + 12px 花费行 + 24px 精灵图标。

- 调用：`GlyphPixel.button({ l: 标签, s: 副行, m: 主动词, e: 微事件, x: 不可逆, d: 不可用 })`，返回 HTML 字符串。
- 变体：默认 `panel`；`is-major` 灯绿；`is-event` 灯金并带「微事件」标签；`is-danger` 锈红外框；`is-primary` 通栏 36px（每屏最多一个）。
- 不可用：`sunk` 底、`ink-muted` 字、去掉 drop 与 bevel；副行写「还差 X（当前 / 目标）」。永远禁用，不隐藏。
- 不要：自定义颜色、圆角、18/20px 字号、同屏两个 `is-primary`。
