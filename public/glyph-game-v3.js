(() => {
  'use strict';
  const E = window.GlyphEngineV3;
  if (!E) throw new Error('GlyphEngineV3 failed to load');
  const $ = (id) => document.getElementById(id);
  // Read lazily: the privacy layer marks the audience when it runs, which can be after this script.
  const isPlayerAudience = () => document.documentElement.dataset.audience === 'player';
  const LOCALE_KEY = 'glyph-factory-locale-v3';
  const OLD_SAVE_KEY = 'glyph-factory-save-v1';
  const REVEAL_KEY = 'glyph-factory-ui-reveals-v3';
  let locale = 'zh-CN';
  try { locale = localStorage.getItem(LOCALE_KEY) || (navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'); } catch { locale = 'zh-CN'; }

  const I18N = {
    zh: { director:'导演模式', business:'营业中', inventory:'库存文字', credits:'工坊资金', readers:'读者', meaning:'意义', noise:'噪音', systems:'系统 / SYSTEMS', systemsNote:'系统一旦出现，就留在桌面上。', log:'工坊日志', export:'导出存档', reset:'重新开始', save:'已自动保存 · 当前浏览器 · 最多结算离线 8 小时', preview:'只预览', apply:'应用到存档', exit:'返回真实进度', next:'NEXT', seen:'已发生', locked:'未发生', done:'已完成', need:'暂不可用' },
    en: { director:'Director Mode', business:'OPEN', inventory:'Glyph inventory', credits:'Workshop credits', readers:'Readers', meaning:'Meaning', noise:'Noise', systems:'Systems', systemsNote:'Once a system appears, it stays on the table.', log:'Workshop log', export:'Export save', reset:'Start over', save:'Autosaved · this browser · up to 8 hours offline', preview:'Preview only', apply:'Apply to save', exit:'Back to real progress', next:'NEXT', seen:'SEEN', locked:'LOCKED', done:'Done', need:'Not ready' }
  };
  const ACT_EN = { 1:['Hands → Automation','Print by hand. Then make repetition disappear.'], 2:['Words Begin to Grow','Relationships, readers, meaning and noise become machines.'], 3:['Words Change the City','Language stops being inventory and starts changing society.'], 4:['Machines Begin to Write','Delegate judgment, then delegate the ability to create delegates.'], 5:['Machine Language','The system invents symbols that humans did not design.'], 6:['From Growth to Silence','Optimization flips from making more to removing noise.'] };
  const ACT_ZH = { 1:['手工与自动化','先亲手印。然后让机器接管重复劳动。'], 2:['字开始生长','关系、读者、意义和噪音，都开始成为机器。'], 3:['文字改变城市','文字不再是库存，而开始改变社会。'], 4:['机器开始写','把判断交出去，再把“创造代理”的权力交出去。'], 5:['机器语言','系统开始创造人类没有设计过的符号。'], 6:['从增长到沉默','优化目标从“制造更多”翻转成“删除噪音”。'] };
  const AHA_EN = {
    A01:['The machine clicks for me','My job is not clicking. It is designing growth.'], A02:['Workers become an institution','People are not numbers. Organization is a machine.'], A03:['木 + 木 → 林','Relationships between glyphs can become machines.'], A04:['Rules run themselves','Machines now manufacture writing-machines.'], A05:['Meaning beats volume','A thousand empty glyphs can be worth less than one important sentence.'], A06:['The newspaper creates demand','Words manufacture the need for more words.'], A07:['Readers write back','Consumers become producers.'], A08:['Readers invent words','Language starts leaving the factory.'], A09:['A word goes viral','Propagation replaces production speed.'], A10:['Paper crisis: write less','The metric flips from glyphs/sec to meaning/glyph.'], A11:['Deletion becomes valuable','The enemy is no longer scarcity. It is noise.'], A12:['Districts grow dialects','The same glyph no longer means the same thing everywhere.'], A13:['A concept changes the city','Words turn from products into world rules.'], A14:['The city map appears','The workshop was only one point in the world.'], A15:['The map zooms out','The real factory is the communication network.'], A16:['Reporter Agent chooses a story','I am no longer the author.'], A17:['The editor says “no”','Automation is delegated judgment, not a faster button.'], A18:['Agents create agents','The factory expands itself.'], A19:['Wake up to a desk full of articles','The system no longer needs the night shift.'], A20:['Digital publishing removes inventory','The warehouse suddenly stops mattering.'], A21:['Archives become memory','Everything written before becomes training material.'], A22:['A glyph you never made appears','This glyph was not made by me.'], A23:['Machines have their own language','Some language is no longer written for humans.'], A24:['Meaning folds into one symbol','Growth folds back into a single glyph.'], A25:['Language becomes infrastructure','I am not a publisher. I am running an operating layer.'], A26:['New resource: ambiguity','More words can make the world less clear.'], A27:['The objective flips to deletion','Infinite production can end in noise.'], A28:['The last button: stop printing','The world has been written. Now go read it.']
  };
  const ACTIONS = { print:['印字','Print glyphs'], sell:['出售全部库存','Sell all inventory'], boost:['研发复写纸','Research carbon paper'], autoResearch:['研发自动出售','Research auto-sell'], autoToggle:['切换自动出售','Toggle auto-sell'], contract:['交付街角委托','Deliver street order'], publish:['发行《明日》','Publish Tomorrow'], compose:['刻模：木 + 木 → 林','Carve rule: 木 + 木 → 林'], condense:['压缩 20 字 → 12 意义','Condense 20 glyphs → 12 meaning'], letter:['打开一封读者来信','Open a reader letter'], organic:['允许读者造一个新词','Let readers coin a word'], viral:['让这个词传播','Let the word spread'], delete:['删除噪音','Delete noise'], city:['展开城市地图','Open city map'], dialect:['观察一个新方言','Discover a dialect'], concept:['创造一个概念','Create a concept'], world:['把地图缩到世界','Zoom out to the world'], agents:['上线记者 Agent','Launch reporter Agent'], editor:['给编辑 Agent 否决权','Give editor veto power'], spawn:['允许 Agent 创建 Agent','Let agents create agents'], digitize:['切换数字出版','Switch to digital publishing'], memory:['用档案训练机器','Train on the archive'], machine:['检查未知字形 ◫','Inspect unknown glyph ◫'], compress:['语义压缩','Semantic compression'], infra:['让语言接管基础设施','Make language infrastructure'], ambiguity:['消解 25 歧义','Resolve 25 ambiguity'], stop:['停止印刷','STOP PRINTING'] };
  const tr = (key) => I18N[locale === 'en' ? 'en' : 'zh'][key] || key;
  const label = (pair) => locale === 'en' ? pair[1] : pair[0];
  const fmt = (n, digits = 0) => { if (!Number.isFinite(n)) return '0'; if (Math.abs(n) >= 1e12) return `${(n/1e12).toFixed(1)}T`; if (Math.abs(n) >= 1e9) return `${(n/1e9).toFixed(1)}B`; if (Math.abs(n) >= 1e6) return `${(n/1e6).toFixed(1)}M`; if (Math.abs(n) >= 1e3) return `${(n/1e3).toFixed(1)}K`; return n.toLocaleString(locale, { maximumFractionDigits: digits }); };

  let g = load();
  let preview = null;
  let previewId = null;
  function selectPreview(id) { preview = E.directorState(id); previewId = id; }
  let directorOpen = new URLSearchParams(location.search).get('director') === '1';
  let lastSaved = 0;
  let revealed = loadReveals();

  function load() { try { const current = localStorage.getItem(E.SAVE_KEY); if (current) return E.restore(current); const old = localStorage.getItem(OLD_SAVE_KEY); if (old) return E.restore(old); } catch {} return E.fresh(); }
  function loadReveals() { try { const raw=JSON.parse(localStorage.getItem(REVEAL_KEY)||'[]'); return new Set(Array.isArray(raw)?raw.filter((x)=>typeof x==='string'):[]); } catch { return new Set(); } }
  function saveReveals() { try { localStorage.setItem(REVEAL_KEY, JSON.stringify([...revealed])); } catch {} }
  function rememberReveal(key, condition = false) { if (preview) return true; if (condition && !revealed.has(key)) { revealed.add(key); saveReveals(); } return revealed.has(key); }
  function clearReveals() { revealed = new Set(); try { localStorage.removeItem(REVEAL_KEY); } catch {} }
  const shown = () => preview || g;
  function save(force = false) { if (preview || (!force && Date.now() - lastSaved < 1800)) return; try { localStorage.setItem(E.SAVE_KEY, JSON.stringify(g)); $('save-status').textContent = tr('save'); } catch { $('save-status').textContent = locale === 'en' ? 'Saving is blocked; export a backup.' : '浏览器阻止存档，请导出备份。'; } lastSaved = Date.now(); }
  function notice(text) { $('notice').textContent = text || ''; }
  function perform(type, props = {}) { if (preview) preview = E.act(preview, { type, ...props }); else { g = E.act(g, { type, ...props }); save(true); } render(); }
  function ahaCopy(item) { if (locale === 'en' && AHA_EN[item.id]) return AHA_EN[item.id]; return [item.title, item.reveal]; }
  // The focus card answers "what just happened", not "what is the highest-numbered thing you
  // have ever seen". Scanning catalogue order and keeping the last hit meant a later-numbered
  // Aha permanently shadowed an earlier one that fired seconds after it — 11 of the 28 never
  // appeared here at all. `ahaSeen` is appended in firing order by syncAhas(), so its tail is
  // the most recent one.
  function currentAha(s) {
    if (preview) { const selected = previewId; return E.AHAS.find((a) => a.id === selected) || E.AHAS[0]; }
    const seen = Array.isArray(s.ahaSeen) ? s.ahaSeen : [];
    if (seen.length) return E.AHAS.find((a) => a.id === seen[seen.length - 1]) || E.AHAS[0];
    return E.AHAS.find((a) => E.ahaUnlocked(s, a.id)) || E.AHAS[0];
  }
  function actCopy(s) { return (locale === 'en' ? ACT_EN : ACT_ZH)[s.act] || (locale === 'en' ? ACT_EN[1] : ACT_ZH[1]); }

  // Paperclips rule: hidden -> revealed -> persistent. Temporary scarcity never hides a discovered surface.
  function renderActs(s) {
    const visibleActs = preview ? E.ACTS : E.ACTS.filter((act) => act.id <= s.act);
    $('act-strip').replaceChildren(...visibleActs.map((act) => { const div = document.createElement('div'); div.className = `act-chip ${act.id === s.act ? 'current' : act.id < s.act ? 'done' : ''}`; const name = locale === 'en' ? ACT_EN[act.id][0] : act.name; div.innerHTML = `<b>ACT ${['I','II','III','IV','V','VI'][act.id-1]} · ${name}</b><span>${act.range}</span>`; return div; }));
  }
  // Pixel world stage: one 96×40 scene per world scale, drawn once per change. Colours are the
  // design system's world-* tokens (docs/design-system-pixel), so the scene follows the theme.
  const SPRITE = {
    lamp: ['...kkkkkk...','..kyyyyyyk..','.kyyyyyyyyk.','kkkkkkkkkkkk','....y..y....','...y....y...','.....kk.....','.....kk.....','.....kk.....','.....kk.....','...kkkkkk...','..kkkkkkkk..'],
    keyboard: ['............','............','............','kkkkkkkkkkkk','kwkwkwkwkwkk','kkkkkkkkkkkk','kwkwkwkwkwkk','kkkkkkkkkkkk','kwkwwwwwwkwk','kkkkkkkkkkkk','............','............'],
    press: ['..kkkkkkkk..','..kbbbbbbk..','..kbkkkkbk..','kkkkkkkkkkkk','kwwwwwwwwwwk','kwkkwkkwkkwk','kwwwwwwwwwwk','kkkkkkkkkkkk','.k........k.','.k........k.','kkk......kkk','............'],
    agent: ['.....kk.....','.....ak.....','..kkkkkkkk..','..kwwwwwwk..','..kwakkawk..','..kwwwwwwk..','..kwkkkkwk..','..kkkkkkkk..','.kkwwwwwwkk.','.k.kwwwwk.k.','...kwwwwk...','...kk..kk...'],
  };
  const WORLD_INK = { k:'var(--world-block)', w:'var(--world-light)', b:'var(--world-block-2)', y:'var(--lamp)', a:'var(--accent)' };
  let sceneKind = '';
  function pixelRect(x, y, w, h, fill) { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`; }
  function spriteRects(rows, ink, ox, oy) {
    let out = '';
    rows.forEach((row, y) => { for (let x = 0; x < row.length;) { const ch = row[x]; if (ch === '.') { x++; continue; } let run = 1; while (x + run < row.length && row[x + run] === ch) run++; out += pixelRect(ox + x, oy + y, run, 1, ink[ch]); x += run; } });
    return out;
  }
  function renderScene(kind) {
    if (kind === sceneKind || !$('world-visual')) return;
    sceneKind = kind;
    let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    let g = pixelRect(0, 0, 96, 30, 'var(--world-sky)') + pixelRect(0, 30, 96, 10, kind === 'MACHINE' ? 'var(--world-block)' : 'var(--world-ground)');
    if (kind === 'NETWORK' || kind === 'MACHINE' || kind === 'SILENCE') for (let i = 0; i < 18; i++) g += pixelRect(Math.floor(rnd() * 96), Math.floor(rnd() * 26), 1, 1, 'var(--world-light)');
    const desk = pixelRect(10, 28, 60, 2, 'var(--world-block)') + pixelRect(12, 30, 2, 8, 'var(--world-block)') + pixelRect(66, 30, 2, 8, 'var(--world-block)');
    if (kind === 'DESK') {
      g += desk + spriteRects(SPRITE.lamp, WORLD_INK, 12, 16) + spriteRects(SPRITE.keyboard, WORLD_INK, 28, 18) + spriteRects(SPRITE.press, WORLD_INK, 74, 18);
      g += pixelRect(46, 22, 10, 6, 'var(--world-light)') + pixelRect(47, 20, 10, 2, 'var(--world-light)') + pixelRect(48, 18, 8, 2, 'var(--world-light)');
    } else if (kind === 'CITY') {
      for (let x = 0; x < 96;) {
        const w = 5 + Math.floor(rnd() * 7), h = 8 + Math.floor(rnd() * 18);
        g += pixelRect(x, 30 - h, w, h, rnd() > 0.5 ? 'var(--world-block-2)' : 'var(--world-block)');
        for (let wy = 32 - h; wy < 28; wy += 3) for (let wx = x + 1; wx < x + w - 1; wx += 2) if (rnd() > 0.55) g += pixelRect(wx, wy, 1, 1, rnd() > 0.8 ? 'var(--lamp)' : 'var(--world-light)');
        x += w + 1;
      }
      g += pixelRect(44, 24, 6, 6, 'var(--lamp)') + pixelRect(46, 26, 2, 4, 'var(--world-block)');
    } else if (kind === 'NETWORK') {
      const pts = [[8,22],[22,10],[36,20],[50,8],[62,18],[76,11],[88,23],[48,26]];
      for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; g += pixelRect(Math.min(ax, bx), ay, Math.abs(bx - ax) + 1, 1, 'var(--world-block-2)') + pixelRect(bx, Math.min(ay, by), 1, Math.abs(by - ay) + 1, 'var(--world-block-2)'); }
      pts.forEach(([x, y], j) => { g += pixelRect(x - 1, y - 1, 3, 3, j % 3 ? 'var(--accent)' : 'var(--lamp)'); });
      g += spriteRects(SPRITE.agent, WORLD_INK, 42, 16);
    } else if (kind === 'MACHINE') {
      for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 9; gx++) {
        const ox = 4 + gx * 10, oy = 4 + gy * 9; g += pixelRect(ox, oy, 8, 7, 'var(--world-block)');
        for (let p = 0; p < 9; p++) if (rnd() > 0.45) g += pixelRect(ox + 1 + (p % 3) * 2, oy + 1 + Math.floor(p / 3) * 2, 2, 1, (gx + gy) % 4 ? 'var(--accent)' : 'var(--world-light)');
      }
    } else if (kind === 'WORLD') {
      for (let y = -13; y <= 13; y++) { const half = Math.floor(Math.sqrt(169 - y * y)); g += pixelRect(48 - half, 20 + y, half * 2 + 1, 1, 'var(--world-block-2)'); for (let x = -half; x <= half; x += 2) if (Math.sin(x * 0.5 + y * 0.7) > 0.35) g += pixelRect(48 + x, 20 + y, 2, 1, 'var(--accent)'); }
      for (let q = 0; q < 10; q++) { const t = q / 10 * Math.PI * 2; g += pixelRect(Math.round(48 + Math.cos(t) * 20) - 1, Math.round(20 + Math.sin(t) * 9) - 1, 2, 2, 'var(--lamp)'); }
    } else {
      g += desk + spriteRects(SPRITE.lamp, { k:'var(--world-block)', y:'var(--world-block-2)', w:'var(--world-block)' }, 12, 16) + pixelRect(40, 26, 12, 2, 'var(--world-light)');
    }
    $('world-visual').innerHTML = `<svg viewBox="0 0 96 40" preserveAspectRatio="xMidYMid slice" shape-rendering="crispEdges" focusable="false">${g}</svg>`;
  }
  function worldMetric(labelText, value) { const div = document.createElement('div'); const span = document.createElement('span'); const strong = document.createElement('strong'); span.textContent = labelText; strong.textContent = value; div.append(span,strong); return div; }
  function renderWorld(s) { const sets = { 1:[['AUTO / 自动',`${fmt(E.rate(s),1)}/s`],['CONTRACTS / 委托',`${s.contracts}/3`],['TYPISTS / 打字员',fmt(s.typists)],['PRESSES / 印刷机',fmt(s.presses)]], 2:[['READERS / 读者',fmt(s.readers)],['DEMAND / 需求',fmt(s.demand,1)],['COMPOSED / 组合字',fmt(s.composed)],['DELETED / 已删噪音',fmt(s.deletedNoise)]], 3:[['DISTRICTS / 街区',fmt(s.districts)],['CONCEPTS / 概念',fmt(s.concepts)],['EFFECTS / 社会变化',fmt(s.societyEffects)],['SCALE / 地图',s.worldScale>=2?'WORLD':'CITY']], 4:[['AGENTS',fmt(s.agents,1)],['AGENT FACTORIES',fmt(s.agentFactories)],['AUTO ARTICLES',fmt(s.overnightArticles)],['ARCHIVES / 记忆',fmt(s.archives)]], 5:[['MACHINE GLYPHS',fmt(s.machineGlyphs)],['MACHINE USE',fmt(s.machineGlyphUse)],['COMPRESSED',fmt(s.compressedMeaning)],['HUMAN MEANING',fmt(s.meaning)]], 6:[['INFRA / 基础设施',s.infrastructure?'ON':'OFF'],['AMBIGUITY / 歧义',fmt(s.ambiguity)],['DELETED / 删除',fmt(s.deletedNoise)],['COMPRESSED',fmt(s.compressedMeaning)]] }; $('world-metrics').replaceChildren(...sets[s.act].map(([a,b]) => worldMetric(a,b))); const scale = s.stopped ? 'SILENCE' : s.act===3 && s.worldScale>=2 ? 'NETWORK' : ['DESK','CITY','CITY','NETWORK','MACHINE','WORLD'][s.act-1]; $('world-scale').textContent = scale; renderScene(scale); $('world-card').classList.toggle('stopped', s.stopped); }

  function actionButton(text, sub, type, enabled = true, props = {}, className = '') { const b = document.createElement('button'); b.type='button'; b.dataset.command=type; b.disabled=!enabled; b.className=className; const main = document.createElement('span'); main.textContent=text; b.append(main); if (sub) { const small=document.createElement('span'); small.className='action-sub'; small.textContent=sub; b.append(small); } b.addEventListener('click',()=>perform(type,props)); return b; }
  function renderActions(s) {
    const buttons=[]; const en=locale==='en'; const seen=new Set(s.ahaSeen||[]);
    // The engine owns what a command costs (E.commandReady). Re-deriving "can I afford this"
    // here is exactly how a button ends up lit while the engine silently refuses it — the
    // disclosure contract wants a greyed button naming the shortfall, never one that does nothing.
    const add = (key, revealWhen, enabled, text, sub, type, props = {}, className = '') => {
      if (!rememberReveal(`action:${key}`, revealWhen)) return;
      const gate = E.commandReady(s, type);
      // `available === false` 不是「买不起」而是「这一幕还没有」：第一章没有推钟动词，
      // 微事件在两次之间本来就不该在屏幕上。这种要**不渲染**，灰着写「还差」是另一种谎。
      if (gate.available === false) return;
      const ready = gate.ready && enabled;
      // A spent one-shot keeps its own「已完成」copy; only an unaffordable one gets the shortfall.
      const short = gate.binding && !gate.spent
        ? lack(E.fieldLabel(gate.binding.key, en), `${fmt(gate.binding.have,1)} / ${fmt(gate.binding.need)}`)
        : sub;
      buttons.push(actionButton(text, ready ? sub : short, type, ready, props, className));
    };
    // Affordability only disables a discovered action; it never hides it. Reveal conditions must use latched or monotonic facts, because a player who leaves auto-sell on keeps stock below 1 forever.
    const draining = s.autoSell && !s.digital;
    const drainNote = draining ? (en?' · auto-sell is emptying stock':' · 自动出售正在清空库存') : '';
    const lack = (what, now) => en ? `Needs ${what} (${now})${drainNote}` : `还差 ${what}（${now}）${drainNote}`;
    if (s.act === 1) {
      buttons.push(actionButton(label(ACTIONS.print), en?'Manual production':'手动生产', 'print', true, {}, 'major'));
      add('sell', s.lifetimeGlyphs>=1, s.glyphs>=1, label(ACTIONS.sell), `${fmt(Math.floor(s.glyphs)*E.PRICE,1)} ${en?'credits':'资金'}`, 'sell');
      add('boost', s.manualBoost || s.lifetimeGlyphs>=150, !s.manualBoost && s.lifetimeGlyphs>=150&&s.credits>=45, label(ACTIONS.boost), s.manualBoost?tr('done'):(s.credits>=45?(en?'150 total + 45 credits':'累计150字 + 45资金'):lack(en?'45 credits':'45 资金', fmt(s.credits,1))), 'boost');
      if (!s.autoSellUnlocked) add('autoResearch', s.lifetimeGlyphs>=300, s.lifetimeGlyphs>=300&&s.credits>=60, label(ACTIONS.autoResearch), s.credits>=60?(en?'300 total + 60 credits':'累计300字 + 60资金'):lack(en?'60 credits':'60 资金', fmt(s.credits,1)), 'research-auto');
      const c=E.CONTRACTS[s.contracts];
      // Not `c && s.glyphs>=c.glyphs`: that reads spendable stock, which auto-sell floors below 1 on
      // every tick, so a player who turned auto-sell on before ever holding 20 glyphs at once would
      // never see the first contract at all. `lifetimeGlyphs` is monotonic and crosses the same 20.
      const contractEver = s.contracts>0 || s.lifetimeGlyphs>=E.CONTRACTS[0].glyphs;
      if (rememberReveal('action:contract', contractEver)) {
        if (c) {
          // The one action here whose enable-gate is a stock cost. Without the shortfall it is a
          // grey button reading "20 → 20" and nothing says why the 20 never arrives — `lack` adds
          // 「自动出售正在清空库存」 when auto-sell is the reason.
          const sub = s.glyphs>=c.glyphs ? `${c.glyphs} → ${c.reward}` : lack(en?`${c.glyphs} stock`:`${c.glyphs} 库存字`, fmt(s.glyphs,1));
          buttons.push(actionButton(label(ACTIONS.contract), sub, 'contract', s.glyphs>=c.glyphs));
        } else buttons.push(actionButton(label(ACTIONS.contract), tr('done'), 'contract', false));
      }
      add('publish', s.lifetimeGlyphs>=E.ACT_GATES[1][0].need, E.canPublish(s), label(ACTIONS.publish), E.canPublish(s)?(en?'Not an ending. What you print starts growing on its own.':'这不是结局。你印出来的东西，会开始自己生长。'):lack(en?'200 stock + 300 credits':'库存 200 字 + 300 资金', `${fmt(s.glyphs,1)} / ${fmt(s.credits,1)}`), 'publish', {}, 'major');
    }
    else if (s.act === 2) {
      buttons.push(actionButton(label(ACTIONS.print), en?'Old verbs still work, for now.':'旧玩法还在，但意义开始改变。', 'print', true, {}, 'major'));
      // Once the rule is running, the button must report what it is producing. Repeating the
      // discovery copy forever is how a working button reads as broken.
      const ruleReaders = E.ruleReadersPerSecond(s).toFixed(2);
      const composeSub = s.glyphs < 2 ? lack(en?'2 stock':'2 库存字', fmt(s.glyphs,1))
        : s.ruleActive ? (en?`Carved ${fmt(s.composed)} · readers +${ruleReaders}/s`:`已刻 ${fmt(s.composed)} 条 · 读者 +${ruleReaders}/秒`)
        : (en?'2 glyphs → one repeatable relationship':'2 字 → 一条可重复规则');
      add('compose', true, s.glyphs>=2, label(ACTIONS.compose), composeSub, 'compose-rule');
      add('condense', s.meaning>0||seen.has('A05')||s.composed>0, s.glyphs>=20, label(ACTIONS.condense), s.glyphs>=20?(en?'Volume becomes meaning.':'字数开始变成意义。'):lack(en?'20 stock':'20 库存字', fmt(s.glyphs,1)), 'condense');
      add('letter', s.letters>0||seen.has('A07')||s.readers>=250, s.readers>=250, label(ACTIONS.letter), `${en?'readers':'读者'} ${fmt(s.readers)}`, 'read-letter');
      add('organic', s.organicWords>0||seen.has('A08')||s.letters>=1, s.letters>=1, label(ACTIONS.organic), en?'The audience writes back.':'让读者也成为作者。', 'organic-word');
      // 一次性动作用完之后换成「已完成」，不再挂着那句宣传语——这是本仓库已有的规矩
      // （复写纸、自动出售台都这么写）。一个灰着却仍在推销自己的按钮，读起来像还能再按一次。
      add('viral', s.viralWords>0||seen.has('A09')||s.organicWords>=1, s.organicWords>=1, label(ACTIONS.viral), s.viralWords>0?tr('done'):(en?'Propagation > production':'传播速度 > 生产速度'), 'viral-word');
      add('delete2', s.deletedNoise>0||seen.has('A11')||s.noise>=1, s.noise>=1, label(ACTIONS.delete), en?'Deletion is now productive.':'删除第一次成为生产行为。', 'delete-noise');
    }
    else if (s.act === 3) {
      // Through `add`, not pushed directly: this one now costs readers, meaning and credits, and
      // a button pushed straight into the list would stay lit while the engine refused it.
      // Reveal latches on the act (monotonic), never on affordability — an action you have
      // discovered stays on screen, greyed, with the shortfall written on it.
      add('dialect', s.act >= 3, true, label(ACTIONS.dialect), en?'Another district diverges.':'再观察一个街区。', 'discover-dialect');
      // 代价从引擎读。写死过一次「花25意义」，而引擎扣的是 50——一个点下去比按钮上写的贵一倍
      // 的动作，是披露契约最不能有的那种谎：不是「点了没反应」，是「反应比说好的大」。
      const conceptCost = E.COMMAND_COSTS['make-concept'](s).find(([key]) => key === 'meaning')[1];
      add('concept', s.concepts>0||seen.has('A13')||s.meaning>=25, s.meaning>=25, label(ACTIONS.concept), en?`Spend ${conceptCost} meaning to change society.`:`花${conceptCost}意义，让一个概念进入社会。`, 'make-concept');
      // 地图是这一章画出来的，不是上一章的出口。要有两种以上街区，地图上才有东西可看——
      // 门槛数字来自引擎（E.COMMAND_COSTS），按钮自己会写「还差 街区 1/2」。
      add('city', s.worldScale>=1||seen.has('A14')||s.districts>=2, true, label(ACTIONS.city), en?'The workshop is no longer the whole world.':'工坊不再是全部世界。', 'map-city', {}, 'major');
      // 门槛数字的唯一真源在引擎（E.WORLD_GATE）；渲染层不再抄一份。
      const worldReady=s.concepts>=E.WORLD_GATE.concepts&&s.districts>=E.WORLD_GATE.districts;
      add('world', s.worldScale>=2||seen.has('A15')||worldReady, worldReady, label(ACTIONS.world), en?'The city is only one node.':'城市只是网络中的一个节点。', 'map-world');
      add('agents', s.agents>=1||seen.has('A16')||s.worldScale>=2, s.worldScale>=2, label(ACTIONS.agents), en?'Hand authorship to a system.':'把“写什么”交给系统。', 'launch-agents', {}, 'major');
    }
    else if (s.act === 4) {
      add('editor', s.editorAutonomy||seen.has('A17')||s.agents>=1, s.agents>=1, label(ACTIONS.editor), en?'It may reject your headline.':'它可以拒绝你的头条。', 'editor-autonomy');
      add('spawn', s.agentFactories>=1||seen.has('A18')||s.editorAutonomy, s.editorAutonomy, label(ACTIONS.spawn), en?'Delegation becomes self-replication.':'委托变成自我扩张。', 'spawn-agents', {}, 'major');
      add('digitize', s.digital||seen.has('A20')||s.agentFactories>=1, s.agentFactories>=1, label(ACTIONS.digitize), en?'Physical inventory stops mattering.':'实体库存开始退出舞台。', 'digitize');
      add('memory', s.archives>=1||seen.has('A21')||s.digital, s.digital, label(ACTIONS.memory), en?'Past writing becomes model memory.':'过去的文字变成机器记忆。', 'train-memory');
      const machineReady=E.gateProgress(s).done;
      add('machine', s.machineGlyphs>=1||seen.has('A22')||machineReady, machineReady, label(ACTIONS.machine), en?'Source: unknown.':'来源：未知。', 'discover-machine-glyph', {}, 'major');
    }
    else if (s.act === 5) {
      add('compress', s.compressedMeaning>0||seen.has('A24')||s.meaning>=100, s.meaning>=100, label(ACTIONS.compress), en?'100 meaning → 10,000 compressed meaning':'100意义 → 10,000压缩意义', 'compress-language', {amount:100}, 'major');
      add('infra', s.infrastructure||seen.has('A25')||s.compressedMeaning>=10000, s.compressedMeaning>=10000, label(ACTIONS.infra), en?'Language is ready to become infrastructure.':'语言已经可以接管基础设施。', 'infrastructure');
    }
    else if (s.act === 6) {
      add('delete6', s.deletedNoise>0||seen.has('A27')||s.noise>=1, s.noise>=1, label(ACTIONS.delete), en?'Remove 250 noise.':'一次删除250噪音。', 'delete-noise', {amount:250}, 'major');
      // Same threshold as the engine's gate (E.AHA_GOALS.A26.need): the button appears as soon as
      // ambiguity exists, but only becomes usable once there is enough of it to be worth clearing.
      const ambiguityReady=s.ambiguity>=E.AHA_GOALS.A26.need;
      add('ambiguity', seen.has('A26')||s.ambiguity>0, ambiguityReady, label(ACTIONS.ambiguity), ambiguityReady?(en?'Clarity becomes a resource.':'清晰度变成一种资源。'):lack(en?'100 ambiguity':'100 歧义', fmt(s.ambiguity,1)), 'resolve-ambiguity');
      const stopReady=E.gateProgress(s).done;
      add('stop', s.stopped||stopReady, !s.stopped&&stopReady, label(ACTIONS.stop), s.stopped?tr('done'):(en?'The final action is now possible.':'最后一个动作现在才出现。'), 'stop-printing', {}, 'danger');
    }
    // 这一幕的复利推钟动词：第二章起每一幕一个，第一章没有（它的手速本身就是动词）。
    // 它排在主行动位：这一段等待里玩家唯一能主动做的事就是它，藏在边角等于没有。
    // 「买不起」写成还差什么，「这一幕没有」直接不渲染——两种都由引擎的 commandReady 说。
    const verb = E.ACT_VERBS[s.act];
    if (verb) {
      const used = E.boostCount(s, s.act);
      const step = Math.round(E.BOOST_STEP * 100), cap = Math.round(E.BOOST_CAP * 100);
      const now = Math.round(used * E.BOOST_STEP * 100);
      const sub = used >= E.BOOST_MAX
        ? (en ? `Maxed: this act runs ${cap}% faster` : `已到顶：这一幕快 ${cap}%`)
        : (en ? `+${step}% for the rest of this act (now +${now}%)` : `这一幕以后每一段都快 ${step}%（现在 +${now}%）`);
      const before = buttons.length;
      add('push', Boolean(E.ACT_VERBS[s.act]), true, en ? verb.nameEn : verb.name, sub, 'push-clock', {}, 'major');
      if (buttons.length > before) buttons.unshift(buttons.pop());
    }
    // 微事件：等待里偶尔出现的一个世界内的东西。它平时不在屏幕上——到点了才在，
    // 点掉就轮到下一个。这正是它和主循环的区别：主循环一直在，它不。
    const ev = E.EVENTS[s.act];
    if (ev) {
      const cost = ev.cost.map(([key, amount]) => `${E.fieldLabel(key, en)} ${fmt(amount)}`).join(' + ');
      // 「发现」这个事件的条件就是它到点了——没到点不是「藏起来了」，是还没发生。
      // 到点之后就一直看得见，买不起也只是灰着写还差什么（契约要的是这个，不是藏）。
      const before = buttons.length;
      add('event', E.eventDue(s), true, en ? ev.nameEn : ev.name, en ? `Costs ${cost}` : `花掉 ${cost}`, 'take-event', {}, 'event');
      if (buttons.length > before) buttons.splice(1, 0, buttons.pop());
    }
    // The ACT I economy does not retire at publication. Credits fund every downstream action —
    // condense, dialects, concepts, agent factories, archive training — and the engine never
    // stopped accepting `sell`, `contract` or `buy`. Hiding the only way to earn was a render
    // decision, not a rule, and it left the later acts with no income at all.
    if (s.act > 1) {
      if (!s.digital) add('sell', s.lifetimeGlyphs>=1, s.glyphs>=1, label(ACTIONS.sell), `${fmt(Math.floor(s.glyphs)*E.PRICE,1)} ${en?'credits':'资金'}`, 'sell');
      const c=E.CONTRACTS[s.contracts];
      if (c) {
        const sub = s.glyphs>=c.glyphs ? `${c.glyphs} → ${c.reward}` : lack(en?`${c.glyphs} stock`:`${c.glyphs} 库存字`, fmt(s.glyphs,1));
        buttons.push(actionButton(label(ACTIONS.contract), sub, 'contract', s.glyphs>=c.glyphs));
      }
    }
    // Auto-sell is a permanent setting, not an Act I verb: keep its toggle beside the primary action in every act, or publishing with it on strands the player with no way to stop it draining stock.
    if (s.autoSellUnlocked && !s.stopped) buttons.splice(1, 0, actionButton(label(ACTIONS.autoToggle), s.autoSell?'ON':'OFF', 'toggle-auto', true));
    if (s.stopped) buttons.forEach((button) => { button.disabled=true; });
    $('primary-actions').replaceChildren(...buttons);
  }

  function renderMachines(s) {
    const cards=[];
    // Machines stay on the table for the whole game: `buy` has no act gate in the engine, and
    // production rate still drives every later act's resources.
    for (const u of E.UNITS) {
      const owned=s[u.id]; const c=E.cost(s,u.id); const unlocked=s.lifetimeGlyphs>=u.unlock; const affordable=s.credits>=c;
      if (!rememberReveal(`machine:${u.id}`, owned>0 || (unlocked&&affordable))) continue;
      const card=document.createElement('div'); card.className='machine';
      const title=document.createElement('b'); title.textContent=u.name;
      const small=document.createElement('small'); small.textContent=`${owned} × +${u.rate}/s · ${c} credits`;
      const b=document.createElement('button'); b.type='button'; b.textContent=locale==='en'?'Buy':'购买'; b.disabled=!affordable; b.addEventListener('click',()=>perform('buy',{id:u.id}));
      card.append(title,small,b); cards.push(card);
    }
    $('machines').replaceChildren(...cards);
  }

  function renderAhas(s) {
    const active=currentAha(s); const seen=new Set(s.ahaSeen||[]);
    const visible = preview ? E.AHAS : E.AHAS.filter((item)=>seen.has(item.id));
    // 每条带上门槛进度：面板回答的不再只是「发生过什么」，还有「还差多少」。
    // 只渲染已出现的条目——列出 28 条待办等于把整个发现过程剧透掉。
    $('aha-list').replaceChildren(...visible.map((item)=>{ const div=document.createElement('button'); div.type='button'; div.className=`aha-item seen ${item.id===active.id?'active':''}`; const copy=ahaCopy(item); const goal=E.ahaGoal(s,item.id); const pct=goal?Math.min(100,Math.round(goal.have/goal.need*100)):0; const bar=goal?`<u aria-hidden="true"><i style="width:${pct}%"></i></u><em>${fmt(goal.have,1)}/${fmt(goal.need)}</em>`:''; div.innerHTML=`<b>${item.id} · ${copy[0]}</b><span>ACT ${item.act}</span>${bar}`; div.addEventListener('click',()=>{ directorOpen=true; $('director').hidden=false; $('director-select').value=item.id; selectPreview(item.id); render(); }); return div; }));
    $('aha-count').textContent=`${seen.size} / 28`;
    const copy=ahaCopy(active); $('aha-id').textContent=`${active.id} · ${seen.has(active.id)?tr('seen'):tr('next')}`; $('aha-title').textContent=copy[0]; $('aha-copy').textContent=copy[1];
  }

  function renderDisclosure(s) {
    const isDirector = Boolean(preview); const seen=new Set(s.ahaSeen||[]);
    const metric = (id, key, condition) => { const el=$(id)?.closest('.metric'); if (el) el.hidden=!(isDirector || rememberReveal(`metric:${key}`, condition)); };
    metric('glyphs','glyphs',true);
    // Digital publishing intentionally replaces physical inventory; scarcity never does.
    $('glyphs').closest('.metric').hidden=Boolean(s.digital);
    metric('credits','credits',s.credits>0||s.manualBoost||s.autoSellUnlocked||s.contracts>0||s.keyboards>0||s.typists>0||s.presses>0||s.act>1);
    // Act II gates on readership (A06/A07/A10 and the city map). It used to live only in the
    // world card, which stays hidden until Act III, so the one number the act turns on was
    // never on screen. Readership exists from publication, so it appears from there.
    metric('readers','readers',s.readers>0||s.published);
    metric('meaning','meaning',s.meaning>0||s.composed>0||seen.has('A05')||s.act>2);
    metric('noise','noise',s.noise>0||s.deletedNoise>0||seen.has('A10')||seen.has('A11')||s.act>2);

    $('world-card').hidden = !isDirector && s.act < 3;
    // Intent contract: undiscovered systems do not occupy layout space.
    $('hero-layout')?.classList.toggle('single', $('world-card').hidden);

    const systemsHead=$('systems-title')?.closest('.panel-head');
    const machines=$('machines');
    const hasMachines=machines.children.length>0;
    if (systemsHead) systemsHead.hidden=!hasMachines;
    machines.hidden=!hasMachines;

    const ahaHead=$('aha-count')?.closest('.panel-head');
    const ahaList=$('aha-list');
    const hasAhaHistory=ahaList.children.length>0;
    // The privacy layer removes the disclosure surface for the player audience. The reveal
    // rule must not put it back on the next timer render, so the gate is applied here too.
    const playerAudience=isPlayerAudience();
    const showAhaHistory=hasAhaHistory && !playerAudience;
    if (ahaHead) ahaHead.hidden=!showAhaHistory;
    ahaList.hidden=!showAhaHistory;

    // A hidden discovery surface must not leave an empty player-facing panel.
    const systemsPanel=$('systems-panel');
    const hasPlayerSystems=hasMachines || (!playerAudience && hasAhaHistory);
    if (systemsPanel) systemsPanel.hidden=!hasPlayerSystems;

    const logPanel=$('log')?.closest('.panel');
    if (logPanel) logPanel.hidden=!isDirector && !(s.log||[]).length;
    const visibleBelow=[systemsPanel,logPanel].filter((node)=>node && !node.hidden).length;
    $('below-layout')?.classList.toggle('single', visibleBelow <= 1);
  }

  // 玩家面唯一一处「离下一个阶段还差多少」。数字全部来自 E.gateProgress（引擎唯一真源），
  // 文案是玩家语言：不含 A## / AHA / ACT / 机制解释，这条被浏览器隐私契约逐帧扫描。
  // 门槛全部达成时整块让位给主行动按钮——发现之后不该继续占版面。
  function renderActProgress(s) {
    const host = $('act-progress');
    if (!host) return;
    const gate = E.gateProgress(s);
    if (!gate || gate.done || s.stopped) { host.hidden = true; return; }
    host.hidden = false;
    const en = locale === 'en';
    const binding = gate.binding;
    $('act-progress-label').textContent = en ? 'Next stage' : '下一个阶段';
    $('act-progress-note').textContent = en
      ? `Needs ${binding.labelEn} (${fmt(binding.have,1)} / ${fmt(binding.need)})`
      : `还差 ${binding.label}（${fmt(binding.have,1)} / ${fmt(binding.need)}）`;
    const met = gate.conds.filter((c) => c.met).length;
    const track = $('act-progress-track');
    track.setAttribute('aria-label', en
      ? `Step ${met + 1} of ${gate.conds.length}, ${met} complete`
      : `第 ${met + 1} 步，共 ${gate.conds.length} 步，已完成 ${met} 步`);
    track.replaceChildren(...gate.conds.map((c) => {
      const i = document.createElement('i');
      i.className = c.met ? 'done' : (c.key === binding.key ? 'now' : '');
      i.title = `${en ? c.labelEn : c.label} ${fmt(c.have,1)}/${fmt(c.need)}`;
      return i;
    }));
  }

  function renderText() { document.documentElement.lang=locale==='en'?'en':'zh-CN'; $('lang-toggle').textContent=locale==='en'?'中文':'EN'; $('director-toggle').textContent=tr('director'); $('glyphs-label').textContent=tr('inventory'); $('credits-label').textContent=tr('credits'); $('readers-label').textContent=tr('readers'); $('meaning-label').textContent=tr('meaning'); $('noise-label').textContent=tr('noise'); $('systems-title').textContent=tr('systems'); $('systems-note').textContent=tr('systemsNote'); $('log-title').textContent=tr('log'); $('export').textContent=tr('export'); $('reset').textContent=tr('reset'); $('director-preview').textContent=tr('preview'); $('director-apply').textContent=tr('apply'); $('director-exit').textContent=tr('exit'); }
  function render() { const s=shown(); renderText(); const [title,copy]=actCopy(s); $('act-kicker').textContent=`ACT ${['I','II','III','IV','V','VI'][s.act-1]} · ${E.ACTS[s.act-1].range}`; $('act-title').textContent=title; $('act-copy').textContent=copy; $('glyphs').textContent=fmt(s.glyphs,1); $('credits').textContent=fmt(s.credits,1); $('readers').textContent=fmt(s.readers); $('meaning').textContent=fmt(s.meaning,1); $('noise').textContent=fmt(s.noise,1); $('rate').textContent=fmt(E.rate(s),1); $('total').textContent=fmt(s.lifetimeGlyphs); $('status').textContent=`${tr('business')} · ACT ${s.act}/6${preview?' · DIRECTOR PREVIEW':''}`; $('ending').hidden=!s.stopped; $('director').hidden=!directorOpen || isPlayerAudience(); renderActs(s); renderWorld(s); renderActProgress(s); renderActions(s); renderMachines(s); renderAhas(s); $('log').textContent=(s.log||[]).map((x,i)=>`${i?'·':'›'} ${x}`).join('\n'); renderDisclosure(s); if (!preview) save(); }

  E.AHAS.forEach((item)=>{ const option=document.createElement('option'); option.value=item.id; option.textContent=`${item.id} · ${item.title}`; $('director-select').append(option); });
  $('director-toggle').addEventListener('click',()=>{directorOpen=!directorOpen;$('director').hidden=!directorOpen;});
  $('director-preview').addEventListener('click',()=>{ selectPreview($('director-select').value); notice(locale==='en'?'Preview only. Real save unchanged.':'仅预览：真实存档未改变。'); render(); });
  $('director-select').addEventListener('change',()=>{ if(preview){selectPreview($('director-select').value);render();} });
  $('director-apply').addEventListener('click',()=>{ g=preview||E.directorState($('director-select').value); g={...g,director:false}; preview=null; save(true); notice(locale==='en'?'Director state applied to your save.':'已把导演状态应用到存档。'); render(); });
  $('director-exit').addEventListener('click',()=>{preview=null;notice('');render();});
  $('lang-toggle').addEventListener('click',()=>{locale=locale==='en'?'zh-CN':'en';try{localStorage.setItem(LOCALE_KEY,locale);}catch{}render();});
  $('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(g,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='glyph-factory-v3-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);});
  $('reset').addEventListener('click',()=>{if(confirm(locale==='en'?'Erase this browser save and start over?':'清空当前浏览器进度并重新开始？')){g=E.fresh();preview=null;clearReveals();save(true);render();}});
  document.addEventListener('keydown',(event)=>{if(event.code==='Space'&&!event.repeat&&!/INPUT|SELECT|BUTTON|A|TEXTAREA/.test(document.activeElement?.tagName||'')){event.preventDefault();perform('print');}});
  const tick=()=>{if(preview) preview=E.advance(preview); else g=E.advance(g); render();};
  window.setInterval(tick,500); window.addEventListener('pagehide',()=>save(true)); document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!preview)g=E.advance(g);render();save(true);}});
  // Read-only review evidence. Production/player pages cannot expose a review snapshot.
  window.GlyphReview = Object.freeze({ snapshot: () => {
    if (!preview || document.documentElement.dataset.audience === 'player') return null;
    return { id: previewId, state: JSON.parse(JSON.stringify(preview)) };
  }});
  render(); save(true);
})();