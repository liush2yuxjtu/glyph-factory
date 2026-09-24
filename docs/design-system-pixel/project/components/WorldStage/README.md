舞台：当前世界尺度的 96×40 像素场景，是这次重构的核心——世界变大这件事被画出来。

- 调用：`GlyphPixel.scene(scale)`，scale 取 桌面 / 城市 / 传播网络 / 机器语言 / 世界 / 静默（或英文 DESK…）。放进 `.gp-stage`，叠加 `.gp-stage-t` 幕名与 `ActTrack`。
- 只用 `world-*`、`lamp`、`accent` 着色；幕说明文字放在舞台下方的 `.gp-copy`，不要压在场景上。
