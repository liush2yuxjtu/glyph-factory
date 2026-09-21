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
    aha('A19',4,'醒来已有八万篇文章','系统不再需要我值夜班。'),
    aha('A20',4,'数字出版：库存消失','经营多年的仓库突然不重要了。'),
    aha('A21',4,'档案变成机器记忆','过去的每个字，都是训练材料。'),
    aha('A22',5,'出现一个你没造过的字','这个字，不是我造的。','mechanic'),
    aha('A23',5,'机器之间有自己的语言','有些语言已经不是给人看的。'),
    aha('A24',5,'万亿文字压成一个符号','增长最终折叠回一个字。','mechanic'),
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
    A24: '一万亿个字被压成了一个符号。它还在继续变小。',
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
      infrastructure: false, ambiguity: 0, deletedNoise: 0,
      stopped: false, ahaSeen: [], director: false,
      log: ['台灯亮了。点击「印一个字」，开始你的工坊。'],
    };
  }

  function trigger(g, id) {
    switch (id) {
      case 'A01': return rate(g) > 0;
      case 'A02': return g.typists >= 5;
      case 'A03': return g.published;
      case 'A04': return g.ruleActive && g.composed >= 3;
      case 'A05': return g.meaning >= 10;
      case 'A06': return g.readers >= 100;
      case 'A07': return g.letters >= 1;
      case 'A08': return g.organicWords >= 1;
      case 'A09': return g.viralWords >= 1;
      case 'A10': return g.paperCrisis;
      case 'A11': return g.deletedNoise >= 1;
      case 'A12': return g.districts >= 2;
      case 'A13': return g.concepts >= 1;
      case 'A14': return g.worldScale >= 1;
      case 'A15': return g.worldScale >= 2;
      case 'A16': return g.agents >= 1;
      case 'A17': return g.editorAutonomy;
      case 'A18': return g.agentFactories >= 1;
      case 'A19': return g.overnightArticles >= 100;
      case 'A20': return g.digital;
      case 'A21': return g.archives >= 1;
      case 'A22': return g.machineGlyphs >= 1;
      case 'A23': return g.machineGlyphUse >= 1000;
      case 'A24': return g.compressedMeaning >= 10000;
      case 'A25': return g.infrastructure;
      case 'A26': return g.ambiguity >= 100;
      case 'A27': return g.deletedNoise >= 1000;
      case 'A28': return g.stopped;
      default: return false;
    }
  }
  const ahaUnlocked = (g, id) => Array.isArray(g.ahaSeen) && g.ahaSeen.includes(id) || trigger(g, id);

  function syncAhas(state) {
    let g = state;
    const seen = new Set(Array.isArray(g.ahaSeen) ? g.ahaSeen : []);
    for (const item of AHAS) {
      if (!seen.has(item.id) && trigger(g, item.id)) {
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
    for (const key of ['manualBoost','autoSellUnlocked','autoSell','published','ruleActive','paperCrisis','editorAutonomy','digital','infrastructure','stopped','director']) g[key] = value[key] === true;
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
        g.readers = num(g.readers + elapsed * (0.35 + g.composed * RULE_READERS + g.agents * 1.5));
        g.demand = num(Math.max(g.demand, 1 + g.readers / 500));
        g.noise = num(g.noise + elapsed * (g.digital ? 0.8 : 0.08) * Math.max(1, g.agents));
        if (g.readers >= 1000) g.paperCrisis = true;
      }
      if (g.agents > 0) {
        g.meaning = num(g.meaning + elapsed * g.agents * 0.35);
        g.overnightArticles = num(g.overnightArticles + elapsed * g.agents * 0.2);
      }
      if (g.agentFactories > 0) g.agents = num(g.agents + elapsed * g.agentFactories / 120, 1e7);
      if (g.machineGlyphs > 0) g.machineGlyphUse = num(g.machineGlyphUse + elapsed * g.machineGlyphs * (20 + g.agentFactories * 10));
      if (g.infrastructure) g.ambiguity = num(g.ambiguity + elapsed * (0.5 + g.noise / 10000));
      if (g.autoSellUnlocked && g.autoSell && !g.digital) {
        const sold = Math.floor(g.glyphs); g.glyphs -= sold; g.credits = num(g.credits + sold * PRICE);
      }
    }
    return syncAhas(g);
  }

  function canPublish(g) { return !g.published && g.lifetimeGlyphs >= 5000 && g.presses >= 1 && g.glyphs >= 200 && g.credits >= 300; }

  // ── 通往下一阶段的门槛 ────────────────────────────────────────────────────
  // 这些条件原先散在 glyph-game-v3.js 里，每个动作各写一份（cityReady / worldReady /
  // machineReady / stopReady），进度条再抄一遍就会变成第二份真源。收进引擎，渲染层只读。
  const ACT_GATES = {
    1: [
      { key:'lifetimeGlyphs', need:5000, label:'累计印字', labelEn:'Lifetime glyphs' },
      { key:'presses', need:1, label:'小型印刷机', labelEn:'Printing presses' },
      { key:'glyphs', need:200, label:'库存字', labelEn:'Glyph stock' },
      { key:'credits', need:300, label:'工坊资金', labelEn:'Workshop credits' },
    ],
    2: [
      { key:'paperCrisis', need:1, label:'纸张危机', labelEn:'Paper crisis' },
      { key:'meaning', need:50, label:'意义', labelEn:'Meaning' },
      { key:'deletedNoise', need:1, label:'已删除噪音', labelEn:'Noise deleted' },
    ],
    3: [{ key:'worldScale', need:2, label:'地图范围', labelEn:'Map scale' }],
    4: [
      { key:'archives', need:1, label:'档案记忆', labelEn:'Archive memory' },
      { key:'agentFactories', need:1, label:'智能体工厂', labelEn:'Agent factories' },
    ],
    5: [{ key:'compressedMeaning', need:10000, label:'已压缩意义', labelEn:'Compressed meaning' }],
    6: [
      { key:'deletedNoise', need:1000, label:'已删除噪音', labelEn:'Noise deleted' },
      { key:'compressedMeaning', need:10000, label:'已压缩意义', labelEn:'Compressed meaning' },
    ],
  };

  // 每条 Aha 的门槛，和 trigger() 是同一个条件，只是写成可展示的「字段 × 目标值」。
  // 只给评审面用：玩家面看到 28 条待办清单等于把整个游戏的发现过程剧透掉。
  const AHA_GOALS = {
    A01:{key:'rate',need:1}, A02:{key:'typists',need:5}, A03:{key:'published',need:1},
    A04:{key:'composed',need:3}, A05:{key:'meaning',need:10}, A06:{key:'readers',need:100},
    A07:{key:'letters',need:1}, A08:{key:'organicWords',need:1}, A09:{key:'viralWords',need:1},
    A10:{key:'paperCrisis',need:1}, A11:{key:'deletedNoise',need:1}, A12:{key:'districts',need:2},
    A13:{key:'concepts',need:1}, A14:{key:'worldScale',need:1}, A15:{key:'worldScale',need:2},
    A16:{key:'agents',need:1}, A17:{key:'editorAutonomy',need:1}, A18:{key:'agentFactories',need:1},
    A19:{key:'overnightArticles',need:100}, A20:{key:'digital',need:1}, A21:{key:'archives',need:1},
    A22:{key:'machineGlyphs',need:1}, A23:{key:'machineGlyphUse',need:1000}, A24:{key:'compressedMeaning',need:10000},
    A25:{key:'infrastructure',need:1}, A26:{key:'ambiguity',need:100}, A27:{key:'deletedNoise',need:1000},
    A28:{key:'stopped',need:1},
  };

  // 布尔门槛当作 0/1 计数，于是进度条不需要为「已发行 / 未发行」写特例。
  const goalValue = (g, key) => {
    if (key === 'rate') return rate(g);
    const raw = g[key];
    if (typeof raw === 'boolean') return raw ? 1 : 0;
    return num(raw);
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
    } else if (type === 'compose-rule' && g.act >= 2 && g.glyphs >= 2) {
      g = note({ ...g, glyphs:g.glyphs-2, composed:g.composed+1, ruleActive:true }, '刻模成功：木 + 木 → 林。');
    } else if (type === 'condense' && g.act >= 2 && g.glyphs >= 20) {
      g = { ...g, glyphs:g.glyphs-20, meaning:num(g.meaning+12), noise:num(g.noise+1) };
    } else if (type === 'read-letter' && g.act >= 2 && g.readers >= 250) {
      g = { ...g, letters:g.letters+1, meaning:num(g.meaning+10) };
    } else if (type === 'organic-word' && g.letters >= 1) {
      g = { ...g, organicWords:g.organicWords+1, demand:num(g.demand+1.5) };
    } else if (type === 'viral-word' && g.organicWords >= 1) {
      g = { ...g, viralWords:g.viralWords+1, readers:num(g.readers+750), demand:num(g.demand+3) };
    } else if (type === 'delete-noise' && g.noise >= 1) {
      const amount = Math.min(g.noise, command.amount || (g.act >= 6 ? 500 : 5)); g = { ...g, noise:g.noise-amount, deletedNoise:num(g.deletedNoise+amount), meaning:num(g.meaning+amount*0.05) };
    } else if (type === 'map-city' && g.act === 2 && g.paperCrisis && g.meaning >= 50 && g.deletedNoise >= 1) {
      // One district, not two. Granting a second fired A12 (districts>=2) together with A14
      // (worldScale>=1), so "the map appeared" and "districts grow dialects" arrived as one
      // announcement. A dialect is supposed to be something the player goes and observes.
      g = note({ ...g, act:3, districts:1, worldScale:1 }, '城市地图展开：你终于看见了工坊外面的部分。');
    } else if (type === 'discover-dialect' && g.act >= 3) {
      g = { ...g, districts:num(g.districts+1,1000), meaning:num(g.meaning+25) };
    } else if (type === 'make-concept' && g.act >= 3 && g.meaning >= 25) {
      g = note({ ...g, meaning:g.meaning-25, concepts:g.concepts+1, societyEffects:g.societyEffects+1 }, '新概念进入城市，行为开始改变。');
    } else if (type === 'map-world' && g.act === 3 && g.concepts >= 2 && g.districts >= 3) {
      g = { ...g, worldScale:2 };
    } else if (type === 'launch-agents' && g.act === 3 && g.worldScale >= 2) {
      g = note({ ...g, act:4, agents:1 }, '第一名记者 Agent 上线：它自己选择下一篇报道。');
    } else if (type === 'editor-autonomy' && g.act >= 4 && g.agents >= 1) {
      g = { ...g, editorAutonomy:true, meaning:num(g.meaning+100) };
    } else if (type === 'spawn-agents' && g.act >= 4 && g.editorAutonomy) {
      g = { ...g, agentFactories:g.agentFactories+1, agents:num(g.agents+4,1e7) };
    } else if (type === 'digitize' && g.act >= 4 && g.agentFactories >= 1) {
      // No article grant here: handing over +100 made A19 and A20 fire on the same click, so
      // the player got two world announcements for one decision and could not tell them apart.
      // The agents write on their own clock, so A19 arrives when it actually becomes true.
      g = { ...g, digital:true };
    } else if (type === 'train-memory' && g.act >= 4 && g.digital) {
      g = { ...g, archives:g.archives+1, meaning:num(g.meaning+500) };
    } else if (type === 'discover-machine-glyph' && g.act === 4 && g.archives >= 1 && g.agentFactories >= 1) {
      // Seeding machineGlyphUse at 1000 fired A22 and A23 on the same click. The glyph's use
      // is supposed to accumulate after the discovery, so it starts at zero and grows by itself.
      g = note({ ...g, act:5, machineGlyphs:1, machineGlyphUse:0 }, '03:17:42 · 发现未知字形。来源：机器之间。');
    } else if (type === 'compress-language' && g.act >= 5 && g.meaning >= 100) {
      const moved = Math.min(g.meaning, command.amount || 10000); g = { ...g, meaning:g.meaning-moved, compressedMeaning:num(g.compressedMeaning+moved*100) };
    } else if (type === 'infrastructure' && g.act === 5 && g.compressedMeaning >= 10000) {
      // Ambiguity starts below its own threshold: seeding it at 100 fired A25 and A26 together,
      // and "ambiguity is now a resource" only reads as a separate insight once it accumulates.
      g = note({ ...g, act:6, infrastructure:true, ambiguity:60, noise:num(g.noise+1500) }, '语言不再只是内容，它开始驱动城市的系统。');
    } else if (type === 'resolve-ambiguity' && g.act >= 6 && g.ambiguity > 0) {
      const cut = Math.min(g.ambiguity, 25); g = { ...g, ambiguity:g.ambiguity-cut, deletedNoise:num(g.deletedNoise+250) };
    } else if (type === 'stop-printing' && g.act === 6 && g.deletedNoise >= 1000 && g.compressedMeaning >= 10000) {
      g = note({ ...g, stopped:true, autoSell:false }, '世界已经写完了。现在，去读它。');
    }
    return syncAhas(g);
  }

  function directorState(id, now = Date.now()) {
    const target = AHAS.findIndex((a) => a.id === id);
    if (target < 0) return fresh(now);
    let g = fresh(now);
    const patches = [
      { keyboards:1, lifetimeGlyphs:10 },
      { keyboards:3, typists:5, lifetimeGlyphs:300 },
      { published:true, act:2, readers:20, demand:1, lifetimeGlyphs:5000, presses:1 },
      { ruleActive:true, composed:3 }, { meaning:10 }, { readers:100, demand:1.2 }, { readers:250, letters:1 }, { organicWords:1 }, { viralWords:1, readers:1000 },
      { paperCrisis:true, readers:1200, meaning:60 }, { noise:10, deletedNoise:1 },
      { act:3, districts:2, worldScale:1 }, { concepts:1, societyEffects:1 }, { worldScale:1 }, { worldScale:2, districts:4, concepts:2 },
      { act:4, agents:1 }, { editorAutonomy:true }, { agentFactories:1, agents:5 }, { overnightArticles:100 }, { digital:true }, { archives:1 },
      { act:5, machineGlyphs:1, meaning:100 }, { machineGlyphUse:1000 }, { compressedMeaning:10000 },
      { act:6, infrastructure:true }, { ambiguity:100 }, { deletedNoise:1000, noise:50 }, { stopped:true },
    ];
    for (let i = 0; i <= target; i++) g = { ...g, ...patches[i] };
    g.act = AHAS[target].act; g.director = true; g.ahaSeen = AHAS.slice(0, target + 1).map((a) => a.id); g.updatedAt = now; g.startedAt = now;
    return syncAhas(g);
  }

  return { VERSION,SAVE_KEY,OFFLINE_CAP,PRICE,RULE_PERIOD,RULE_READERS,UNITS,CONTRACTS,ACTS,AHAS,AHA_WORLD,ACT_GATES,AHA_GOALS,gateProgress,ahaGoal,fresh,restore,advance,act,rate,cost,actIndex,ahaUnlocked,directorState,canPublish };
})();
if (typeof window !== 'undefined') window.GlyphEngineV3 = GlyphEngineV3;
