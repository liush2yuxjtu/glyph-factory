# Glyph Factory · Aha Moment Canonical Intent

## Human intent

Glyph Factory 的 Aha 不是玩家要阅读的“惊喜说明”，而是玩家在操作后发现：**原来游戏已经变成了另一种东西。**

玩家不应该看到 A01–A28、Aha、ACT 路线图、Director Mode 或未来机制说明。玩家只看到世界内成立的动作、资源、结果与空间变化。

## Canonical disclosure contract

`hidden → discovered → persistent → intentionally replaced`

1. **Hidden means absent.** 未发现的系统不渲染、不占位、不留下空列/空卡/灰锁。
2. **Discovery is behavioral.** 控件第一次真实可用、资源第一次产生、地图第一次扩张时才出现。
3. **Persistent means persistent.** 一旦发现，即使暂时缺钱/缺字/缺资源，界面仍保留，只改为 disabled 或显示需求。
4. **Replacement must be intentional.** 只有产品范式明确替代旧系统时，旧表面才能退出。

## Aha flows

### F01 · 手工 → 系统
- S01 Fresh：只有“库存文字 + 印字”。
- S02 First sale：出售首次真实可用时出现；库存归零后仍保留。
- S03 Automation：第一台机器出现后，系统成为永久工作台的一部分。

### F02 · 工坊 → 世界
- S10 Before city：world surface 不存在，hero 占满单栏。
- S11 City discovered：城市条件成立后 world surface 出现，hero 由单栏扩成双栏。
- S12 Network：地图进一步扩大，玩家通过空间尺度变化理解“工坊只是世界中的一个点”。

### F03 · 增长 → 静默
- S20 Infrastructure：语言成为基础设施，噪音/歧义成为运营资源。
- S21 Delete：删除噪音成为推进游戏的生产动作。
- S22 Stop：停止印刷只在最终条件成立后出现；执行后 `stopped=true` 且生产率为 0。

## Runtime Surface Completeness

必须独立验收：
- Fresh desktop player
- Fresh mobile player
- Act II player before world discovery
- Act III+ player after world discovery
- Discovered-but-temporarily-unavailable actions/resources
- Final stop-printing state
- Production privacy/spoiler boundary
- Preview-only Aha Lab / Director review surfaces

## Acceptance

只有所有 relevant runtime surfaces 都在真实浏览器中保持上述人类意图才 PASS。Build green、单个 renderer 正确、静态截图、单个 Aha 正确都不能代替完整 runtime verification。
