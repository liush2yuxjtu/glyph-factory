幕进度条：每一幕一个像素段，已完成 `accent`，当前 `lamp`，未来 `sunk`。

- 调用：`GlyphPixel.actTrack(states, surface)`，states 为已到达幕的 `done` / `current` 数组。
- `surface: 'player'` 只画已到达的幕——玩家不应知道一共有几幕；`'review'` 画全部 6 段。
