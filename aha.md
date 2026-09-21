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

## Player-facing announcement

Aha 的标题与 reveal 是设计语言，玩家永远看不到：日志里的 `A## ·` 行会被隐私层剥掉。
所以每个 Aha 在触发的那一刻，世界必须用自己的语言说出一句话（`AHA_WORLD`）——
不含 ID、不含 ACT、不解释机制，只陈述世界里刚刚发生了什么。

这是「Aha 可感知」的全部依据。门槛数字自己跨过去，玩家是看不见的；一句世界线是他唯一
能注意到的东西。推论：一次真实动作最多触发一个 Aha，不允许一次点击同时说出两件事。

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

## File identity and reproducibility

`aha.md` 是唯一文字契约，`public/aha.html` 是唯一交互评审源。
`intent.md` 与 `public/intent.html` 是兼容副本，必须逐字节一致；运行
`node scripts/sync-aha-docs.mjs` 同步。不得分别维护两个方向。

## Executable acceptance matrix

| ID | 必须发生的事实 | 验证方式 |
| --- | --- | --- |
| I01 | HTML/Markdown 对 F01–F03、S01–S22 的描述一致 | 同步与完整性测试 |
| I02 | 首屏嵌套资源/动作网格没有未发现功能占用的空列 | 桌面和移动浏览器实测宽度 |
| I03 | 出售/机械键盘在零资源、刷新后保留 | 真实点击与持久化 |
| I04 | 城市在发现前不占位，发现后由单栏展开 | 真实城市与世界动作 |
| I05 | A20 数字出版明确替换实体库存；归零不会隐藏库存 | 数字出版前后、刷新 |
| I06 | 最终条件前没有停止动作；停止后所有生产动作 disabled，资源不再增长 | 点击、计时、键盘、刷新 |
| I07 | A01–A28 每个预览有独立状态不变量和真实动作效果 | 逐项状态快照及动作前后对比；A28 验证终态 |
| I08 | 验证器拒绝错位状态、空数据、失败加载与失效点击 | 故障注入负对照；不得仅检查有按钮 |
| I09 | 内部评审不写入玩家存档；播放器不暴露内部术语 | 两个 iframe、存档隔离、DOM 与可访问性树 |
| I10 | 生产产物不包含 Aha/Intent/Lab/Director 评审入口 | 真实构建白名单与 HTTP 404 |
| I11 | A01–A28 每个触发时玩家日志出现对应世界线，且它是玩家读到的最新一行 | 真实玩家构建逐条驱动 28 个动作并断言日志首行；负对照抽掉世界线后同一断言必须失败 |
| I12 | 相邻两条 Aha 之间的等待时长与判断次数都稳定，顺序不乱、不挤在同一拍，全程不少于两小时 | `node scripts/pacing.mjs`（参考对局读数）与 `tests/game-v3.test.mjs` 的节奏断言；改过门槛之后必须 `node scripts/pacing.mjs --diff tests/pacing-baseline.json` 对照基线。读法与判据见 `.claude/skills/verify/SKILL.md` 的「rhythm contract」一节 |

## Review boundary

`node scripts/build-aha-review.mjs` 生成本地 `review-dist/`：玩家 iframe 使用真实
生产产物，评审 iframe 使用同一源码的完整 Director 版本。它不是第二套游戏。
生产 `dist/` 永远不包含该评审站点；Vercel Preview 才能由专用构建入口附加它。
本地通过不等于线上预览或生产已通过，发布验收必须单独记录部署地址与 commit。

## Non-negotiable result semantics

`npm run intent-audit` 必须完整运行静态契约、玩家 Chromium/WebKit、Aha 评审
Chromium/WebKit 与负对照。任一失败、跳过、零用例、缺依赖或未执行均不算 ALL PASS。
种子存档用于状态边界覆盖，不冒充自然游玩证据；F01/F02/F03 必须执行真实动作。
不得用自动重试或放宽断言来消除失败。
