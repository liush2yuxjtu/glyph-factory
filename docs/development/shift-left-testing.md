# 测试左移：字工厂玩家契约

受众：开发者和设计评审者。此文档与浏览器测试录像不进入玩家部署。

## 为什么不能再只检查代码字符串

PR #4 原来的渐进揭示测试只检查源码中是否存在某个函数名、字符串或正则模式。
隐私层删除了 `#director-toggle`，而控制器的下一次 `renderText()` 仍然访问该节点。
因此首屏可能出现，下一次 500ms 定时渲染或玩家操作却会抛出空节点错误。
源码检查通过不能证明玩家能玩。

新增约束：行为变更先写能重现旧行为失败的测试，再修复，最后运行同一套发布前验证。
不要为了通过检查而吞掉控制台异常、跳过失败测试、不断重试或改成 Director 预览。

## 开发时运行

```sh
# 快速验证：既有机制测试、真实构建测试、玩家构建。无需安装应用依赖。
node scripts/verify-player.mjs --fast
# 或 npm run verify:fast

# 一次性安装浏览器测试工具
python3 -m venv .venv
. .venv/bin/activate
python -m pip install -r tests/browser/requirements.txt
python -m playwright install --with-deps chromium webkit

# 提交前：同一入口，追加真实浏览器交互
npm run verify
GLYPH_BROWSER=webkit npm run verify
```

`npm test` 保留全部 Node 回归测试。`npm run verify` 默认运行 Chromium。
浏览器、依赖缺失会失败，不会把未执行测试报告为通过。

## 必须保护的玩家契约

- 尚未发现的动作、资源、机器和地图不出现。
- 发现后的控件保留；资源耗尽时禁用，不消失；重载仍然保留。
- 清空进度同时清空发现记录；旧存档迁移保留资源；损坏或被禁用的存储不使游戏崩溃。
- 中文控件可操作，语言切换能够持久保存，窄屏没有横向溢出。
- 正常玩家的可见文本和无障碍树不显示内部 Aha 编号、导演入口或未来章节路线图。
- `?review=1&director=1` 不能把生产构建变成设计师界面，即使在 localhost 上测试。
- 点击之后、定时器之后、重载之后，都不允许未捕获脚本、控制台或网络错误。

单纯比对正则仍可用于定义文案边界，但不能代替真实 DOM、存储和操作测试。
`tests/progressive-disclosure.test.mjs` 在临时目录执行真实 builder，验证输出白名单、
旧文件清理、可解析脚本、实际事件目录剥离、源码/部署引擎行为一致、校验和与重复构建确定性。
`tests/browser/test_player.py` 使用真实的 `dist/`，不依赖外部预览地址。
`tests/browser/test_player_source_privacy.py` 以 `public/` 为静态根，覆盖 `dist/` 覆盖不到的开发服播放器表面：
构建产物被烤入 `data-audience="player"` 与 `!important` 隐藏规则，源码表面的边界只靠运行时剥离，
因此「首个 Aha 触发后、定时渲染与重载之后边界仍成立」必须单独验证。

## 防止测试本身“假绿”

每个用例有独立浏览器上下文。时钟在加载游戏前安装并暂停；用受控推进触发后续渲染。
存档夹具只安装一次，不能每次 reload 都重新注入原数据，否则无法验证持久化。
跨阶段夹具在下一次导航启动时写入，避免被旧页面的 pagehide 自动保存覆盖，且断言实际阶段。
额外的负向对照会在隔离页面重现“删除控制器依赖节点”的原始故障，确认错误检测器会拒绝它。
源码表面的隐私套件带三层：正向用例（真实首个 Aha 之后边界成立）、负向对照（还原修复前的两处代码，
要求泄漏必须复现）、保险用例（摘掉控制器闸门，要求运行时剥离仍然兜住）。只有一层正向断言不算验证。

## 验证与发布

仓库不再有 GitHub Actions。原先由 `.github/workflows/game.yml` 与
`.github/workflows/replit-localization.yml` 执行的检查，现全部由 `/verify` 在本机用同一套命令完成；
`.claude/skills/verify/SKILL.md` 保留了逐条对应表和每个阶段的真实命令。

顺序不变，只是换了执行面：快速契约验证 → 同一个 dist artifact 的 Chromium 与 WebKit 玩家测试 →
两个引擎的 Aha 套件 → `npm test` 中的预览视频时长。
Replit 适配器的那两项检查（离线夹具与公开站验收）随工作流一起删除，没有替代物：
`deploy/replit-localization/glyph-language.js` 现在没有任何自动覆盖，这是已决的选择，不是待补的缺口。
浏览器测试不配置自动重试。原先的 `Player merge gate` 汇总任务没有替代物：它就是上述阶段
在同一提交上全部通过，没有汇总入口可读，所以「没跑」等于「没过」，不存在因为没被触发而算通过的情况。
测试失败、依赖缺失或阶段未执行，一律记为未通过，不得改写为跳过。

截图、Playwright trace 和测试日志写入 `/tmp/glyph-factory-verify/<sha>/` 与 `test-results/`，
仍然不进入 Vercel 的玩家包。

部署只通过显式的 Vercel 部署发生（`vercel.json` 的 `outputDirectory: dist`，
`git.deploymentEnabled: false`，推送不会触发构建），与本地验证是两条独立路径；
READY 不代表浏览器验证通过。只有同一提交的完整门禁成功，才可标记「已验证」，
不能沿用旧提交的绿色状态。

## 发现回归时

先保存失败用例、提交 SHA 与 trace，再做最小修复。若这是既有玩法缺陷也不得偷偷删掉断言。
如测试环境不具备执行能力，明确记录“未执行”，不要写成“通过”。
