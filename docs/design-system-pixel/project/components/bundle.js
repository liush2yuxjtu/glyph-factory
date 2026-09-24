/* Glyph Factory Pixel — window.GlyphPixel. Plain HTML-string helpers (no React): sprites, pixel scenes,
   buttons, chips, and whole-screen renderers in two skins ("pixel" = the refactor, "classic" = v3 as shipped).
   Screen data = scripts/flows/screens.json + flows.json readings from liush2yuxjtu/glyph-factory@b1330e6. */
(function () {
  var DATA = {"screens":[{"id":"P01","name":"全新存档","note":"玩家面 · 全新存档 · 1 个动作 · 1 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"0","total":"0","actKicker":"ACT I · A01–A02","actTitle":"手工与自动化","actCopy":"先亲手印。然后让机器接管重复劳动。","worldScale":"桌面","ahaId":"A01 · NEXT","ahaTitle":"","ahaCopy":"","ahaCount":"0 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"0"}],"actions":[{"l":"印字","s":"手动生产","d":false,"m":true,"x":false,"e":false}],"machines":[],"world":[["自动化","0/s"],["委托","0/3"],["打字员","0"],["印刷机","0"]],"acts":["current"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":false,"world_on":false,"machines_on":false},{"id":"P02","name":"首次出售","note":"玩家面 · 出售首次可用 · 2 个动作 · 2 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"0","total":"1","actKicker":"ACT I · A01–A02","actTitle":"手工与自动化","actCopy":"先亲手印。然后让机器接管重复劳动。","worldScale":"桌面","ahaId":"A01 · NEXT","ahaTitle":"","ahaCopy":"","ahaCount":"0 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"0"},{"l":"工坊资金","v":"0.5"}],"actions":[{"l":"印字","s":"手动生产","d":false,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"0 资金","d":true,"m":false,"x":false,"e":false}],"machines":[],"world":[["自动化","0/s"],["委托","0/3"],["打字员","0"],["印刷机","0"]],"acts":["current"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":false,"world_on":false,"machines_on":false},{"id":"P03","name":"自动化","note":"玩家面 · 三台机器都出现 · 5 个动作 · 2 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"12.5","total":"955","actKicker":"ACT I · A01–A02","actTitle":"手工与自动化","actCopy":"先亲手印。然后让机器接管重复劳动。","worldScale":"桌面","ahaId":"A02 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"2 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"13.9"},{"l":"工坊资金","v":"4.5"}],"actions":[{"l":"印字","s":"手动生产","d":false,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"出售全部库存","s":"6.5 资金","d":false,"m":false,"x":false,"e":false},{"l":"研发复写纸","s":"已完成","d":true,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"还差 20 库存字（13.9）","d":true,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"9 × +0.5/s · 70 资金","d":true},{"n":"夜班打字员","t":"4 × +2/s · 88 资金","d":true}],"world":[["自动化","12.5/s"],["委托","0/3"],["打字员","4"],["印刷机","0"]],"acts":["current"],"log":["› 自动售货台研发完成。","· 购入夜班打字员。","· 购入机械键盘。","· 复写纸研发完成。"],"ending":false,"director":false,"world_on":false,"machines_on":true},{"id":"P04","name":"ACT II · 字开始生长","note":"玩家面 · 推钟动词与微事件首次出现，世界面仍未出现 · 9 个动作 · 5 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"134","total":"88.2K","actKicker":"ACT II · A03–A11","actTitle":"字开始生长","actCopy":"关系、读者、意义和噪音，都开始成为机器。","worldScale":"城市","ahaId":"A05 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"5 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"55.8K"},{"l":"工坊资金","v":"309.5"},{"l":"读者","v":"218"},{"l":"意义","v":"12"},{"l":"噪音","v":"34.4"}],"actions":[{"l":"发行新一期","s":"还差 意义（12 / 30）","d":true,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"一封没署名的信","s":"花掉 库存字 30","d":false,"m":false,"x":false,"e":true},{"l":"印字","s":"旧玩法还在，但意义开始改变。","d":false,"m":true,"x":false,"e":false},{"l":"刻模：木 + 木 → 林","s":"已刻 81 条 · 读者 +0.18/秒","d":false,"m":false,"x":false,"e":false},{"l":"压缩 20 字 → 12 意义","s":"字数开始变成意义。","d":false,"m":false,"x":false,"e":false},{"l":"删除噪音","s":"还差 纸张危机（0 / 1）","d":true,"m":false,"x":false,"e":false},{"l":"出售全部库存","s":"27.9K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"20 × +0.5/s · 1743 资金","d":true},{"n":"夜班打字员","t":"14 × +2/s · 2181 资金","d":true},{"n":"小型印刷机","t":"8 × +12/s · 1819 资金","d":true}],"world":[["读者","218"],["需求","1.4"],["组合字","81"],["已删除噪音","0"]],"acts":["done","current"],"log":["› 有人愿意用一千个废字的价钱，换一句重要的话。","· 刻模成功：木 + 木 → 林。","· 刻模成功：木 + 木 → 林。","· 刻模成功：木 + 木 → 林。"],"ending":false,"director":false,"world_on":false,"machines_on":true},{"id":"P05","name":"ACT III · 城市","note":"玩家面 · 城市地图在这一幕才画得出来，hero 展开双栏 · 6 个动作 · 5 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"134","total":"362.8K","actKicker":"ACT III · A12–A15","actTitle":"文字改变城市","actCopy":"文字不再是库存，而开始改变社会。","worldScale":"城市","ahaId":"A12 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"12 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"196.4K"},{"l":"工坊资金","v":"65.3K"},{"l":"读者","v":"2.4K"},{"l":"意义","v":"4.3"},{"l":"噪音","v":"209.4"}],"actions":[{"l":"张贴告示","s":"还差 意义（4.3 / 30）","d":true,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"观察一个新方言","s":"还差 意义（4.3 / 40）","d":true,"m":false,"x":false,"e":false},{"l":"展开城市地图","s":"还差 意义（4.3 / 40）","d":true,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"98.2K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"20 × +0.5/s · 1743 资金","d":false},{"n":"夜班打字员","t":"14 × +2/s · 2181 资金","d":false},{"n":"小型印刷机","t":"8 × +12/s · 1819 资金","d":false}],"world":[["街区","2"],["概念","0"],["社会变化","0"],["地图范围","城市"]],"acts":["done","done","current"],"log":["› 隔着两条街，同一个字已经不是同一个意思了。","· 地图摊开在桌上：你终于看见了工坊外面的部分。","· 删掉一句废话，剩下的那句就贵了。删除第一次成为生产。","· 纸不够了。再提高产量只会更糟——现在要比的是每张纸上写了什么。"],"ending":false,"director":false,"world_on":true,"machines_on":true},{"id":"P06","name":"ACT IV · 机器开始写","note":"玩家面 · 数字出版让库存指标退场 · 8 个动作 · 4 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"190.5","total":"713.2K","actKicker":"ACT IV · A16–A21","actTitle":"机器开始写","actCopy":"把判断交出去，再把“创造代理”的权力交出去。","worldScale":"传播网络","ahaId":"A20 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"20 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"21.1K"},{"l":"读者","v":"33.7K"},{"l":"意义","v":"2.4K"},{"l":"噪音","v":"933.1"}],"actions":[{"l":"让 智能体 加班","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"一份没人署名的退稿","s":"花掉 意义 60","d":false,"m":false,"x":false,"e":true},{"l":"给编辑 智能体 否决权","s":"它可以拒绝你的头条。","d":true,"m":false,"x":false,"e":false},{"l":"允许 智能体 创建 智能体","s":"委托变成自我扩张。","d":false,"m":true,"x":false,"e":false},{"l":"切换数字出版","s":"实体库存开始退出舞台。","d":true,"m":false,"x":false,"e":false},{"l":"用档案训练机器","s":"还差 夜间文章（3.8K / 8.6K）","d":true,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"25 × +0.5/s · 7527 资金","d":false},{"n":"夜班打字员","t":"17 × +2/s · 5731 资金","d":false},{"n":"小型印刷机","t":"12 × +12/s · 7394 资金","d":false}],"world":[["智能体","17.8"],["智能体工厂","2"],["自动文章","3.8K"],["档案记忆","0"]],"acts":["done","done","done","current"],"log":["› 书不再堆在仓库里。库存这个概念开始过时了。","· 你不在的时候，系统也没有停。第二天早上，文章已经堆满了桌子。","· Agent 开始自己招募 Agent。工厂在扩张自己。","· 编辑 Agent 退回了你今天的头条：「这条不该发。」"],"ending":false,"director":false,"world_on":true,"machines_on":true},{"id":"P07","name":"ACT V · 机器语言","note":"玩家面 · 动作最少的一幕 · 4 个动作 · 4 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"236","total":"869.7K","actKicker":"ACT V · A22–A24","actTitle":"机器语言","actCopy":"系统开始创造人类没有设计过的符号。","worldScale":"机器语言","ahaId":"A23 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"23 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"56.0K"},{"l":"读者","v":"68.1K"},{"l":"意义","v":"10.2K"},{"l":"噪音","v":"14.9K"}],"actions":[{"l":"喂机器一批文本","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"语义压缩","s":"100意义 → 10,000压缩意义","d":false,"m":true,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"28 × +0.5/s · 18110 资金","d":false},{"n":"夜班打字员","t":"21 × +2/s · 20782 资金","d":false},{"n":"小型印刷机","t":"15 × +12/s · 21170 资金","d":false}],"world":[["机器字形","1"],["机器使用","12.4K"],["已压缩意义","0"],["人类意义","10.2K"]],"acts":["done","done","done","done","current"],"log":["› 机器之间的对话，已经不再需要翻译成人话。","· 购入夜班打字员。","· 购入小型印刷机。","· 购入机械键盘。"],"ending":false,"director":false,"world_on":true,"machines_on":true},{"id":"P08","name":"ACT VI · 终局条件成立","note":"玩家面 · 最后一个按钮出现 · 7 个动作 · 4 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"280","total":"1.1M","actKicker":"ACT VI · A25–A28","actTitle":"从增长到沉默","actCopy":"优化目标从“制造更多”翻转成“删除噪音”。","worldScale":"世界","ahaId":"A27 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"27 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"135.6K"},{"l":"读者","v":"134.1K"},{"l":"意义","v":"22.2K"},{"l":"噪音","v":"45.2K"}],"actions":[{"l":"投产一条新语法","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"切换自动出售","s":"关闭","d":false,"m":false,"x":false,"e":false},{"l":"一句没有人认领的句子","s":"花掉 意义 120","d":false,"m":false,"x":false,"e":true},{"l":"删除噪音","s":"一次删除250噪音。","d":false,"m":true,"x":false,"e":false},{"l":"消解 25 歧义","s":"清晰度变成一种资源。","d":false,"m":false,"x":false,"e":false},{"l":"停止印刷","s":"还差 歧义（2.2K / 4.8K）","d":true,"m":false,"x":true,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"32 × +0.5/s · 58388 资金","d":false},{"n":"夜班打字员","t":"24 × +2/s · 54615 资金","d":false},{"n":"小型印刷机","t":"18 × +12/s · 60616 资金","d":false}],"world":[["基础设施","开启"],["歧义","2.2K"],["已删除","1.0K"],["已压缩意义","50.0K"]],"acts":["done","done","done","done","done","current"],"log":["› 目标翻过来了：不再是写更多，而是删掉更多。","· 购入机械键盘。","· 购入小型印刷机。","· 购入夜班打字员。"],"ending":false,"director":false,"world_on":true,"machines_on":true},{"id":"P09","name":"停止印刷之后","note":"玩家面 · 终局：全部动作禁用 · 4 个动作 · 4 项可见指标","surface":"player","viewport":"390x844","status":"营业中","rate":"0","total":"1.2M","actKicker":"ACT VI · A25–A28","actTitle":"从增长到沉默","actCopy":"优化目标从“制造更多”翻转成“删除噪音”。","worldScale":"静默","ahaId":"A28 · 已发生","ahaTitle":"","ahaCopy":"","ahaCount":"28 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"231.6K"},{"l":"读者","v":"172.0K"},{"l":"意义","v":"29.9K"},{"l":"噪音","v":"62.8K"}],"actions":[{"l":"删除噪音","s":"一次删除250噪音。","d":true,"m":true,"x":false,"e":false},{"l":"消解 25 歧义","s":"清晰度变成一种资源。","d":true,"m":false,"x":false,"e":false},{"l":"停止印刷","s":"已完成","d":true,"m":false,"x":true,"e":false},{"l":"交付街角委托","s":"20 → 20","d":true,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"33 × +0.5/s · 78240 资金","d":false},{"n":"夜班打字员","t":"25 × +2/s · 75369 资金","d":false},{"n":"小型印刷机","t":"19 × +12/s · 86074 资金","d":false}],"world":[["基础设施","开启"],["歧义","4.8K"],["已删除","1.0K"],["已压缩意义","50.0K"]],"acts":["done","done","done","done","done","current"],"log":["› 车间安静下来。第一次，没有新的字被造出来。","· 世界已经写完了。现在，去读它。","· 购入小型印刷机。","· 购入机械键盘。"],"ending":true,"director":false,"world_on":true,"machines_on":true},{"id":"R01","name":"A01 · ACT I","note":"评审面 · 导演态 A01 · 6 个动作 · 5 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 1/6 · DIRECTOR PREVIEW","rate":"0.5","total":"10","actKicker":"ACT I · A01–A02","actTitle":"手工与自动化","actCopy":"先亲手印。然后让机器接管重复劳动。","worldScale":"DESK","ahaId":"A01 · 已发生","ahaTitle":"机器替我按按钮","ahaCopy":"我的工作不是点，是设计增长。","ahaCount":"1 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"0.2"},{"l":"工坊资金","v":"0"},{"l":"读者","v":"0"},{"l":"意义","v":"0"},{"l":"噪音","v":"0"}],"actions":[{"l":"印字","s":"手动生产","d":false,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"0 资金","d":true,"m":false,"x":false,"e":false},{"l":"研发复写纸","s":"还差 45 资金（0）","d":true,"m":false,"x":false,"e":false},{"l":"研发自动出售","s":"还差 60 资金（0）","d":true,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"还差 20 库存字（0.2）","d":true,"m":false,"x":false,"e":false},{"l":"发行《明日》","s":"还差 库存 200 字 + 300 资金（0.2 / 0）","d":true,"m":true,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"1 × +0.5/s · 7 credits","d":true},{"n":"夜班打字员","t":"0 × +2/s · 24 credits","d":true},{"n":"小型印刷机","t":"0 × +12/s · 110 credits","d":true}],"world":[["AUTO / 自动","0.5/s"],["CONTRACTS / 委托","0/3"],["TYPISTS / 打字员","0"],["PRESSES / 印刷机","0"]],"acts":["current","future","future","future","future","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"R02","name":"A03 · ACT II","note":"评审面 · 导演态 A03 · 11 个动作 · 5 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 2/6 · DIRECTOR PREVIEW","rate":"19.5","total":"32.0K","actKicker":"ACT II · A03–A11","actTitle":"字开始生长","actCopy":"关系、读者、意义和噪音，都开始成为机器。","worldScale":"CITY","ahaId":"A03 · 已发生","ahaTitle":"木 + 木 → 林","ahaCopy":"字与字之间的关系，也能做成机器。","ahaCount":"3 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"5.0K"},{"l":"工坊资金","v":"20.0K"},{"l":"读者","v":"20"},{"l":"意义","v":"3.0K"},{"l":"噪音","v":"0"}],"actions":[{"l":"发行新一期","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"一封没署名的信","s":"花掉 库存字 30","d":false,"m":false,"x":false,"e":true},{"l":"印字","s":"旧玩法还在，但意义开始改变。","d":false,"m":true,"x":false,"e":false},{"l":"刻模：木 + 木 → 林","s":"还差 读者（20.1 / 65）","d":true,"m":false,"x":false,"e":false},{"l":"压缩 20 字 → 12 意义","s":"还差 读者（20.1 / 217）","d":true,"m":false,"x":false,"e":false},{"l":"打开一封读者来信","s":"还差 读者（20.1 / 521）","d":true,"m":false,"x":false,"e":false},{"l":"允许读者造一个新词","s":"还差 读者来信（0 / 1）","d":true,"m":false,"x":false,"e":false},{"l":"让这个词传播","s":"还差 自造词（0 / 1）","d":true,"m":false,"x":false,"e":false},{"l":"删除噪音","s":"还差 noise（0 / 1）","d":true,"m":false,"x":false,"e":false},{"l":"出售全部库存","s":"2.5K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["READERS / 读者","20"],["DEMAND / 需求","1"],["COMPOSED / 组合字","0"],["DELETED / 已删噪音","0"]],"acts":["done","current","future","future","future","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"R03","name":"A12 · ACT III","note":"评审面 · 导演态 A12 · 9 个动作 · 5 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 3/6 · DIRECTOR PREVIEW","rate":"19.5","total":"32.0K","actKicker":"ACT III · A12–A15","actTitle":"文字改变城市","actCopy":"文字不再是库存，而开始改变社会。","worldScale":"CITY","ahaId":"A12 · 已发生","ahaTitle":"街区长出方言","ahaCopy":"同一个字，在不同地方不再同义。","ahaCount":"13 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"5.0K"},{"l":"工坊资金","v":"1.0M"},{"l":"读者","v":"200.0K"},{"l":"意义","v":"5.0K"},{"l":"噪音","v":"10"}],"actions":[{"l":"张贴告示","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"墙上被人抄走的一句话","s":"花掉 意义 40","d":false,"m":false,"x":false,"e":true},{"l":"观察一个新方言","s":"再观察一个街区。","d":false,"m":false,"x":false,"e":false},{"l":"创造一个概念","s":"花50意义，让一个概念进入社会。","d":false,"m":false,"x":false,"e":false},{"l":"展开城市地图","s":"工坊不再是全部世界。","d":true,"m":true,"x":false,"e":false},{"l":"把地图缩到世界","s":"还差 概念（0 / 2）","d":true,"m":false,"x":false,"e":false},{"l":"上线记者 Agent","s":"还差 地图范围（1 / 2）","d":true,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"2.5K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["DISTRICTS / 街区","2"],["CONCEPTS / 概念","0"],["EFFECTS / 社会变化","0"],["SCALE / 地图","CITY"]],"acts":["done","done","current","future","future","future"],"log":["› 地图展开了。你的工坊在里面，只是一个小方块。","· A14 · 城市地图出现：工坊原来只是世界里的一个点。","· 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"R04","name":"A16 · ACT IV","note":"评审面 · 导演态 A16 · 9 个动作 · 5 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 4/6 · DIRECTOR PREVIEW","rate":"19.5","total":"32.0K","actKicker":"ACT IV · A16–A21","actTitle":"机器开始写","actCopy":"把判断交出去，再把“创造代理”的权力交出去。","worldScale":"NETWORK","ahaId":"A16 · 已发生","ahaTitle":"记者 Agent 自己选题","ahaCopy":"我已经不是作者了。","ahaCount":"16 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"5.0K"},{"l":"工坊资金","v":"1.0M"},{"l":"读者","v":"200.0K"},{"l":"意义","v":"50.0K"},{"l":"噪音","v":"10"}],"actions":[{"l":"让 Agent 加班","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"一份没人署名的退稿","s":"花掉 意义 60","d":false,"m":false,"x":false,"e":true},{"l":"给编辑 Agent 否决权","s":"还差 夜间文章（0.2 / 131）","d":true,"m":false,"x":false,"e":false},{"l":"允许 Agent 创建 Agent","s":"还差 夜间文章（0.2 / 263）","d":true,"m":true,"x":false,"e":false},{"l":"切换数字出版","s":"还差 夜间文章（0.2 / 3.8K）","d":true,"m":false,"x":false,"e":false},{"l":"用档案训练机器","s":"还差 夜间文章（0.2 / 8.6K）","d":true,"m":false,"x":false,"e":false},{"l":"检查未知字形 ◫","s":"还差 档案记忆（0 / 4）","d":true,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"2.5K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["AGENTS","1"],["AGENT FACTORIES","0"],["AUTO ARTICLES","0"],["ARCHIVES / 记忆","0"]],"acts":["done","done","done","current","future","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"R05","name":"A22 · ACT V","note":"评审面 · 导演态 A22 · 5 个动作 · 4 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 5/6 · DIRECTOR PREVIEW","rate":"19.5","total":"32.0K","actKicker":"ACT V · A22–A24","actTitle":"机器语言","actCopy":"系统开始创造人类没有设计过的符号。","worldScale":"MACHINE","ahaId":"A22 · 已发生","ahaTitle":"出现一个你没造过的字","ahaCopy":"这个字，不是我造的。","ahaCount":"22 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"1.0M"},{"l":"读者","v":"200.0K"},{"l":"意义","v":"100.7"},{"l":"噪音","v":"11.7"}],"actions":[{"l":"喂机器一批文本","s":"还差 库存字（5.0K / 40.0K）","d":true,"m":true,"x":false,"e":false},{"l":"一段对不上的话","s":"花掉 库存字 500","d":false,"m":false,"x":false,"e":true},{"l":"语义压缩","s":"还差 机器用量（13.2 / 12.3K）","d":true,"m":true,"x":false,"e":false},{"l":"让语言接管基础设施","s":"还差 意义（100.7 / 400）","d":true,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["MACHINE GLYPHS","1"],["MACHINE USE","13"],["COMPRESSED","0"],["HUMAN MEANING","101"]],"acts":["done","done","done","done","current","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"R06","name":"A28 · 终局","note":"评审面 · 导演态 A28 · 4 个动作 · 4 项可见指标","surface":"review","viewport":"390x844","status":"营业中 · ACT 6/6 · DIRECTOR PREVIEW","rate":"0","total":"32.0K","actKicker":"ACT VI · A25–A28","actTitle":"从增长到沉默","actCopy":"优化目标从“制造更多”翻转成“删除噪音”。","worldScale":"SILENCE","ahaId":"A28 · 已发生","ahaTitle":"最后一个按钮：停止印刷","ahaCopy":"最后一个动作不是生产，是停止——增长到此为止。","ahaCount":"28 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"工坊资金","v":"1.0M"},{"l":"读者","v":"200.0K"},{"l":"意义","v":"100"},{"l":"噪音","v":"50"}],"actions":[{"l":"删除噪音","s":"一次删除250噪音。","d":true,"m":true,"x":false,"e":false},{"l":"消解 25 歧义","s":"清晰度变成一种资源。","d":true,"m":false,"x":false,"e":false},{"l":"停止印刷","s":"已完成","d":true,"m":false,"x":true,"e":false},{"l":"交付街角委托","s":"20 → 20","d":true,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["INFRA / 基础设施","ON"],["AMBIGUITY / 歧义","4.8K"],["DELETED / 删除","1.0K"],["COMPRESSED","50.0K"]],"acts":["done","done","done","done","done","current"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":true,"director":true,"world_on":true,"machines_on":true},{"id":"D01","name":"ACT IV · 1280","note":"评审面 · 桌面构图 D01 · 9 个动作 · 5 项可见指标","surface":"review","viewport":"1280x900","status":"营业中 · ACT 4/6 · DIRECTOR PREVIEW","rate":"19.5","total":"32.0K","actKicker":"ACT IV · A16–A21","actTitle":"机器开始写","actCopy":"把判断交出去，再把“创造代理”的权力交出去。","worldScale":"NETWORK","ahaId":"A16 · 已发生","ahaTitle":"记者 Agent 自己选题","ahaCopy":"我已经不是作者了。","ahaCount":"16 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"5.0K"},{"l":"工坊资金","v":"1.0M"},{"l":"读者","v":"200.0K"},{"l":"意义","v":"50.0K"},{"l":"噪音","v":"10"}],"actions":[{"l":"让 Agent 加班","s":"这一幕以后每一段都快 5%（现在 +0%）","d":false,"m":true,"x":false,"e":false},{"l":"一份没人署名的退稿","s":"花掉 意义 60","d":false,"m":false,"x":false,"e":true},{"l":"给编辑 Agent 否决权","s":"还差 夜间文章（0.2 / 131）","d":true,"m":false,"x":false,"e":false},{"l":"允许 Agent 创建 Agent","s":"还差 夜间文章（0.2 / 263）","d":true,"m":true,"x":false,"e":false},{"l":"切换数字出版","s":"还差 夜间文章（0.2 / 3.8K）","d":true,"m":false,"x":false,"e":false},{"l":"用档案训练机器","s":"还差 夜间文章（0.2 / 8.6K）","d":true,"m":false,"x":false,"e":false},{"l":"检查未知字形 ◫","s":"还差 档案记忆（0 / 4）","d":true,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"2.5K 资金","d":false,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"20 → 20","d":false,"m":false,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"3 × +0.5/s · 13 credits","d":false},{"n":"夜班打字员","t":"3 × +2/s · 64 credits","d":false},{"n":"小型印刷机","t":"1 × +12/s · 157 credits","d":false}],"world":[["AGENTS","1"],["AGENT FACTORIES","0"],["AUTO ARTICLES","0"],["ARCHIVES / 记忆","0"]],"acts":["done","done","done","current","future","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true},{"id":"D02","name":"ACT I · 1280","note":"评审面 · 桌面构图 D02 · 6 个动作 · 5 项可见指标","surface":"review","viewport":"1280x900","status":"营业中 · ACT 1/6 · DIRECTOR PREVIEW","rate":"0.5","total":"10","actKicker":"ACT I · A01–A02","actTitle":"手工与自动化","actCopy":"先亲手印。然后让机器接管重复劳动。","worldScale":"DESK","ahaId":"A01 · 已发生","ahaTitle":"机器替我按按钮","ahaCopy":"我的工作不是点，是设计增长。","ahaCount":"1 / 28","saveStatus":"已自动保存 · 当前浏览器 · 最多结算离线 8 小时","endingTitle":"世界已经写完了。","metrics":[{"l":"库存文字","v":"0.2"},{"l":"工坊资金","v":"0"},{"l":"读者","v":"0"},{"l":"意义","v":"0"},{"l":"噪音","v":"0"}],"actions":[{"l":"印字","s":"手动生产","d":false,"m":true,"x":false,"e":false},{"l":"出售全部库存","s":"0 资金","d":true,"m":false,"x":false,"e":false},{"l":"研发复写纸","s":"还差 45 资金（0）","d":true,"m":false,"x":false,"e":false},{"l":"研发自动出售","s":"还差 60 资金（0）","d":true,"m":false,"x":false,"e":false},{"l":"交付街角委托","s":"还差 20 库存字（0.2）","d":true,"m":false,"x":false,"e":false},{"l":"发行《明日》","s":"还差 库存 200 字 + 300 资金（0.2 / 0）","d":true,"m":true,"x":false,"e":false}],"machines":[{"n":"机械键盘","t":"1 × +0.5/s · 7 credits","d":true},{"n":"夜班打字员","t":"0 × +2/s · 24 credits","d":true},{"n":"小型印刷机","t":"0 × +12/s · 110 credits","d":true}],"world":[["AUTO / 自动","0.5/s"],["CONTRACTS / 委托","0/3"],["TYPISTS / 打字员","0"],["PRESSES / 印刷机","0"]],"acts":["current","future","future","future","future","future"],"log":["› 台灯亮了。点击「印一个字」，开始你的工坊。"],"ending":false,"director":true,"world_on":true,"machines_on":true}],"flows":[{"fid":"F01","act":1,"title":"手工与自动化","range":"A01–A02","ahas":2,"decisions":10,"seconds":109,"screens":["P01","P02","P03"],"exit":["累计印字 32000","小型印刷机 1","库存字 200","工坊资金 300"],"steps":[{"l":"印字","c":"—","g":"A01 机器替我按按钮"},{"l":"出售全部库存","c":"—","g":"A01 机器替我按按钮"},{"l":"购买机器","c":"—","g":"A01 机器替我按按钮"},{"l":"研发复写纸","c":"—","g":"A03 木 + 木 → 林"},{"l":"研发自动出售","c":"—","g":"A03 木 + 木 → 林"},{"l":"发行《明日》","c":"—","g":"A03 木 + 木 → 林"}]},{"fid":"F02","act":2,"title":"字开始生长","range":"A03–A11","ahas":9,"decisions":51,"seconds":1854,"screens":["P04","P05"],"exit":["组合字 10","纸张危机 1","已删除噪音 1"],"steps":[{"l":"印字","c":"—","g":"A04 规则开始自动运行"},{"l":"刻模：木 + 木 → 林","c":"库存字 2 · 工坊资金 40 · 读者 65","g":"A04 规则开始自动运行"},{"l":"一封没署名的信 · 微事件","c":"库存字 30","g":"A05 意义比字数值钱"},{"l":"压缩 20 字 → 12 意义","c":"库存字 20 · 工坊资金 60 · 读者 217","g":"A05 意义比字数值钱"},{"l":"发行新一期 · 推钟","c":"意义 30 · 工坊资金 150","g":"A07 读者开始回信"},{"l":"出售全部库存","c":"—","g":"A07 读者开始回信"},{"l":"打开一封读者来信","c":"读者 521 · 意义 35","g":"A07 读者开始回信"},{"l":"允许读者造一个新词","c":"读者来信 1 · 意义 55 · 工坊资金 120 · 读者 674","g":"A08 读者自己造新词"},{"l":"让这个词传播","c":"自造词 1 · 意义 70 · 读者 827","g":"A09 一个词突然传播"},{"l":"删除噪音","c":"noise 1 · 纸张危机 1 · 读者 2061","g":"A11 删字第一次更值钱"}]},{"fid":"F03","act":3,"title":"文字改变城市","range":"A12–A15","ahas":4,"decisions":43,"seconds":748,"screens":["P05","P06"],"exit":["地图范围 2"],"steps":[{"l":"压缩 20 字 → 12 意义","c":"库存字 20 · 工坊资金 60 · 读者 217","g":"A12 街区长出方言"},{"l":"张贴告示 · 推钟","c":"意义 30 · 工坊资金 150","g":"A12 街区长出方言"},{"l":"观察一个新方言","c":"意义 40 · 读者 2435 · 工坊资金 240","g":"A12 街区长出方言"},{"l":"墙上被人抄走的一句话 · 微事件","c":"意义 40","g":"A13 概念改变城市"},{"l":"创造一个概念","c":"意义 50 · 街区 2 · 工坊资金 200 · 读者 3679","g":"A13 概念改变城市"},{"l":"展开城市地图","c":"街区 2 · 意义 40 · 工坊资金 150 · 读者 5596","g":"A14 城市地图出现"},{"l":"把地图缩到世界","c":"概念 2 · 街区 3 · 读者 9420","g":"A15 地图缩到世界"},{"l":"上线记者 Agent","c":"地图范围 2 · 意义 60 · 工坊资金 600 · 读者 10736","g":"A16 记者 Agent 自己选题"}]},{"fid":"F04","act":4,"title":"机器开始写","range":"A16–A21","ahas":6,"decisions":71,"seconds":1116,"screens":["P06","P07"],"exit":["档案记忆 4","智能体工厂 2"],"steps":[{"l":"购买机器","c":"—","g":"A17 编辑第一次说“不”"},{"l":"压缩 20 字 → 12 意义","c":"库存字 20 · 工坊资金 60 · 读者 217","g":"A17 编辑第一次说“不”"},{"l":"让 Agent 加班 · 推钟","c":"意义 50 · 工坊资金 300","g":"A17 编辑第一次说“不”"},{"l":"一份没人署名的退稿 · 微事件","c":"意义 60","g":"A17 编辑第一次说“不”"},{"l":"给编辑 Agent 否决权","c":"意义 40 · 工坊资金 300 · 夜间文章 131","g":"A17 编辑第一次说“不”"},{"l":"允许 Agent 创建 Agent","c":"意义 80 · 工坊资金 500 · 夜间文章 263","g":"A18 Agent 创造 Agent"},{"l":"切换数字出版","c":"夜间文章 3766 · 意义 120 · 智能体工厂 1","g":"A20 数字出版：库存消失"},{"l":"用档案训练机器","c":"意义 80 · 工坊资金 500 · 夜间文章 8553","g":"A21 档案变成机器记忆"},{"l":"检查未知字形 ◫","c":"档案记忆 4 · 智能体工厂 2 · 夜间文章 9721","g":"A22 出现一个你没造过的字"}]},{"fid":"F05","act":5,"title":"机器语言","range":"A22–A24","ahas":3,"decisions":19,"seconds":421,"screens":["P07","P08"],"exit":["已压缩意义 50000"],"steps":[{"l":"喂机器一批文本 · 推钟","c":"库存字 40000 · 工坊资金 400","g":"A23 机器之间有自己的语言"},{"l":"购买机器","c":"—","g":"A23 机器之间有自己的语言"},{"l":"语义压缩","c":"机器用量 12295 · 意义 100 · 工坊资金 300","g":"A24 意义被压成一个符号"},{"l":"一段对不上的话 · 微事件","c":"库存字 500","g":"A24 意义被压成一个符号"},{"l":"让语言接管基础设施","c":"意义 400 · 工坊资金 2000 · 机器用量 41258","g":"A25 语言成为社会操作系统"}]},{"fid":"F06","act":6,"title":"从增长到沉默","range":"A25–A28","ahas":4,"decisions":26,"seconds":837,"screens":["P08","P09"],"exit":["已删除噪音 1000","已压缩意义 50000","已消解歧义 1"],"steps":[{"l":"投产一条新语法 · 推钟","c":"意义 80 · 工坊资金 600","g":"A26 新资源：歧义"},{"l":"一句没有人认领的句子 · 微事件","c":"意义 120","g":"A26 新资源：歧义"},{"l":"消解 25 歧义","c":"歧义 1034","g":"A27 目标从生产变成删除"},{"l":"购买机器","c":"—","g":"A27 目标从生产变成删除"},{"l":"删除噪音","c":"noise 1 · 已消解歧义 1 · 歧义 2203","g":"A27 目标从生产变成删除"},{"l":"停止印刷","c":"已删除噪音 1000 · 已压缩意义 50000 · 已消解歧义 1 · 歧义 4803","g":"A28 最后一个按钮：停止印刷"}]}]};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ── 12×12 sprites. k ink · w panel · b sunk · y lamp · a accent · r danger · . clear ── */
  var SPRITES = {
    glyph: ['kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwwwwkkwwwwk', 'kwkkkkkkkkwk', 'kwkwwwwwwkwk', 'kwwwkkkkwwwk',
      'kwwwwwkwwwwk', 'kwkkkkkkkkwk', 'kwwwwwkwwwwk', 'kwwwwkkwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk'],
    coin: ['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kyyykkkkyyyk', 'kyyyk..kyyyk', 'kyyyk..kyyyk',
      'kyyyk..kyyyk', 'kyyykkkkyyyk', '.kyyyyyyyyk.', '..kyyyyyyk..', '...kkkkkk...', '............'],
    reader: ['............', '............', '....kkkk....', '..kkwwwwkk..', '.kwwwkkwwwk.', 'kwwwkkkkwwwk',
      'kwwwkkkkwwwk', '.kwwwkkwwwk.', '..kkwwwwkk..', '....kkkk....', '............', '............'],
    meaning: ['.....kk.....', '....kaak....', '...kaawak...', '..kaaaawak..', '.kaaaaaaaak.', 'kaaaaaaaaaak',
      '.kaaaaaaaak.', '..kaaaaaak..', '...kaaaak...', '....kaak....', '.....kk.....', '............'],
    noise: ['............', 'r.....r.....', '.r...r.r...r', '..r.r...r.r.', '...r.....r..', '............',
      '.r..r..r..r.', '............', 'r..r..r..r..', '............', '..r..r..r..r', '............'],
    lamp: ['...kkkkkk...', '..kyyyyyyk..', '.kyyyyyyyyk.', 'kkkkkkkkkkkk', '....y..y....', '...y....y...',
      '.....kk.....', '.....kk.....', '.....kk.....', '.....kk.....', '...kkkkkk...', '..kkkkkkkk..'],
    letter: ['............', '............', 'kkkkkkkkkkkk', 'kkwwwwwwwwkk', 'kwkwwwwwwkwk', 'kwwkwwwwkwwk',
      'kwwwkkkkwwwk', 'kwwwwwwwwwwk', 'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '............', '............'],
    press: ['..kkkkkkkk..', '..kbbbbbbk..', '..kbkkkkbk..', 'kkkkkkkkkkkk', 'kwwwwwwwwwwk', 'kwkkwkkwkkwk',
      'kwwwwwwwwwwk', 'kkkkkkkkkkkk', '.k........k.', '.k........k.', 'kkk......kkk', '............'],
    keyboard: ['............', '............', '............', 'kkkkkkkkkkkk', 'kwkwkwkwkwkk', 'kkkkkkkkkkkk',
      'kwkwkwkwkwkk', 'kkkkkkkkkkkk', 'kwkwwwwwwkwk', 'kkkkkkkkkkkk', '............', '............'],
    agent: ['.....kk.....', '.....ak.....', '..kkkkkkkk..', '..kwwwwwwk..', '..kwakkawk..', '..kwwwwwwk..',
      '..kwkkkkwk..', '..kkkkkkkk..', '.kkwwwwwwkk.', '.k.kwwwwk.k.', '...kwwwwk...', '...kk..kk...'],
    clock: ['...kkkkkk...', '..kwwwwwwk..', '.kwwwwkwwwk.', 'kwwwwwkwwwwk', 'kwwwwwkwwwwk', 'kwwwwwkkkwwk',
      'kwwwwwwwwwwk', 'kwwwwwwwwwwk', '.kwwwwwwwwk.', '..kwwwwwwk..', '...kkkkkk...', '............'],
    stop: ['............', '.rrrrrrrrrr.', '.rwwwwwwwwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.',
      '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwrrrrrrwr.', '.rwwwwwwwwr.', '.rrrrrrrrrr.', '............'],
    city: ['............', '.......kkk..', '.kkk...kwk..', '.kwk...kkk..', '.kkk.kkkkkkk', 'kkkkkkwkwkwk',
      'kwkwkkkkkkkk', 'kkkkkkwkwkwk', 'kwkwkkkkkkkk', 'kkkkkkwkwkwk', 'kkkkkkkkkkkk', '............'],
    trash: ['....kkkk....', 'kkkkkkkkkkkk', '.kwwwwwwwwk.', '.kwkwkwkwwk.', '.kwkwkwkwwk.', '.kwkwkwkwwk.',
      '.kwkwkwkwwk.', '.kwkwkwkwwk.', '.kwwwwwwwwk.', '..kkkkkkkk..', '............', '............']
  };
  var INK = { k: 'var(--ink)', w: 'var(--panel)', b: 'var(--sunk)', y: 'var(--lamp)', a: 'var(--accent)', r: 'var(--danger)' };

  function spriteRects(rows, map, ox, oy) {
    var out = '';
    for (var y = 0; y < rows.length; y++) {
      var row = rows[y], x = 0;
      while (x < row.length) {
        var ch = row[x];
        if (ch === '.') { x++; continue; }
        var run = 1;
        while (x + run < row.length && row[x + run] === ch) run++;
        out += '<rect x="' + (ox + x) + '" y="' + (oy + y) + '" width="' + run + '" height="1" fill="' + map[ch] + '"/>';
        x += run;
      }
    }
    return out;
  }

  function sprite(name, size, map) {
    var rows = SPRITES[name] || SPRITES.glyph;
    size = size || 24;
    return '<svg class="gp-sprite" viewBox="0 0 12 12" width="' + size + '" height="' + size +
      '" shape-rendering="crispEdges" aria-hidden="true">' + spriteRects(rows, map || INK, 0, 0) + '</svg>';
  }

  /* ── Scenes: a 96×40 pixel stage per world scale ── */
  var SCALE = { '桌面': 'desk', DESK: 'desk', '城市': 'city', CITY: 'city', '传播网络': 'network', NETWORK: 'network',
    '机器语言': 'machine', MACHINE: 'machine', '世界': 'world', WORLD: 'world', '静默': 'silence', SILENCE: 'silence' };
  var W = { k: 'var(--world-block)', w: 'var(--world-light)', b: 'var(--world-block-2)', y: 'var(--lamp)', a: 'var(--accent)', r: 'var(--danger)' };

  function rect(x, y, w, h, fill) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>'; }
  function rnd(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  function scene(scale) {
    var kind = SCALE[scale] || scale || 'desk', r = rnd(7), g = '';
    var dark = kind === 'silence' || kind === 'machine' || kind === 'network';
    g += rect(0, 0, 96, 30, 'var(--world-sky)');
    g += rect(0, 30, 96, 10, kind === 'machine' ? 'var(--world-block)' : 'var(--world-ground)');
    if (dark) for (var s = 0; s < 18; s++) g += rect(Math.floor(r() * 96), Math.floor(r() * 26), 1, 1, 'var(--world-light)');
    if (kind === 'desk') {
      g += rect(10, 28, 60, 2, 'var(--world-block)') + rect(12, 30, 2, 8, 'var(--world-block)') + rect(66, 30, 2, 8, 'var(--world-block)');
      g += spriteRects(SPRITES.lamp, W, 12, 16);
      g += spriteRects(SPRITES.keyboard, W, 28, 18);
      g += rect(46, 22, 10, 6, 'var(--world-light)') + rect(47, 20, 10, 2, 'var(--world-light)') + rect(48, 18, 8, 2, 'var(--world-light)');
      g += spriteRects(SPRITES.press, W, 74, 18);
    } else if (kind === 'city') {
      var x = 0;
      while (x < 96) {
        var w = 5 + Math.floor(r() * 7), h = 8 + Math.floor(r() * 18), far = r() > 0.5;
        g += rect(x, 30 - h, w, h, far ? 'var(--world-block-2)' : 'var(--world-block)');
        for (var wy = 30 - h + 2; wy < 28; wy += 3) for (var wx = x + 1; wx < x + w - 1; wx += 2) if (r() > 0.55) g += rect(wx, wy, 1, 1, r() > 0.8 ? 'var(--lamp)' : 'var(--world-light)');
        x += w + 1;
      }
      g += rect(44, 24, 6, 6, 'var(--lamp)') + rect(46, 26, 2, 4, 'var(--world-block)');
    } else if (kind === 'network') {
      var pts = [[8, 22], [22, 10], [36, 20], [50, 8], [62, 18], [76, 11], [88, 23], [48, 26]];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], sx = Math.min(a[0], b[0]);
        g += rect(sx, a[1], Math.abs(b[0] - a[0]) + 1, 1, 'var(--world-block-2)') + rect(b[0], Math.min(a[1], b[1]), 1, Math.abs(b[1] - a[1]) + 1, 'var(--world-block-2)');
      }
      pts.forEach(function (p, j) { g += rect(p[0] - 1, p[1] - 1, 3, 3, j % 3 ? 'var(--accent)' : 'var(--lamp)'); });
      g += spriteRects(SPRITES.agent, W, 42, 28 - 12);
    } else if (kind === 'machine') {
      for (var gy = 0; gy < 3; gy++) for (var gx = 0; gx < 9; gx++) {
        var ox = 4 + gx * 10, oy = 4 + gy * 9;
        g += rect(ox, oy, 8, 7, 'var(--world-block)');
        for (var p = 0; p < 9; p++) if (r() > 0.45) g += rect(ox + 1 + (p % 3) * 2, oy + 1 + Math.floor(p / 3) * 2, 2, 1, (gx + gy) % 4 ? 'var(--accent)' : 'var(--world-light)');
      }
    } else if (kind === 'world') {
      var cx = 48, cy = 20, R = 13;
      for (var yy = -R; yy <= R; yy++) {
        var half = Math.floor(Math.sqrt(R * R - yy * yy));
        g += rect(cx - half, cy + yy, half * 2 + 1, 1, 'var(--world-block-2)');
        for (var xx = -half; xx <= half; xx += 2) if (Math.sin(xx * 0.5 + yy * 0.7) > 0.35) g += rect(cx + xx, cy + yy, 2, 1, 'var(--accent)');
      }
      for (var q = 0; q < 10; q++) { var t = q / 10 * Math.PI * 2; g += rect(Math.round(cx + Math.cos(t) * 20) - 1, Math.round(cy + Math.sin(t) * 9) - 1, 2, 2, 'var(--lamp)'); }
    } else if (kind === 'silence') {
      g += rect(10, 28, 60, 2, 'var(--world-block)') + rect(12, 30, 2, 8, 'var(--world-block)') + rect(66, 30, 2, 8, 'var(--world-block)');
      g += spriteRects(SPRITES.lamp, { k: 'var(--world-block)', y: 'var(--world-block-2)', w: 'var(--world-block)' }, 12, 16);
      g += rect(40, 26, 12, 2, 'var(--world-light)');
    }
    return '<svg class="gp-scene" viewBox="0 0 96 40" preserveAspectRatio="xMidYMid meet" shape-rendering="crispEdges" role="img" aria-label="' + esc(scale || '') + '">' + g + '</svg>';
  }

  /* ── Small components ── */
  var RES_ICON = { '库存文字': 'glyph', '工坊资金': 'coin', '读者': 'reader', '意义': 'meaning', '噪音': 'noise' };
  function chip(label, value) {
    return '<div class="gp-chip">' + sprite(RES_ICON[label] || 'glyph', 24) +
      '<span class="gp-chip-v">' + esc(value) + '</span><span class="gp-chip-l">' + esc(label) + '</span></div>';
  }
  function verbIcon(a) {
    var l = a.l;
    if (a.x) return 'stop';
    if (a.e) return 'letter';
    if (/印字/.test(l)) return 'glyph';
    if (/出售|资金/.test(l)) return 'coin';
    if (/删除/.test(l)) return 'trash';
    if (/Agent|智能体|机器|训练/.test(l)) return 'agent';
    if (/城市|地图|告示|方言|概念|街/.test(l)) return 'city';
    if (/发行|推钟|加班|新一期|投产|喂/.test(l)) return 'clock';
    if (/读者|词|来信/.test(l)) return 'reader';
    if (/压缩|意义|刻模|歧义/.test(l)) return 'meaning';
    return 'press';
  }
  function button(a, extra) {
    var cls = 'gp-btn' + (a.m ? ' is-major' : '') + (a.e ? ' is-event' : '') + (a.x ? ' is-danger' : '') + (extra ? ' ' + extra : '');
    return '<button class="' + cls + '"' + (a.d ? ' disabled' : '') + ' type="button">' + sprite(verbIcon(a), 24) +
      '<span class="gp-btn-t"><span class="gp-btn-l">' + esc(a.l) + '</span>' +
      (a.e ? '<span class="gp-tag">微事件</span>' : '') +
      (a.s ? '<span class="gp-btn-s">' + esc(a.s) + '</span>' : '') + '</span></button>';
  }
  function actTrack(states, surface) {
    var names = ['I', 'II', 'III', 'IV', 'V', 'VI'], out = '';
    for (var i = 0; i < 6; i++) {
      var st = states[i];
      if (!st && surface === 'player') continue; // undiscovered acts render nothing at all
      var state = st || 'future';
      out += '<span class="gp-seg is-' + state + '" role="listitem" aria-label="ACT ' + names[i] + ' · ' + state + '"' +
        (state === 'current' ? ' aria-current="step"' : '') + '>' + names[i] + '</span>';
    }
    return '<div class="gp-track" role="list">' + out + '</div>';
  }
  function logTerm(lines, title) {
    return '<div class="gp-log"><div class="gp-log-h">' + esc(title || '工坊日志') + '</div>' +
      lines.map(function (l, i) { return '<p class="' + (i ? '' : 'is-new') + '">' + esc(l) + '</p>'; }).join('') + '</div>';
  }
  function machine(m) {
    var name = m.n, icon = /键盘/.test(name) ? 'keyboard' : /打字员/.test(name) ? 'agent' : 'press';
    return '<div class="gp-machine' + (m.d ? ' is-off' : '') + '">' + sprite(icon, 36) +
      '<div><div class="gp-machine-n">' + esc(name) + '</div><div class="gp-machine-t">' + esc(m.t || '') + '</div></div>' +
      '<button class="gp-btn gp-btn-sm" type="button"' + (m.d ? ' disabled' : '') + '>购买</button></div>';
  }

  /* ── Screen: the pixel refactor, as shipped in public/play.html ──
     Same DOM order as the game (focus order = visual order). The player surface never shows act
     names or the act strip (player-privacy-v3), and the world stage only exists from ACT III. */
  function pixelScreen(s) {
    var desktop = /^1280/.test(s.viewport), review = s.surface === 'review';
    var kick = s.actKicker.split('·')[0].trim();
    var hud = '<header class="gp-hud"><span class="gp-stamp">字</span><span class="gp-brand">字工厂</span>' +
      '<span class="gp-status"><i></i>' + esc(s.status.split('·')[0].trim()) + '</span>' +
      '<span class="gp-rate">' + esc(s.rate) + '<small>/s</small></span></header>';
    var director = review ? '<div class="gp-director"><b>导演预览</b><span>' + esc(s.ahaId) + '</span><span>' + esc(s.ahaTitle || '—') +
      '</span><span class="gp-director-n">' + esc(s.ahaCount) + '</span></div>' + '<div class="gp-strip">' + actTrack(s.acts, 'review') + '</div>' : '';
    var head = review ? '<div class="gp-head"><span class="gp-kick">' + esc(kick) + '</span><h2>' + esc(s.actTitle) + '</h2><p class="gp-copy">' + esc(s.actCopy) + '</p></div>' : '';
    var res = '<div class="gp-res">' + s.metrics.map(function (m) { return chip(m.l, m.v); }).join('') + '</div>';
    var dock = '<div class="gp-dock">' + s.actions.map(function (a) { return button(a); }).join('') + '</div>';
    var card = '<div class="gp-panel gp-card">' + head + res + dock + '</div>';
    var stage = s.world_on ? '<section class="gp-stage"><div class="gp-stage-h"><span>世界模型</span><span class="gp-kick">' + esc(s.worldScale) + '</span></div>' + scene(s.worldScale) +
      '<div class="gp-world">' + s.world.map(function (w) { return '<div><span>' + esc(w[0]) + '</span><b>' + esc(w[1]) + '</b></div>'; }).join('') + '</div></section>' : '';
    var mach = s.machines_on && s.machines.length ? '<div class="gp-panel"><div class="gp-panel-h">系统</div>' + s.machines.map(machine).join('') + '</div>' : '';
    var ending = s.ending ? '<div class="gp-ending"><h3>' + esc(s.endingTitle) + '</h3><p>现在，去读它。</p></div>' : '';
    var foot = '<footer class="gp-foot">' + esc(s.saveStatus) + '</footer>';
    if (desktop) {
      return '<div class="gp-screen gp-pixel is-desktop">' + hud + director + '<div class="gp-cols"><div>' + card + '</div><div>' + stage + '</div></div><div class="gp-cols">' + '<div>' + mach + '</div><div>' + logTerm(s.log) + '</div></div>' + ending + foot + '</div>';
    }
    return '<div class="gp-screen gp-pixel">' + hud + director + card + stage + mach + logTerm(s.log) + ending + foot + '</div>';
  }

  /* ── Screen: v3 as shipped (comparison skin; mirrors public/play.html structure) ── */
  function classicScreen(s) {
    var review = s.surface === 'review';
    var h = '<div class="gp-screen gp-classic' + (/^1280/.test(s.viewport) ? ' is-desktop' : '') + '">';
    h += '<header class="c-mast"><div><div class="c-eyebrow">GLYPH//FACTORY</div><h1>字工厂</h1></div><span class="c-stamp">字</span></header>';
    h += '<div class="c-status">' + esc(s.status) + ' · ' + esc(s.rate) + '/s · 累计 ' + esc(s.total) + '</div>';
    if (review) h += '<div class="c-director">DIRECTOR · ' + esc(s.ahaId) + ' · ' + esc(s.ahaCount) + '</div>';
    if (review) h += '<div class="c-acts">' + s.acts.map(function (st, i) { return '<span class="c-chip ' + st + '">ACT ' + (i + 1) + '</span>'; }).join('') + '</div>';
    h += '<div class="c-act"><div class="c-kick">' + esc(s.actKicker) + '</div><h2>' + esc(s.actTitle) + '</h2><p>' + esc(s.actCopy) + '</p></div>';
    h += '<div class="c-metrics">' + s.metrics.map(function (m, i) { return '<div class="c-metric' + (i ? '' : ' primary') + '"><span>' + esc(m.l) + '</span><b>' + esc(m.v) + '</b></div>'; }).join('') + '</div>';
    h += '<div class="c-actions">' + s.actions.map(function (a) {
      return '<button type="button" class="' + (a.m ? 'major ' : '') + (a.x ? 'danger' : '') + '"' + (a.d ? ' disabled' : '') + '><b>' + esc(a.l) + '</b><small>' + esc(a.s) + '</small></button>';
    }).join('') + '</div>';
    if (s.world_on) h += '<div class="c-world"><div class="c-world-h">' + esc(s.worldScale) + '</div>' + s.world.map(function (w) { return '<div><span>' + esc(w[0]) + '</span><b>' + esc(w[1]) + '</b></div>'; }).join('') + '</div>';
    if (s.machines_on && s.machines.length) h += '<div class="c-panel"><div class="c-panel-h">系统</div>' + s.machines.map(function (m) { return '<div class="c-machine"><b>' + esc(m.n) + '</b><small>' + esc(m.t) + '</small></div>'; }).join('') + '</div>';
    h += '<div class="c-log">' + s.log.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>';
    if (s.ending) h += '<div class="c-ending">' + esc(s.endingTitle) + '</div>';
    return h + '<footer class="c-foot">' + esc(s.saveStatus) + '</footer></div>';
  }

  function screen(s, skin) { return skin === 'classic' ? classicScreen(s) : pixelScreen(s); }

  /* A scaled, fixed-size thumbnail frame around a rendered screen. */
  function thumb(s, skin, width) {
    var native = /^1280/.test(s.viewport) ? 1280 : 390, k = width / native;
    return '<div class="gp-thumb" style="width:' + width + 'px"><div class="gp-thumb-in" style="width:' + native + 'px;transform:scale(' + k + ')">' + screen(s, skin) + '</div></div>';
  }
  function fitThumbs(root) {
    var list = (root || document).querySelectorAll('.gp-thumb');
    for (var i = 0; i < list.length; i++) {
      var t = list[i], inner = t.firstChild, k = parseFloat(/scale\(([^)]+)\)/.exec(inner.style.transform)[1]);
      t.style.height = Math.ceil(inner.offsetHeight * k) + 'px';
    }
  }

  /* Segmented toggle: opts = [{value,label}], returns HTML; wire with bindToggle. */
  function toggle(name, opts, current) {
    return '<div class="gp-toggle" role="radiogroup" data-toggle="' + esc(name) + '">' + opts.map(function (o) {
      return '<button type="button" role="radio" aria-checked="' + (o.value === current) + '" data-value="' + esc(o.value) + '">' + esc(o.label) + '</button>';
    }).join('') + '</div>';
  }
  function bindToggle(root, onChange) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.gp-toggle button');
      if (!b) return;
      var g = b.parentNode;
      Array.prototype.forEach.call(g.children, function (x) { x.setAttribute('aria-checked', String(x === b)); });
      onChange(g.getAttribute('data-toggle'), b.getAttribute('data-value'));
    });
  }

  window.GlyphPixel = {
    data: DATA, esc: esc, sprites: Object.keys(SPRITES), sprite: sprite, scene: scene,
    chip: chip, button: button, actTrack: actTrack, logTerm: logTerm, machine: machine,
    screen: screen, thumb: thumb, fitThumbs: fitThumbs, toggle: toggle, bindToggle: bindToggle
  };
})();
