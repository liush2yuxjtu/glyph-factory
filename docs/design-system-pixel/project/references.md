# 参考：同类游戏与像素 UI

字工厂是**文字驱动、分幕改变规则**的增量游戏。下面每一项只记「从它拿了什么」。

## 同类游戏（玩法与信息架构）

| 游戏 | 拿了什么 | 落在哪里 |
|---|---|---|
| Universal Paperclips | 纯文字增量、每一阶段把「增长」重新定义；界面随阶段整块替换 | 舞台随幕换场景；`ActTrack` |
| A Dark Room | 从一个按钮开始，系统一个个「长出来」，未出现的东西不占位 | 纸夹原则；P01 只有「印字」一个按钮 |
| Kittens Game / Cookie Clicker | 资源条 + 分层的建造/研发列表；产速常驻 | HUD 产速；动作坞三层 |
| Papers, Please | 像素、纸张、印章、官僚式的冷静文案；低饱和配色 | 印章「字」；锈红 `danger`；日志语气 |

## 像素 UI 做法

| 来源 | 拿了什么 |
|---|---|
| NES / 8-bit 界面（NES.css 一类做法） | 用 box-shadow 画缺角外框（`frame`），按下 = 内阴影反转 + 下沉 |
| 16-bit RPG 对话框 | 深色终端式日志，最新行高亮 + 光标 |
| 像素中文字体实践 | 只用设计尺寸的整数倍；12px 中文字体放大 2×/3× |

## 字体

- **Fusion Pixel 12px Proportional SC**（TakWolf，SIL OFL 1.1）——泛 CJK 像素黑体，31,345 个字形，已核对覆盖游戏 17 屏全部中文。随本系统以 `fonts/FusionPixel-12px-SC.woff2` 分发，许可证见 `fonts/OFL-FusionPixel.txt`。源：github.com/TakWolf/fusion-pixel-font（经 npm `@fontsource/fusion-pixel-12px-proportional-sc@5.3.0` 取得）。
- 备选（未采用）：Ark Pixel（同作者，10/12/16px）、Zpix 最像素（许可更严）。
- **Silkscreen**（Google Fonts，OFL）——拉丁数字与幕号。

## 没做的

- 没有逐屏截取上述游戏的界面做像素级对照；参考的是它们广为人知的界面特征。
- Mobbin 上没有增量游戏品类（见仓库 `public/design-system/references/mobbin-2026-09.md` 的实测），所以这里的参考来自游戏本身而不是产品设计库。
