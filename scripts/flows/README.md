# flows — 屏幕与流程的内页

产出 `public/design-system/flows.html`：17 个屏幕状态、6 条流程、23 张矢量屏。
它是设计系统包的一员，**link `tokens.css`**，自己不带任何设计数值。

## 链路

```
真实对局 ──► snapshots.json ─┐
                             ├─► capture.py ─► screens.json ─┐
真实浏览器读 DOM ────────────┘                               ├─► build.py ─► flows.html
引擎的动作表 ─────────────────────► flows.mjs ─► flows.json ─┘
```

```bash
node scripts/build-static.mjs && node scripts/build-aha-review.mjs   # 两份产物：dist/ + review-dist/
node scripts/flows/snapshots.mjs > scripts/flows/snapshots.json      # 要拍哪些状态
python3 scripts/flows/capture.py                                     # 逐屏读真实 DOM
node scripts/flows/flows.mjs > scripts/flows/flows.json              # 六条流程的步骤表
python3 scripts/flows/build.py                                       # 重绘成页面
```

**四份产物全部入库**，所以 `build.py` 一条命令就能重建页面，不需要浏览器。
采集那两步需要 Playwright 和两份构建产物，不进日常构建。

> 采集脚本原来住在 gitignore 的 `test-results/audit-shots/` 里。被清掉之后整条链路就断了——
> 页面还能从旧读数重建，但**读数本身再也采不出来**。2026-09-22 把它挪进 `scripts/flows/` 并入库。

## 三份读数的真源各不相同，别混

| 文件 | 真源 | 什么时候必须重跑 |
|---|---|---|
| `snapshots.json` | 一次参考对局（`tests/pacing.mjs`）在对应时刻的真实存档 | 引擎的门槛、代价、增速改了 |
| `screens.json` | 真实 DOM 读数 | 渲染层改了（按钮、指标、文案、显隐） |
| `flows.json` | 引擎的 `COMMAND_COSTS` / `ACT_VERBS` / `EVENTS` / `ACT_GATES` + 同一局的实测 | 引擎的动作表或那一局的读数变了 |

`tests/flows-sync.test.mjs` 断言 **`flows.json` 与 `snapshots.json` 都和当场重算的逐字节一致**，
并要求每一幕的表里都有推钟动词与微事件。生成物只断言「存在」是守不住的——手写过一次，重排之后
表里留着「viral-word 送 750 读者」和「map-city 是第二章的出口」，两条都不是真的了，而所有断言全绿。

`snapshots.json` 那条是后补的：`capture.py` 是**现跑** `snapshots.mjs` 的，不读入库那份，
所以入库那份可以任意腐烂而整条链路照常工作——直到有人想「不重采、直接用入库快照重建」。

## 说明文字里，量得出来的不许手写

每屏 `<h4>` 下面那排标签由 `build.py` 的 `facts_of()` 从 `screens.json` 生成，`<!-- FACTS:xx -->`
标记少了就构建失败。`<h4>` 和 `why` 仍然手写，但那里只放解读。

手写过一轮，烂了两处，都是「一张图在说自己读数里没有的事」：P04 写着「机器面板消失」而读数里
机器卡是在的（面板在 2026-09-21 修好，标签没跟）；P07 写着「仅 1 个动作」而读数是 4 个
（推钟动词和微事件都是那之后加的）。两处都是代码评审指出来的，不是探针——几何探针量不出句子的真假。

## 为什么是重绘而不是截图

屏幕图是**矢量重绘**：可缩放、跟随纸墨调子、不背位图。画的是读数不是记忆——
每个块的有无、按钮文字、启用/禁用、指标集合、世界卡行、日志行、栅格列数全部来自 `screens.json`。

列数尤其容易画错：`getComputedStyle(el).gridTemplateColumns` 在元素隐藏时只回报**声明值**，
还会留下空轨道（`repeat(2,1fr)` 报 2 个，`328px 0px` 也报 2 个）。只有数首行子元素的 `offsetTop`
才拿得到真实列数——390px 下篇章条实际是 2 列而不是 3 列。

## 两块画布

| 视口 | 画布宽 | 说明 |
|---|---|---|
| 390×844 | 300 单位 | 玩家面 |
| 1280×900 | 620 单位 | 评审面；hero 与 below 真的是两栏 |

`build.py` 按 `layout.hero` 的实测列数选画布，不猜。

## 令牌纪律

生成器只输出 `var(--…)`，这些名字全部来自 `tokens.css`。裸色值一个都不留——
**`var()` 在 SVG 呈现属性里是有效的，但引用了不存在的令牌不会报错，只会静默回落成黑色**，
所以「页面能打开」不等于「颜色对」。改完令牌记得看一眼真实渲染。

## 模板里哪些是手写的

`template.html` 里手写的只有**判断**：每一节在说什么、为什么这件事值得看、M1–M11 当初是怎么回事。
凡是**读数**——屏幕、流程表、实测秒数——都由上面那条链路生成，模板里只留两种占位符：
`<!-- FLOW:F0N -->` 和 `<img src="shots/xx.png">`。`build.py` 遇到没读到的状态会直接报错退出，
所以「图上有」等于「那一屏真的有」；遇到没被填上的流程标记同样报错。
