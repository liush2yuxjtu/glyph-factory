分段切换：一组互斥选项，选中项反白（`ink` 底 `panel` 字）。流程页和屏幕页顶部的「像素 新版 / v3 旧版」就是它。

- 调用：`GlyphPixel.toggle(name, [{ value, label }], current)` 生成，`GlyphPixel.bindToggle(root, (name, value) => …)` 绑定。
- role=radiogroup / radio，`aria-checked` 随点击更新。
