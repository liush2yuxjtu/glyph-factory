幕进度条：每一幕一个像素段，已完成 `accent`，当前 `lamp`，未来 `sunk`。

- 调用：`GlyphPixel.actTrack(states, surface)`，states 为已到达幕的 `done` / `current` 数组。
- 只用于评审面（`'review'`，画全部 6 段）。玩家面的游戏不显示幕条；`'player'` 模式只画已到达的幕，留给不受隐私层约束的场合。
