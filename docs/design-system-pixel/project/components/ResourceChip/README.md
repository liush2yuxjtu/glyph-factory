资源条单元：精灵图标 + Silkscreen 数值 + 12px 名称，放在 `sunk` 凹槽里。

- 调用：`GlyphPixel.chip(label, value)`；label 为库存文字 / 工坊资金 / 读者 / 意义 / 噪音 时自动配图标。
- 只渲染已发现的资源（纸夹原则）。数值由调用方格式化（13.6、55.8K）。
