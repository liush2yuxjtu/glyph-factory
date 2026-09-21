/* Glyph Factory Acts Engine v3 — deterministic, DOM-free browser engine. */
const GlyphEngineV3 = (() => {
  'use strict';
  const VERSION = 3;
  const SAVE_KEY = 'glyph-factory-save-v3';
  const OFFLINE_CAP = 8 * 60 * 60;
  const PRICE = 0.5;
  const LIMIT = 1e15;
  // Cadence of an active composition rule, and how much readership each composition adds
  // per second. Exported so the renderer reports the real number instead of a second copy.
  const RULE_PERIOD = 4;
  const RULE_READERS = 0.015;

  const UNITS = [
    { id: 'keyboards', name: '机械键盘', rate: 0.5, cost: 5, growth: 1.34, unlock: 10 },
    { id: 'typists', name: '夜班打字员', rate: 2, cost: 24, growth: 1.38, unlock: 100 },
    { id: 'presses', name: '小型印刷机', rate: 12, cost: 110, growth: 1.42, unlock: 800 },
  ];
  const CONTRACTS = [
    { glyphs: 20, reward: 20, name: '给邻居的一封信' },
    { glyphs: 100, reward: 85, name: '街角书店的传单' },
    { glyphs: 500, reward: 350, name: '送往远方的故事' },
  ];
  const ACTS = [
    { id: 1, name: '手工与自动化', range: 'A01–A02' },
    { id: 2, name: '字开始生长', range: 'A03–A11' },
    { id: 3, name: '文字改变城市', range: 'A12–A15' },
    { id: 4, name: '机器开始写', range: 'A16–A21' },
    { id: 5, name: '机器语言', range: 'A22–A24' },
    { id: 6, name: '从增长到沉默', range: 'A25–A28' },
  ];
  const aha = (id, act, title, reveal, kind = 'event') => ({ id, act, title, reveal, kind });
  const AHAS = [
    aha('A01',1,'机器替我按按钮','我的工作不是点，是设计增长。','mechanic'),
    aha('A02',1,'员工组成编辑部','人不是数字，组织才是机器。'),
    aha('A03',2,'木 + 木 → 林','字与字之间的关系，也能做成机器。','mechanic'),
    aha('A04',2,'规则开始自动运行','机器生产的不只是字，而是文字机器。'),
    aha('A05',2,'意义比字数值钱','一千个废字，不如一句重要的话。'),
    aha('A06',2,'报纸制造需求','文字会制造更多文字。','mechanic'),
    aha('A07',2,'读者开始回信','消费者变成生产者。'),
    aha('A08',2,'读者自己造新词','语言开始脱离工厂。'),
    aha('A09',2,'一个词突然传播','生产速度退场，传播速度登场。'),
    aha('A10',2,'纸张危机：少写','目标从 字/秒 翻成 意义/字。','mechanic'),
    aha('A11',2,'删字第一次更值钱','最大的敌人不是缺字，而是噪音。'),
    aha('A12',3,'街区长出方言','同一个字，在不同地方不再同义。'),
    aha('A13',3,'概念改变城市','文字从商品变成世界规则。','mechanic'),
    aha('A14',3,'城市地图出现','工坊原来只是世界里的一个点。'),
    aha('A15',3,'地图缩到世界','真正的工厂，是整个传播网络。'),
    aha('A16',4,'记者 Agent 自己选题','我已经不是作者了。','mechanic'),
    aha('A17',4,'编辑第一次说“不”','自动化不是快按钮，而是被委托的判断。'),
    aha('A18',4,'Agent 创造 Agent','工厂开始扩张自己。','mechanic'),
    aha('A19',4,'醒来时文章堆满了桌子','系统不再需要我值夜班。'),
    aha('A20',4,'数字出版：库存消失','经营多年的仓库突然不重要了。'),
    aha('A21',4,'档案变成机器记忆','过去的每个字，都是训练材料。'),
    aha('A22',5,'出现一个你没造过的字','这个字，不是我造的。','mechanic'),
    aha('A23',5,'机器之间有自己的语言','有些语言已经不是给人看的。'),
    aha('A24',5,'意义被压成一个符号','增长最终折叠回一个字。','mechanic'),
    aha('A25',6,'语言成为社会操作系统','我不是出版商，我在运行基础设施。'),
    aha('A26',6,'新资源：歧义','文字越多，世界也可能越混乱。'),
    aha('A27',6,'目标从生产变成删除','无限生产的终点可能是噪音。','mechanic'),
    // Not the same sentence as the stop-printing action's own log line: the reveal states the
    // insight, the action note says goodbye in the world's voice. Identical copy would ship
    // design text into the player bundle, where that note is player-facing.
    aha('A28',6,'最后一个按钮：停止印刷','最后一个动作不是生产，是停止——增长到此为止。','mechanic'),
  ];

  // The player never sees the line above: an Aha's title and reveal are design copy, and the
  // privacy layer strips every `A## ·` line out of the log. So this second line is the only
  // thing that makes an Aha perceptible at all — the world announcing the same event in the
  // player's own language, with no ID, no act number and no explanation of the mechanic.
  // Keep them separate from `aha(...)`: scripts/build-static.mjs blanks that call's copy by
  // regex, and folding this text into it would silently strip the player's version too.
  const AHA_WORLD = {
    A01: '机械键盘开始自己动。你不再是唯一在按按钮的人。',
    A02: '打字员开始互相校对。他们不只是数字了，他们成了一个部门。',
    A03: '木和木之间长出了林。这不只是一个新字，这是一条可以重复的规则。',
    A04: '刻好的模子在自己转动。你没有碰它，它也在出字。',
    A05: '有人愿意用一千个废字的价钱，换一句重要的话。',
    A06: '读过报纸的人，开始想要下一份。文字在制造对文字的需求。',
    A07: '信箱里出现第一封回信：「你们印的那篇，我读了三遍。」写信的人，昨天还是读者。',
    A08: '读者自己造了一个词。它不在你的字表里，但它已经在被使用。',
    A09: '那个词自己跑了起来。今天它在街上，明天它会在别的城市。',
    A10: '纸不够了。再提高产量只会更糟——现在要比的是每张纸上写了什么。',
    A11: '删掉一句废话，剩下的那句就贵了。删除第一次成为生产。',
    A12: '隔着两条街，同一个字已经不是同一个意思了。',
    A13: '一个词不再只是描述世界，它开始规定世界。',
    A14: '地图展开了。你的工坊在里面，只是一个小方块。',
    A15: '地图还在缩小。真正的工厂不是这间屋子，是整张传播网络。',
    A16: '记者 Agent 交来了它自己选的题目。这一篇不是你布置的。',
    A17: '编辑 Agent 退回了你今天的头条：「这条不该发。」',
    A18: 'Agent 开始自己招募 Agent。工厂在扩张自己。',
    A19: '你不在的时候，系统也没有停。第二天早上，文章已经堆满了桌子。',
    A20: '书不再堆在仓库里。库存这个概念开始过时了。',
    A21: '过去写下的每一个字，都成了它的教材。',
    A22: '这个字不是你造的。字表第一次向外长了一格。',
    A23: '机器之间的对话，已经不再需要翻译成人话。',
    A24: '所有的字被压成了一个符号。它还在继续变小。',
    A25: '城市开始按你的语法运转。你不是出版商，你是它的运行层。',
    A26: '文字太多，同一句话开始有两种意思。含混不清第一次有了代价。',
    A27: '目标翻过来了：不再是写更多，而是删掉更多。',
    A28: '车间安静下来。第一次，没有新的字被造出来。',
  };

  const num = (v, max = LIMIT) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(v, max) : 0;
  const integer = (v, max = 1e9) => Math.floor(num(v, max));
  const note = (g, text) => ({ ...g, log: [String(text).slice(0, 220), ...(Array.isArray(g.log) ? g.log : [])].slice(0, 40) });
  const rate = (g) => g.stopped ? 0 : UNITS.reduce((sum, u) => sum + integer(g[u.id], 10000) * u.rate, 0);
  const cost = (g, id) => {
    const u = UNITS.find((item) => item.id === id);
    return u ? Math.ceil(u.cost * u.growth ** integer(g[id], 10000)) : Infinity;
  };
  const actIndex = (g) => Math.max(1, Math.min(6, integer(g.act || 1, 6)));

  function fresh(now = Date.now()) {
    return {
      version: VERSION, updatedAt: now, startedAt: now,
      glyphs: 0, credits: 0, lifetimeGlyphs: 0,
      keyboards: 0, typists: 0, presses: 0, contracts: 0,
      manualBoost: false, autoSellUnlocked: false, autoSell: false,
      published: false, act: 1, ruleActive: false, composed: 0, ruleCredit: 0,
      readers: 0, demand: 0, meaning: 0, noise: 0,
      letters: 0, organicWords: 0, viralWords: 0, paperCrisis: false,
      concepts: 0, societyEffects: 0, districts: 0, worldScale: 0,
      agents: 0, editorAutonomy: false, agentFactories: 0,
      overnightArticles: 0, digital: false, archives: 0,
      machineGlyphs: 0, machineGlyphUse: 0, compressedMeaning: 0,
      infrastructure: false, ambiguity: 0, ambiguityResolved: false, deletedNoise: 0,
      stopped: false, ahaSeen: [], director: false,
      log: ['台灯亮了。点击「印一个字」，开始你的工坊。'],
    };
  }

  function trigger(g, id) {
    switch (id) {
      case 'A01': return rate(g) > 0;
      case 'A02': return g.typists >= AHA_GOALS.A02.need;
      case 'A03': return g.published;
      case 'A04': return g.ruleActive && g.composed >= 3;
      case 'A05': return g.meaning >= 10;
      // 「报纸制造需求」只有在「一句重要的话」已经被理解之后才说得通。读者是自己涨上来的，
      // 涨到 100 的时候玩家可能一次「压缩」都没按过——那样 A06 会抢在 A05 前面发生，
      // 玩家看到的是「读者开始回信」配着一场他还没学会的语义课。链上前一条，顺序就锁死了。
      case 'A06': return g.readers >= AHA_GOALS.A06.need && g.meaning >= AHA_GOALS.A05.need;
      case 'A07': return g.letters >= 1;
      case 'A08': return g.organicWords >= 1;
      case 'A09': return g.viralWords >= 1;
      case 'A10': return g.paperCrisis;
      // 删除是在纸张危机之后才学会的：A10 那句话说的就是「再提高产量只会更糟」。
      // 不链上的话，噪音一冒出来玩家就能删，A11 会抢在 A10 前面（实测差 4 次点击）。
      case 'A11': return g.deletedNoise >= 1 && g.paperCrisis;
      case 'A12': return g.districts >= 2;
      case 'A13': return g.concepts >= 1;
      case 'A14': return g.worldScale >= 1;
      case 'A15': return g.worldScale >= 2;
      case 'A16': return g.agents >= 1;
      case 'A17': return g.editorAutonomy;
      case 'A18': return g.agentFactories >= 1;
      case 'A19': return g.overnightArticles >= AHA_GOALS.A19.need;
      case 'A20': return g.digital;
      case 'A21': return g.archives >= 1;
      case 'A22': return g.machineGlyphs >= 1;
      case 'A23': return g.machineGlyphUse >= AHA_GOALS.A23.need;
      case 'A24': return g.compressedMeaning >= AHA_GOALS.A24.need;
      case 'A25': return g.infrastructure;
      case 'A26': return g.ambiguity >= AHA_GOALS.A26.need;
      case 'A27': return g.deletedNoise >= AHA_GOALS.A27.need;
      case 'A28': return g.stopped;
      default: return false;
    }
  }
  const ahaUnlocked = (g, id) => Array.isArray(g.ahaSeen) && g.ahaSeen.includes(id) || (trigger(g, id) && clockMet(g, id));

  function syncAhas(state) {
    let g = state;
    const seen = new Set(Array.isArray(g.ahaSeen) ? g.ahaSeen : []);
    for (const item of AHAS) {
      // 钟走到刻度才算发生：`trigger` 说的是「这件事成立了吗」，`clockMet` 说的是
      // 「玩家等够了吗」。两者都在才发公告，否则一条发现在条件刚擦边的同一拍里冒出来，
      // 玩家还没看见它要回答的那个问题。
      if (!seen.has(item.id) && trigger(g, item.id) && clockMet(g, item.id)) {
        seen.add(item.id);
        g = note({ ...g, ahaSeen: [...seen] }, `${item.id} · ${item.title}：${item.reveal}`);
        // Prepend after the design line so the world's sentence is the newest entry the
        // player reads, and so the scrub leaves it at the top of the log.
        const world = AHA_WORLD[item.id];
        if (world) g = note(g, world);
      }
    }
    g = { ...g, ahaSeen: [...seen] };
    return g;
  }

  function sanitizeV3(value, now) {
    const g = fresh(now);
    for (const key of ['glyphs','credits','lifetimeGlyphs','composed','ruleCredit','readers','demand','meaning','noise','letters','organicWords','viralWords','concepts','societyEffects','districts','worldScale','agents','agentFactories','overnightArticles','archives','machineGlyphs','machineGlyphUse','compressedMeaning','ambiguity','deletedNoise']) g[key] = num(value[key]);
    g.ruleCredit = Math.min(g.ruleCredit, RULE_PERIOD);
    for (const key of ['keyboards','typists','presses','contracts']) g[key] = integer(value[key], 10000);
    for (const key of ['manualBoost','autoSellUnlocked','autoSell','published','ruleActive','paperCrisis','editorAutonomy','digital','infrastructure','ambiguityResolved','stopped','director']) g[key] = value[key] === true;
    g.autoSell = g.autoSellUnlocked && g.autoSell;
    g.act = Math.max(1, Math.min(6, integer(value.act || (g.published ? 2 : 1), 6)));
    g.startedAt = Math.min(now, num(value.startedAt || now));
    g.updatedAt = Math.min(now, num(value.updatedAt || now));
    g.ahaSeen = Array.isArray(value.ahaSeen) ? value.ahaSeen.filter((id) => AHAS.some((a) => a.id === id)).slice(0, 28) : [];
    g.log = Array.isArray(value.log) ? value.log.filter((v) => typeof v === 'string').map((v) => v.slice(0,220)).slice(0,40) : g.log;
    g.lifetimeGlyphs = Math.max(g.lifetimeGlyphs, g.glyphs);
    return g;
  }

  function restore(raw, now = Date.now()) {
    let value = raw;
    if (typeof raw === 'string') { try { value = JSON.parse(raw); } catch { return fresh(now); } }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fresh(now);
    if (value.version === VERSION) return syncAhas(advance(sanitizeV3(value, now), now));
    const g = fresh(now);
    g.glyphs = num(value.glyphs); g.credits = num(value.credits); g.lifetimeGlyphs = Math.max(num(value.lifetimeGlyphs), g.glyphs);
    g.keyboards = integer(value.keyboards,10000); g.typists = integer(value.typists,10000); g.presses = integer(value.presses,10000); g.contracts = integer(value.contracts,CONTRACTS.length);
    g.manualBoost = value.manualBoost === true; g.autoSellUnlocked = value.autoSellUnlocked === true; g.autoSell = g.autoSellUnlocked && value.autoSell === true;
    g.published = value.finished === true || value.published === true;
    g.act = g.published ? 2 : 1;
    g.startedAt = Math.min(now, num(value.startedAt || now)); g.updatedAt = Math.min(now, num(value.updatedAt || now));
    if (g.published) { g.readers = 20; g.demand = 1; g.log = ['旧存档已迁移：第一章不是终点。字开始自己生长。']; }
    return syncAhas(g);
  }

  function advance(state, now = Date.now()) {
    if (!Number.isFinite(now) || now <= state.updatedAt) return syncAhas(state);
    const elapsed = Math.min(OFFLINE_CAP, (now - state.updatedAt) / 1000);
    let g = { ...state, updatedAt: now };
    if (!g.stopped) {
      const made = rate(g) * elapsed;
      g.glyphs = num(g.glyphs + made); g.lifetimeGlyphs = num(g.lifetimeGlyphs + made);
      if (g.ruleActive) {
        // An active rule runs on its own clock, so the remainder has to be carried across
        // ticks. floor(elapsed / RULE_PERIOD) is 0 for every 500ms live tick, which meant the
        // rule only ever fired on an offline catch-up — the opposite of what A04 promises.
        const credit = g.ruleCredit + elapsed;
        const pairs = Math.min(Math.floor(g.glyphs / 2), Math.floor(credit / RULE_PERIOD));
        g.ruleCredit = Math.min(credit - pairs * RULE_PERIOD, RULE_PERIOD);
        if (pairs > 0) { g.glyphs -= pairs * 2; g.composed = num(g.composed + pairs); }
      }
      if (g.published) {
        // The city reads back. Districts and concepts are populations, not decorations, so
        // they feed the readership that ACT III gates on — otherwise "a dialect needs a
        // bigger city" is an unreachable wall instead of a compounding loop.
        // 组合字对读者的贡献封顶：自动刻字的规则会一直跑，`composed` 因此单调上涨，
        // 拿它乘一个常数等于给读者装了一台永动的加速器——参考对局里读者涨到 4/秒，
        // 第三章的钟就是这样被冲垮的。封顶之后，加速只来自街区、概念、Agent 这些
        // 玩家真的做了决定才有的东西。
        // 「传播速度登场」是 A09 的承诺，所以这里真的做成了加速：viralWords 把自然增速
        // 翻三倍，而不是一次送掉 750 个读者——一次性的加法会跳过中间整整一段刻度，
        // 让 A09→A10 只剩 87 秒。
        const organic = (0.35 + Math.min(g.composed, 12) * RULE_READERS) * (1 + g.viralWords * 2);
        g.readers = num(g.readers + elapsed * (organic + g.agents * 1.5 + g.districts * 1.5 + g.concepts * 2.5));
        g.demand = num(Math.max(g.demand, 1 + g.readers / 500));
        g.noise = num(g.noise + elapsed * (g.digital ? 0.8 : 0.08) * Math.max(1, g.agents));
        // Digital publishing ends the physical stock economy — `sell` and auto-sell both stop —
        // so readership has to become the income, or every later act's cost is unpayable.
        if (g.digital) g.credits = num(g.credits + elapsed * g.readers * 0.004);
        // 纸张危机必须发生在「一个词突然传播」之后：危机的成因就是那一下带来的需求。
        // 读者是自己涨上来的，所以只看读者数会让危机抢在传播之前发生。
        // 门槛现在读 AHA_CLOCK.A10，和发现自己的刻度是同一个数：A09→A10 因此和其它
        // 每一条一样长，而不是「传播送的那 750 个读者顺手点着」。
        if (g.viralWords >= 1 && g.readers >= AHA_CLOCK.A10[1]) g.paperCrisis = true;
      }
      if (g.agents > 0) {
        g.meaning = num(g.meaning + elapsed * g.agents * 0.35);
        // 「醒来时文章堆满了桌子」等的是这一行。0.2/秒时，一桌文章要 500 秒，玩家只能
        // 一边空转一边按「压缩」凑下一条的钱——那段空转有 45 次点击，比整幕还长。
        g.overnightArticles = num(g.overnightArticles + elapsed * g.agents * 0.5);
      }
      if (g.agentFactories > 0) g.agents = num(g.agents + elapsed * g.agentFactories / 120, 1e7);
      if (g.machineGlyphs > 0) g.machineGlyphUse = num(g.machineGlyphUse + elapsed * g.machineGlyphs * (20 + g.agentFactories * 10));
      if (g.infrastructure) g.ambiguity = num(g.ambiguity + elapsed * (0.5 + g.noise / 10000));
      if (g.autoSellUnlocked && g.autoSell && !g.digital) {
        const sold = Math.floor(g.glyphs); g.glyphs -= sold; g.credits = num(g.credits + sold * PRICE);
      }
    }
    // 幕转换和「地图出现」原来是同一件事：按下「展开城市地图」的那一刻既是进入第三章，
    // 又是 A14「城市地图出现」。于是 A14 总是抢在自己的前两条（A12 街区长出方言、
    // A13 概念改变城市）之前发生——地图先出现，城市才开始长大，叙述是倒的。
    // 拆开：读完第二章就进城，地图要在城里真的有了两种以上街区之后才画得出来。
    if (g.act === 2 && gateMet(g, 2)) {
      g = note({ ...g, act: 3, districts: 1 }, '地图摊开在桌上：你终于看见了工坊外面的部分。');
    }
    return syncAhas(g);
  }

  // 第一章的门槛只写一份：进度条、按钮亮不亮、引擎放不放行都读 ACT_GATES[1]。
  // 原来这四个数字在 canPublish、ACT_GATES 和渲染层各写一遍，改一个忘一个就会出现
  // 「进度条说还差 300 资金、按钮已经能按」。
  function canPublish(g) { return !g.published && ACT_GATES[1].every((c) => goalValue(g, c.key) >= c.need); }

  // ── 通往下一阶段的门槛 ────────────────────────────────────────────────────
  // 这些条件原先散在 glyph-game-v3.js 里，每个动作各写一份（cityReady / worldReady /
  // machineReady / stopReady），进度条再抄一遍就会变成第二份真源。收进引擎，渲染层只读。
  // ACT III's own precondition: how big the city has to be before the map can zoom out.
  // Exported so the renderer stops carrying a second copy of these two numbers.
  const WORLD_GATE = { concepts: 2, districts: 3 };

  // ── 每一章的钟 ────────────────────────────────────────────────────────────
  // 每条发现要等的那几秒，必须来自这一章自己会长的那个数。原来只有「读者」和「机器用量」
  // 两条链上有钟，其余 15 条是「点一下就到」的：钱是第一章的产量买得起的，字是自动产的，
  // 于是第三章四条发现在 12 秒里演完、第六章三条 2 秒演完——全程 23 分钟里有 15 段间隔
  // 不到 6 秒，标准差 10.61 就是这么来的。
  // 现在每条发现都踩在一条会自己长、而且只有它花得掉的数上。刻度集中在这张表里：
  // `clockMet()` 决定「什么时候算发生」，`COMMAND_COSTS` 决定「按钮什么时候亮」，
  // 两处读同一对数字，按钮上那句「还差 读者 700/740」才不会和引擎说的不是一回事。
  // 相邻两个刻度之差 ÷ 那个数的增速 = 玩家要等的时间，改增速就要重排刻度。
  // 第三章的读者会被街区和概念越推越快，所以刻度越写越宽，否则后面一条比一条快。
  const DIALECT_READERS = [2165, 2665, 6290];
  const CONCEPT_READERS = [3960, 8070];
  const COMPRESS_USE = [11200, 14030, 16860, 19690, 22520];
  const AHA_CLOCK = {
    // 第二章：报纸的读者是这一章的钟。
    A04:['readers',120], A05:['readers',270], A07:['readers',590], A08:['readers',740],
    A09:['readers',890], A10:['readers',1340], A11:['readers',1790],
    // 第三章：第一条刻度由 `discover-dialect` 自己读 DIALECT_READERS。
    A12:['readers',DIALECT_READERS[1]], A13:['readers',CONCEPT_READERS[0]],
    A14:['readers',5960], A15:['readers',CONCEPT_READERS[1]], A16:['readers',10950],
    // 第四章：Agent 写稿的速度就是这一章的钟。Agent 会自己繁殖，写稿越来越快，
    // 所以刻度要按「那时候的写稿速度」写：一步大约 280 秒。
    A17:['overnightArticles',140], A18:['overnightArticles',280], A20:['overnightArticles',3700],
    A21:['overnightArticles',6470], A22:['overnightArticles',9660],
    // 第五章：机器用量。压缩的次数自己也是一条阶梯，见 COMPRESS_USE。
    A23:['machineGlyphUse',COMPRESS_USE[0]], A25:['machineGlyphUse',33800],
    // 第六章：歧义。
    A27:['ambiguity',2450], A28:['ambiguity',3850],
  };

  // 每条 Aha 的门槛，和 trigger() 是同一个条件，只是写成可展示的「字段 × 目标值」。
  // 只给评审面用：玩家面看到 28 条待办清单等于把整个游戏的发现过程剧透掉。
  // 放在 ACT_GATES 之前：幕门槛直接引用这里的数字，两处不许各写一份。
  const AHA_GOALS = {
    A01:{key:'rate',need:1}, A02:{key:'typists',need:8}, A03:{key:'published',need:1},
    A04:{key:'composed',need:3}, A05:{key:'meaning',need:10}, A06:{key:'readers',need:440},
    A07:{key:'letters',need:1}, A08:{key:'organicWords',need:1}, A09:{key:'viralWords',need:1},
    A10:{key:'paperCrisis',need:1}, A11:{key:'deletedNoise',need:1}, A12:{key:'districts',need:2},
    A13:{key:'concepts',need:1}, A14:{key:'worldScale',need:1}, A15:{key:'worldScale',need:2},
    A16:{key:'agents',need:1}, A17:{key:'editorAutonomy',need:1}, A18:{key:'agentFactories',need:1},
    A19:{key:'overnightArticles',need:1800}, A20:{key:'digital',need:1}, A21:{key:'archives',need:1},
    A22:{key:'machineGlyphs',need:1}, A23:{key:'machineGlyphUse',need:COMPRESS_USE[0]}, A24:{key:'compressedMeaning',need:50000},
    A25:{key:'infrastructure',need:1}, A26:{key:'ambiguity',need:1100}, A27:{key:'deletedNoise',need:1000},
    A28:{key:'stopped',need:1},
  };

  const ACT_GATES = {
    1: [
      { key:'lifetimeGlyphs', need:32000, label:'累计印字', labelEn:'Lifetime glyphs' },
      { key:'presses', need:1, label:'小型印刷机', labelEn:'Printing presses' },
      { key:'glyphs', need:200, label:'库存字', labelEn:'Glyph stock' },
      { key:'credits', need:300, label:'工坊资金', labelEn:'Workshop credits' },
    ],
    // 顺序就是这一章的发现顺序：先懂「意义比字数值钱」，再遇到纸张危机，最后学会删。
    // 玩家看到的「下一个阶段 还差 …」是按这个顺序逐条点亮的，第一句提示不会再是这一章
    // 最后才会发生的那件事。
    // 门槛不再单独要「意义」。它一旦写在这里，玩家就会在等读者的那几拍里一口气把整章的
    // 意义攒够，后面两三条发现的钱是提前付掉的，间隔随之塌成 1 下。意义现在只由发现本身
    // 消费：每一次都要现挣。
    2: [
      { key:'composed', need:10, label:'组合字', labelEn:'Composed glyphs' },
      { key:'paperCrisis', need:1, label:'纸张危机', labelEn:'Paper crisis' },
      { key:'deletedNoise', need:1, label:'已删除噪音', labelEn:'Noise deleted' },
    ],
    3: [{ key:'worldScale', need:2, label:'地图范围', labelEn:'Map scale' }],
    4: [
      { key:'archives', need:4, label:'档案记忆', labelEn:'Archive memory' },
      { key:'agentFactories', need:2, label:'智能体工厂', labelEn:'Agent factories' },
    ],
    5: [{ key:'compressedMeaning', need:AHA_GOALS.A24.need, label:'已压缩意义', labelEn:'Compressed meaning' }],
    6: [
      { key:'deletedNoise', need:1000, label:'已删除噪音', labelEn:'Noise deleted' },
      { key:'compressedMeaning', need:AHA_GOALS.A24.need, label:'已压缩意义', labelEn:'Compressed meaning' },
      // The world cannot be declared finished while it is still ambiguous. Without this the
      // last act took about a second: `deletedNoise` carries over from ACT II, so the stop
      // gate was already satisfied on arrival and the player could finish without ever
      // discovering that ambiguity is a resource.
      { key:'ambiguityResolved', need:1, label:'已消解歧义', labelEn:'Ambiguity resolved' },
    ],
  };

  // 布尔门槛当作 0/1 计数，于是进度条不需要为「已发行 / 未发行」写特例。
  const goalValue = (g, key) => {
    if (key === 'rate') return rate(g);
    const raw = g[key];
    if (typeof raw === 'boolean') return raw ? 1 : 0;
    return num(raw);
  };

  // 幕转换只认这一份门槛。这些条件原先在动作里各写一遍（`paperCrisis && meaning>=50 &&
  // deletedNoise>=1` 之类），于是进度条说「还差一步」而按钮已经能按——两处数字会各自漂移。
  // 这条发现的钟走到哪了。没写进 AHA_CLOCK 的（结局、以及门槛本身就是一个会长的数的那几条）
  // 一律算已到——它们的时间写在 trigger 或命令代价里，不再重复一遍。
  const clockMet = (g, id) => { const c = AHA_CLOCK[id]; return !c || goalValue(g, c[0]) >= c[1]; };

  const gateMet = (g, act) => {
    const gates = ACT_GATES[act];
    return !!gates && gates.every((c) => goalValue(g, c.key) >= c.need);
  };

  // 返回当前阶段的全部门槛（已标注是否达成）以及**第一条未达成项**。
  // 取「第一条」而不是「进度最低的一条」：门槛是有顺序的清单，逐条从左往右点亮，
  // 进度条上的 now 标记必须和文字说的是同一条。按比例挑会跳到某个 0 进度的后置条件上
  // （刚印了六个字，提示却变成「还差 小型印刷机 0/1」），读起来像卡住了。
  function gateProgress(g) {
    const act = actIndex(g);
    const gates = ACT_GATES[act];
    if (!gates) return null;
    const conds = gates.map((c) => {
      const have = goalValue(g, c.key);
      return { ...c, have, met: have >= c.need };
    });
    const binding = conds.find((c) => !c.met) || null;
    return { act, done: !binding, binding, conds };
  }

  // 每个动作的资源门槛，在这里写一次。渲染层读它决定按钮是否置灰——否则按钮会在引擎拒绝
  // 它的时候依然是亮的，而本仓库的披露契约要求「买不起就置灰」，不是「点了没反应」。
  // 幕判断和一次性判断（act >= N、!g.digital 之类）不在这里，那些是条件不是代价。
  const at = (list, i) => list[Math.min(Math.max(i, 0), list.length - 1)];
  const COMMAND_COSTS = {
    'read-letter': () => [['readers', AHA_CLOCK.A07[1]], ['meaning', 35]],
    'viral-word': () => [['organicWords', 1], ['meaning', 70], ['readers', AHA_CLOCK.A09[1]]],
    'compose-rule': () => [['glyphs', 2], ['credits', 40], ['readers', AHA_CLOCK.A04[1]]],
    'condense': () => [['glyphs', 20], ['credits', 60], ['readers', AHA_CLOCK.A05[1]]],
    'organic-word': () => [['letters', 1], ['meaning', 55], ['credits', 120], ['readers', AHA_CLOCK.A08[1]]],
    'discover-dialect': (g) => {
      const d = integer(g.districts, 1000);
      return [['meaning', 40], ['readers', at(DIALECT_READERS, d)], ['credits', 120 * (d + 1)]];
    },
    'make-concept': (g) => {
      const c = integer(g.concepts, 1000);
      return [['meaning', 50], ['districts', c + 2], ['credits', 200 * (c + 1)], ['readers', at(CONCEPT_READERS, c)]];
    },
    'editor-autonomy': () => [['meaning', 40], ['credits', 300], ['overnightArticles', AHA_CLOCK.A17[1]]],
    'spawn-agents': (g) => {
      const f = integer(g.agentFactories, 10000);
      return [['meaning', 80 + f * 60], ['credits', Math.ceil(500 * 1.5 ** Math.min(f, 30))], ['overnightArticles', AHA_CLOCK.A18[1]]];
    },
    'train-memory': (g) => [['meaning', 80], ['credits', Math.ceil(500 * 2 ** Math.min(integer(g.archives, 1e6), 20))], ['overnightArticles', AHA_CLOCK.A21[1]]],
    // 压缩的是机器已经在用的语言：字形刚被发现、还没有任何机器在用它的时候，
    // 「语义压缩」压的是空气。这个门槛同时把 A23 排在 A24 前面——否则一台机器还没开口，
    // 玩家就已经把它的语言折叠成一个符号了。
    // 它还是一段阶梯：压一次就把下一次的机器用量门槛再抬高一级，所以「意义被压成一个
    // 符号」不是一口气按五下，而是五次各自等机器用够。
    'compress-language': (g) => [['machineGlyphUse', at(COMPRESS_USE, integer(g.compressedMeaning / 1e4, 1e6))], ['meaning', 100], ['credits', 300]],
    'map-city': () => [['districts', 2], ['meaning', 40], ['credits', 150], ['readers', AHA_CLOCK.A14[1]]],
    // 不能写成 ...ACT_GATES[3]：那个门槛要的正是 worldScale 2，也就是这个动作自己要产生的东西，
    // 写上去按钮永远灰着（引擎会一直说「还差 地图范围 1/2」，而这条动作就是去把它变成 2 的）。
    'map-world': () => [['concepts', WORLD_GATE.concepts], ['districts', WORLD_GATE.districts], ['readers', AHA_CLOCK.A15[1]]],
    // 数字出版不是「买了机器就能切」的开关：得先有东西值得从仓库里搬出来。
    // 门槛同时把 A20 排在 A19 后面（文章堆满桌子之后，仓库才显得多余）。
    'digitize': () => [['overnightArticles', AHA_CLOCK.A20[1]], ['meaning', 120], ['agentFactories', 1]],
    'discover-machine-glyph': () => [...ACT_GATES[4].map((c) => [c.key, c.need]), ['overnightArticles', AHA_CLOCK.A22[1]]],
    // 第六章的批量删除要先能分辨噪音。歧义没消解的时候，玩家分不清哪句该删——
    // 这也是把 A27 排在 A26 后面的那条边。
    'delete-noise': (g) => (g.act >= 6 ? [['noise', 1], ['ambiguityResolved', 1], ['ambiguity', AHA_CLOCK.A27[1]]]
      : (g.act === 2 ? [['noise', 1], ['paperCrisis', 1], ['readers', AHA_CLOCK.A11[1]]] : [['noise', 1]])),
    'infrastructure': () => [['meaning', 400], ['credits', 2000], ['machineGlyphUse', AHA_CLOCK.A25[1]]],
    'resolve-ambiguity': () => [['ambiguity', AHA_GOALS.A26.need]],
    'launch-agents': () => [...ACT_GATES[3].map((c) => [c.key, c.need]), ['meaning', 60], ['credits', 600], ['readers', AHA_CLOCK.A16[1]]],
    'stop-printing': () => [...ACT_GATES[6].map((c) => [c.key, c.need]), ['ambiguity', AHA_CLOCK.A28[1]]],
  };

  // 门槛字段的玩家语言名字。按钮的「还差 …」和历史行的进度条共用这一份，不再各写一套。
  const FIELD_LABELS = {
    lifetimeGlyphs:['累计印字','Lifetime glyphs'], presses:['小型印刷机','Printing presses'],
    glyphs:['库存字','Glyph stock'], credits:['工坊资金','Workshop credits'],
    paperCrisis:['纸张危机','Paper crisis'], meaning:['意义','Meaning'],
    deletedNoise:['已删除噪音','Noise deleted'], worldScale:['地图范围','Map scale'],
    archives:['档案记忆','Archive memory'], agentFactories:['智能体工厂','Agent factories'],
    compressedMeaning:['已压缩意义','Compressed meaning'], ambiguityResolved:['已消解歧义','Ambiguity resolved'],
    readers:['读者','Readers'], districts:['街区','Districts'], concepts:['概念','Concepts'],
    letters:['读者来信','Reader letters'], organicWords:['自造词','Coined words'],
    viralWords:['传播中的词','Words in circulation'], ambiguity:['歧义','Ambiguity'],
    overnightArticles:['夜间文章','Overnight articles'], machineGlyphUse:['机器用量','Machine use'],
    rate:['自动产量','Automatic rate'],
  };
  const fieldLabel = (key, en) => { const pair = FIELD_LABELS[key]; return pair ? (en ? pair[1] : pair[0]) : key; };

  // 已经用掉的一次性动作不再算「就绪」。留着亮按钮等于告诉玩家还能再按一次，而引擎会
  // 静默拒绝——这正是「按钮亮着但点了没反应」那类问题的反方向版本。
  const COMMAND_SPENT = {
    'map-city': (g) => Boolean(g.worldScale),
    'map-world': (g) => g.worldScale >= 2,
    'launch-agents': (g) => integer(g.agents, 1e7) >= 1,
    'editor-autonomy': (g) => Boolean(g.editorAutonomy),
    'digitize': (g) => Boolean(g.digital),
    'discover-machine-glyph': (g) => integer(g.machineGlyphs, 1e9) >= 1,
    'infrastructure': (g) => Boolean(g.infrastructure),
    'stop-printing': (g) => Boolean(g.stopped),
  };

  // 删除这个动词在每一幕解锁的条件不同，写一处：第二章要等纸张危机（先知道写多了会坏事，
  // 才学得会删），第六章要等歧义消解（分不清哪句是噪音就没法删），中间几幕随时可用。
  const deleteUnlocked = (g) => (g.act >= 6 ? g.ambiguityResolved : (g.act === 2 ? g.paperCrisis : true));

  // 与 gateProgress 同形：返回是否就绪、以及第一条未达成的门槛，渲染层直接拿它写「还差 …」。
  function commandReady(g, type) {
    const spent = COMMAND_SPENT[type] ? COMMAND_SPENT[type](g) : false;
    const spec = COMMAND_COSTS[type];
    if (!spec) return { ready: !spent, spent, binding: null, conds: [] };
    const conds = spec(g).map(([key, need]) => {
      const have = goalValue(g, key);
      return { key, need, have, met: have >= need };
    });
    const binding = conds.find((c) => !c.met) || null;
    return { ready: !spent && !binding, spent, binding, conds };
  }

  function ahaGoal(g, id) {
    const goal = AHA_GOALS[id];
    if (!goal) return null;
    return { have: goalValue(g, goal.key), need: goal.need, key: goal.key, done: goalValue(g, goal.key) >= goal.need };
  }

  function act(state, command, now = Date.now()) {
    let g = advance(state, now);
    const type = command && command.type;
    if (g.stopped && type !== 'reset') return g;
    if (type === 'print') {
      const n = g.manualBoost ? 4 : 1; g = { ...g, glyphs:num(g.glyphs+n), lifetimeGlyphs:num(g.lifetimeGlyphs+n) };
    } else if (type === 'sell' && !g.digital) {
      const sold = Math.floor(g.glyphs); if (sold > 0) g = { ...g, glyphs:g.glyphs-sold, credits:num(g.credits+sold*PRICE) };
    } else if (type === 'buy') {
      const u = UNITS.find((v) => v.id === command.id); const c = cost(g, command.id);
      if (u && g.lifetimeGlyphs >= u.unlock && g.credits >= c && g[u.id] < 10000) g = note({ ...g, credits:g.credits-c, [u.id]:g[u.id]+1 }, `购入${u.name}。`);
    } else if (type === 'boost' && !g.manualBoost && g.lifetimeGlyphs >= 150 && g.credits >= 45) {
      g = note({ ...g, credits:g.credits-45, manualBoost:true }, '复写纸研发完成。');
    } else if (type === 'research-auto' && !g.autoSellUnlocked && g.lifetimeGlyphs >= 300 && g.credits >= 60) {
      g = note({ ...g, credits:g.credits-60, autoSellUnlocked:true }, '自动售货台研发完成。');
    } else if (type === 'toggle-auto' && g.autoSellUnlocked) {
      g = { ...g, autoSell:!g.autoSell };
    } else if (type === 'contract') {
      const c = CONTRACTS[g.contracts]; if (c && g.glyphs >= c.glyphs) g = note({ ...g, glyphs:g.glyphs-c.glyphs, credits:num(g.credits+c.reward), contracts:g.contracts+1 }, `完成委托「${c.name}」。`);
    } else if (type === 'publish' && canPublish(g)) {
      g = note({ ...g, glyphs:g.glyphs-200, credits:g.credits-300, published:true, act:2, readers:20, demand:1 }, '《明日》发行。第一章不是终点：字开始自己生长。');
    } else if (type === 'compose-rule' && g.act >= 2 && g.glyphs >= 2 && g.credits >= 40 && g.readers >= AHA_CLOCK.A04[1]) {
      g = note({ ...g, glyphs:g.glyphs-2, credits:num(g.credits-40), composed:g.composed+1, ruleActive:true }, '刻模成功：木 + 木 → 林。');
    } else if (type === 'condense' && g.act >= 2 && g.glyphs >= 20 && g.credits >= 60 && g.readers >= AHA_CLOCK.A05[1]) {
      g = { ...g, glyphs:g.glyphs-20, credits:num(g.credits-60), meaning:num(g.meaning+12), noise:num(g.noise+1) };
    } else if (type === 'read-letter' && g.act >= 2 && g.readers >= AHA_CLOCK.A07[1] && g.meaning >= 35) {
      // 回信不是天上掉下来的：先得有一句值得回的话。这条门槛同时把 A07 和 A05 分开——
      // 原来「打开一封读者来信」自己送 +10 意义，按下它的时候 A05（意义≥10）和 A07（来信≥1）
      // 会同时点亮，玩家一口气收到两个发现。
      // 回信不动读者数：读者在这一章是一条只涨的钟，收信把它减掉的话，后面每一条刻度
      // 都要为这封信多等一次，节奏就随玩家什么时候拆信而变。
      g = { ...g, meaning:num(g.meaning-35), letters:g.letters+1, demand:num(g.demand+2) };
    } else if (type === 'organic-word' && g.letters >= 1 && g.credits >= 120 && g.meaning >= 55 && g.readers >= AHA_CLOCK.A08[1]) {
      // 让读者造词要花意义：这是编辑部替语言做的一次选择，不是一次点击的副产品。
      // 第二章的动词因此有了自己的节拍——每一个发现都要先用「压缩」把废话变成意义，
      // 而不是读者数字涨到了就自动发生。
      g = { ...g, meaning:num(g.meaning-55), credits:num(g.credits-120), organicWords:g.organicWords+1, demand:num(g.demand+1.5) };
    } else if (type === 'viral-word' && g.organicWords >= 1 && g.readers >= AHA_CLOCK.A09[1] && g.meaning >= 70) {
      // 传播同样是选择：把哪一个词推出去，是这一章里唯一需要判断的动作。
      // 它不再一次送 750 个读者——那会让 A09→A10 只剩 87 秒——而是把自然增速翻三倍，
      // 也就是这条发现自己说的那句话：传播速度登场。后面的刻度为此写得更宽。
      g = { ...g, meaning:num(g.meaning-70), viralWords:g.viralWords+1, demand:num(g.demand+3) };
    } else if (type === 'delete-noise' && g.noise >= 1 && deleteUnlocked(g)
               && (g.act === 2 ? g.readers >= AHA_CLOCK.A11[1] : (g.act >= 6 ? g.ambiguity >= AHA_CLOCK.A27[1] : true))) {
      // 第六章一次删 250：这一章的动词是删，收尾的几下要按得住手。
      // 500 的时候「消解歧义」送的 250 加两下就到门槛，整章只剩 4 次决策。
      const amount = Math.min(g.noise, command.amount || (g.act >= 6 ? 250 : 5)); g = { ...g, noise:g.noise-amount, deletedNoise:num(g.deletedNoise+amount), meaning:num(g.meaning+amount*0.05) };
    } else if (type === 'map-city' && g.act >= 3 && !g.worldScale && g.districts >= 2 && g.credits >= 150 && g.meaning >= 40 && g.readers >= AHA_CLOCK.A14[1]) {
      // 地图是第三章里画出来的东西，不是幕转换。要先有两种以上街区，地图上才有东西可看。
      // 门槛写进 COMMAND_COSTS，按钮就会置灰写着「还差 街区 1/2」，而不是点了没反应。
      g = note({ ...g, meaning:num(g.meaning-40), credits:num(g.credits-150), worldScale:1 }, '地图展开了：你的工坊在里面，只是一个小方块。');
    } else if (type === 'discover-dialect' && g.act >= 3) {
      // A dialect is grown by a population, not minted by a button. The readership floor is
      // what gives ACT III a clock: readers accrue on their own, and every district feeds
      // readership back, so the act compounds instead of collapsing into one click per insight.
      const d = integer(g.districts, 1000);
      const readersNeeded = at(DIALECT_READERS, d);
      const creditCost = 120 * (d + 1);
      if (g.readers >= readersNeeded && g.meaning >= 40 && g.credits >= creditCost) {
        g = { ...g, districts:num(d+1,1000), meaning:num(g.meaning-40), credits:num(g.credits-creditCost) };
      }
    } else if (type === 'make-concept' && g.act >= 3 && g.meaning >= 50 && g.concepts + 1 < g.districts
               && g.credits >= 200 * (integer(g.concepts, 1000) + 1) && g.readers >= at(CONCEPT_READERS, integer(g.concepts, 1000))) {
      // A concept needs a district to live in. Without that, `discover-dialect` handed over
      // exactly the 25 meaning this costs, and the two commands traded one click for one click.
      g = note({ ...g, meaning:num(g.meaning-50), credits:num(g.credits-200*(integer(g.concepts,1000)+1)), concepts:g.concepts+1, societyEffects:g.societyEffects+1 }, '新概念进入城市，行为开始改变。');
    } else if (type === 'map-world' && g.act >= 3 && g.worldScale < 2 && g.concepts >= WORLD_GATE.concepts && g.districts >= WORLD_GATE.districts && g.readers >= AHA_CLOCK.A15[1]) {
      g = { ...g, worldScale:2 };
    } else if (type === 'launch-agents' && g.act >= 3 && g.agents < 1 && gateMet(g, 3) && g.meaning >= 60 && g.credits >= 600 && g.readers >= AHA_CLOCK.A16[1]) {
      // 养一个 Agent 编辑部要先有本钱：这一条让 A16 不是「门槛一达成就顺手按掉」的那一下。
      g = note({ ...g, meaning:num(g.meaning-60), credits:num(g.credits-600), act:4, agents:1 }, '第一名记者 Agent 上线：它自己选择下一篇报道。');
    } else if (type === 'editor-autonomy' && g.act >= 4 && g.agents >= 1 && !g.editorAutonomy && g.meaning >= 40 && g.credits >= 300 && g.overnightArticles >= AHA_CLOCK.A17[1]) {
      // 把否决权交出去是这一章的第二个决定，不能和「上线 Agent」同一口气按完。
      // 换来的是编辑自己攒下的判断力（+100 意义）。
      g = { ...g, meaning:num(g.meaning-40+100), credits:num(g.credits-300), editorAutonomy:true };
    } else if (type === 'spawn-agents' && g.act >= 4 && g.editorAutonomy) {
      // Self-replication has to get more expensive each time it replicates: a flat price is a
      // free faucet, and agentFactories is the multiplier on everything downstream of it.
      const f = integer(g.agentFactories, 10000);
      const meaningCost = 80 + f * 60;
      const creditCost = Math.ceil(500 * 1.5 ** Math.min(f, 30));
      if (g.meaning >= meaningCost && g.credits >= creditCost && g.overnightArticles >= AHA_CLOCK.A18[1]) {
        g = { ...g, meaning:num(g.meaning-meaningCost), credits:num(g.credits-creditCost), agentFactories:f+1, agents:num(g.agents+4,1e7) };
      }
    } else if (type === 'digitize' && g.act >= 4 && !g.digital && g.agentFactories >= 1 && g.meaning >= 120
               && g.overnightArticles >= AHA_CLOCK.A20[1]) {
      // No article grant here: handing over +100 made A19 and A20 fire on the same click, so
      // the player got two world announcements for one decision and could not tell them apart.
      // The agents write on their own clock, so A19 arrives when it actually becomes true.
      g = { ...g, meaning:num(g.meaning-120), digital:true };
    } else if (type === 'train-memory' && g.act >= 4 && g.digital) {
      // Training is the credit sink that keeps the ACT I economy alive after publication.
      const a = integer(g.archives, 1e6);
      const creditCost = Math.ceil(500 * 2 ** Math.min(a, 20));
      // 用过去的文字训练机器，也得先有能过一遍的文字。
      if (g.credits >= creditCost && g.meaning >= 80 && g.overnightArticles >= AHA_CLOCK.A21[1]) g = { ...g, credits:num(g.credits-creditCost), meaning:num(g.meaning-80+500), archives:a+1 };
    } else if (type === 'discover-machine-glyph' && g.act >= 4 && g.machineGlyphs < 1 && gateMet(g, 4) && g.overnightArticles >= AHA_CLOCK.A22[1]) {
      // Seeding machineGlyphUse at 1000 fired A22 and A23 on the same click. The glyph's use
      // is supposed to accumulate after the discovery, so it starts at zero and grows by itself.
      g = note({ ...g, act:5, machineGlyphs:1, machineGlyphUse:0 }, '03:17:42 · 发现未知字形。来源：机器之间。');
    } else if (type === 'compress-language' && g.act >= 5 && g.meaning >= 100 && g.credits >= 300
               && g.machineGlyphUse >= at(COMPRESS_USE, integer(g.compressedMeaning / 1e4, 1e6))) {
      const moved = Math.min(g.meaning, command.amount || 10000); g = { ...g, meaning:g.meaning-moved, credits:num(g.credits-300), compressedMeaning:num(g.compressedMeaning+moved*100) };
    } else if (type === 'infrastructure' && g.act >= 5 && !g.infrastructure && gateMet(g, 5) && g.credits >= 2000 && g.meaning >= 400
               && g.machineGlyphUse >= AHA_CLOCK.A25[1]) {
      // Ambiguity starts below its own threshold: seeding it at 100 fired A25 and A26 together,
      // and "ambiguity is now a resource" only reads as a separate insight once it accumulates.
      g = note({ ...g, act:6, infrastructure:true, ambiguity:60, noise:num(g.noise+1500), credits:num(g.credits-2000), meaning:num(g.meaning-400) }, '语言不再只是内容，它开始驱动城市的系统。');
    } else if (type === 'resolve-ambiguity' && g.act >= 6 && g.ambiguity >= AHA_GOALS.A26.need) {
      // Gated on A26's own threshold, not on `> 0`. Resolving as soon as a trace appears let the
      // player drain ambiguity to zero on the way to the stop gate and finish the game without
      // ever discovering that ambiguity is a resource — a milestone the normal path skipped.
      // Ambiguity has to become a problem before it can be managed.
      const cut = Math.min(g.ambiguity, 25); g = { ...g, ambiguity:g.ambiguity-cut, ambiguityResolved:true, deletedNoise:num(g.deletedNoise+250) };
    } else if (type === 'stop-printing' && g.act >= 6 && gateMet(g, 6) && g.ambiguity >= AHA_CLOCK.A28[1]) {
      g = note({ ...g, stopped:true, autoSell:false }, '世界已经写完了。现在，去读它。');
    }
    return syncAhas(g);
  }

  function directorState(id, now = Date.now()) {
    const target = AHAS.findIndex((a) => a.id === id);
    if (target < 0) return fresh(now);
    let g = fresh(now);
    // 每条快照都要同时满足两件事：那一条发现真的会发生（`trigger` 和 `clockMet` 都过），
    // 而且它的按钮真的能按（代价也够）。钟的刻度从 AHA_CLOCK 里读，不在这里再抄一遍数字——
    // 抄一遍就会在下次调刻度时悄悄对不上，评审面会显示一个「发现还没发生」的存档。
    const clock = (id) => {
      const c = AHA_CLOCK[id];
      if (c) return { [c[0]]: c[1] };
      // 被动发现（A06 读者、A19 夜间文章）的刻度就写在 AHA_GOALS 里，没有单独的钟。
      const goal = AHA_GOALS[id];
      return goal && typeof goal.need === 'number' ? { [goal.key]: goal.need } : {};
    };
    const patches = [
      { keyboards:1, lifetimeGlyphs:10 },
      { keyboards:3, typists:AHA_GOALS.A02.need, lifetimeGlyphs:300 },
      { published:true, act:2, readers:20, demand:1, lifetimeGlyphs:32000, presses:1 },
      { ruleActive:true, composed:3, ...clock('A04') }, { meaning:10, ...clock('A05') },
      { demand:1.2, ...clock('A06') }, { letters:1, ...clock('A07') }, { organicWords:1, ...clock('A08') },
      { viralWords:1, ...clock('A09') },
      { paperCrisis:true, meaning:60, ...clock('A10') }, { noise:10, deletedNoise:1, ...clock('A11') },
      // From ACT III on, every reviewed action costs resources. The review surface exists to
      // demonstrate an action, so it has to arrive able to afford one — a snapshot whose own
      // button is greyed out reviews nothing. Credits and meaning trigger no Aha on their own,
      // and by ACT III every threshold they could cross has already fired.
      // 读者一次给到 200000：第三章以后每条刻度都在读者上，而它只涨不跌，给一个够大的数
      // 比给每条刻度各写一遍更不容易忘。
      { act:3, districts:2, worldScale:1, credits:1e6, meaning:5000, readers:200000 },
      { concepts:1, societyEffects:1 }, { worldScale:1 }, { worldScale:2, districts:4, concepts:2 },
      { act:4, agents:1, credits:1e6, meaning:50000 }, { editorAutonomy:true, ...clock('A17') },
      { agentFactories:1, agents:5, ...clock('A18') }, { ...clock('A19') }, { digital:true, ...clock('A20') },
      { archives:1, ...clock('A21') },
      { act:5, machineGlyphs:1, meaning:100, credits:1e6, ...clock('A22') },
      { ...clock('A23') }, { compressedMeaning:50000, machineGlyphUse: at(COMPRESS_USE, COMPRESS_USE.length - 1) },
      // A28's snapshot has to be one the stop action would actually accept: the world cannot be
      // declared finished while it is still ambiguous, so the review states past A26 carry that.
      { act:6, infrastructure:true, ...clock('A25') }, { ...clock('A26') },
      { deletedNoise:1000, noise:50, ambiguityResolved:true, ...clock('A27') }, { stopped:true, ...clock('A28') },
    ];
    for (let i = 0; i <= target; i++) g = { ...g, ...patches[i] };
    g.act = AHAS[target].act; g.director = true; g.ahaSeen = AHAS.slice(0, target + 1).map((a) => a.id); g.updatedAt = now; g.startedAt = now;
    return syncAhas(g);
  }

  return { VERSION,SAVE_KEY,OFFLINE_CAP,PRICE,RULE_PERIOD,RULE_READERS,UNITS,CONTRACTS,ACTS,AHAS,AHA_WORLD,ACT_GATES,WORLD_GATE,AHA_GOALS,AHA_CLOCK,gateProgress,ahaGoal,commandReady,fieldLabel,fresh,restore,advance,act,rate,cost,actIndex,ahaUnlocked,directorState,canPublish };
})();
if (typeof window !== 'undefined') window.GlyphEngineV3 = GlyphEngineV3;
