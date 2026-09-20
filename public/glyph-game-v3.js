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
    zh: { director:'导演模式', business:'营业中', inventory:'库存文字', credits:'工坊资金', meaning:'意义', noise:'噪音', systems:'系统 / SYSTEMS', systemsNote:'系统一旦出现，就留在桌面上。', log:'工坊日志', export:'导出存档', reset:'重新开始', save:'已自动保存 · 当前浏览器 · 最多结算离线 8 小时', preview:'只预览', apply:'应用到存档', exit:'返回真实进度', next:'NEXT', seen:'已发生', locked:'未发生', done:'已完成', need:'暂不可用' },
    en: { director:'Director Mode', business:'OPEN', inventory:'Glyph inventory', credits:'Workshop credits', meaning:'Meaning', noise:'Noise', systems:'Systems', systemsNote:'Once a system appears, it stays on the table.', log:'Workshop log', export:'Export save', reset:'Start over', save:'Autosaved · this browser · up to 8 hours offline', preview:'Preview only', apply:'Apply to save', exit:'Back to real progress', next:'NEXT', seen:'SEEN', locked:'LOCKED', done:'Done', need:'Not ready' }
  };
  const ACT_EN = { 1:['Hands → Automation','Print by hand. Then make repetition disappear.'], 2:['Words Begin to Grow','Relationships, readers, meaning and noise become machines.'], 3:['Words Change the City','Language stops being inventory and starts changing society.'], 4:['Machines Begin to Write','Delegate judgment, then delegate the ability to create delegates.'], 5:['Machine Language','The system invents symbols that humans did not design.'], 6:['From Growth to Silence','Optimization flips from making more to removing noise.'] };
  const ACT_ZH = { 1:['手工与自动化','先亲手印。然后让机器接管重复劳动。'], 2:['字开始生长','关系、读者、意义和噪音，都开始成为机器。'], 3:['文字改变城市','文字不再是库存，而开始改变社会。'], 4:['机器开始写','把判断交出去，再把“创造代理”的权力交出去。'], 5:['机器语言','系统开始创造人类没有设计过的符号。'], 6:['从增长到沉默','优化目标从“制造更多”翻转成“删除噪音”。'] };
  const AHA_EN = {
    A01:['The machine clicks for me','My job is not clicking. It is designing growth.'], A02:['Workers become an institution','People are not numbers. Organization is a machine.'], A03:['木 + 木 → 林','Relationships between glyphs can become machines.'], A04:['Rules run themselves','Machines now manufacture writing-machines.'], A05:['Meaning beats volume','A thousand empty glyphs can be worth less than one important sentence.'], A06:['The newspaper creates demand','Words manufacture the need for more words.'], A07:['Readers write back','Consumers become producers.'], A08:['Readers invent words','Language starts leaving the factory.'], A09:['A word goes viral','Propagation replaces production speed.'], A10:['Paper crisis: write less','The metric flips from glyphs/sec to meaning/glyph.'], A11:['Deletion becomes valuable','The enemy is no longer scarcity. It is noise.'], A12:['Districts grow dialects','The same glyph no longer means the same thing everywhere.'], A13:['A concept changes the city','Words turn from products into world rules.'], A14:['The city map appears','The workshop was only one point in the world.'], A15:['The map zooms out','The real factory is the communication network.'], A16:['Reporter Agent chooses a story','I am no longer the author.'], A17:['The editor says “no”','Automation is delegated judgment, not a faster button.'], A18:['Agents create agents','The factory expands itself.'], A19:['Wake up to 80,000 articles','The system no longer needs the night shift.'], A20:['Digital publishing removes inventory','The warehouse suddenly stops mattering.'], A21:['Archives become memory','Everything written before becomes training material.'], A22:['A glyph you never made appears','This glyph was not made by me.'], A23:['Machines have their own language','Some language is no longer written for humans.'], A24:['A trillion words become one symbol','Growth folds back into a single glyph.'], A25:['Language becomes infrastructure','I am not a publisher. I am running an operating layer.'], A26:['New resource: ambiguity','More words can make the world less clear.'], A27:['The objective flips to deletion','Infinite production can end in noise.'], A28:['The last button: stop printing','The world has been written. Now go read it.']
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
  function currentAha(s) { if (preview) { const selected = previewId; return E.AHAS.find((a) => a.id === selected) || E.AHAS[0]; } const seen = new Set(s.ahaSeen || []); let last = E.AHAS[0]; for (const item of E.AHAS) if (seen.has(item.id) || E.ahaUnlocked(s,item.id)) last = item; return last; }
  function actCopy(s) { return (locale === 'en' ? ACT_EN : ACT_ZH)[s.act] || (locale === 'en' ? ACT_EN[1] : ACT_ZH[1]); }

  // Paperclips rule: hidden -> revealed -> persistent. Temporary scarcity never hides a discovered surface.
  function renderActs(s) {
    const visibleActs = preview ? E.ACTS : E.ACTS.filter((act) => act.id <= s.act);
    $('act-strip').replaceChildren(...visibleActs.map((act) => { const div = document.createElement('div'); div.className = `act-chip ${act.id === s.act ? 'current' : act.id < s.act ? 'done' : ''}`; const name = locale === 'en' ? ACT_EN[act.id][0] : act.name; div.innerHTML = `<b>ACT ${['I','II','III','IV','V','VI'][act.id-1]} · ${name}</b><span>${act.range}</span>`; return div; }));
  }
  function worldMetric(labelText, value) { const div = document.createElement('div'); const span = document.createElement('span'); const strong = document.createElement('strong'); span.textContent = labelText; strong.textContent = value; div.append(span,strong); return div; }
  function renderWorld(s) { const sets = { 1:[['AUTO / 自动',`${fmt(E.rate(s),1)}/s`],['CONTRACTS / 委托',`${s.contracts}/3`],['TYPISTS / 打字员',fmt(s.typists)],['PRESSES / 印刷机',fmt(s.presses)]], 2:[['READERS / 读者',fmt(s.readers)],['DEMAND / 需求',fmt(s.demand,1)],['COMPOSED / 组合字',fmt(s.composed)],['DELETED / 已删噪音',fmt(s.deletedNoise)]], 3:[['DISTRICTS / 街区',fmt(s.districts)],['CONCEPTS / 概念',fmt(s.concepts)],['EFFECTS / 社会变化',fmt(s.societyEffects)],['SCALE / 地图',s.worldScale>=2?'WORLD':'CITY']], 4:[['AGENTS',fmt(s.agents,1)],['AGENT FACTORIES',fmt(s.agentFactories)],['AUTO ARTICLES',fmt(s.overnightArticles)],['ARCHIVES / 记忆',fmt(s.archives)]], 5:[['MACHINE GLYPHS',fmt(s.machineGlyphs)],['MACHINE USE',fmt(s.machineGlyphUse)],['COMPRESSED',fmt(s.compressedMeaning)],['HUMAN MEANING',fmt(s.meaning)]], 6:[['INFRA / 基础设施',s.infrastructure?'ON':'OFF'],['AMBIGUITY / 歧义',fmt(s.ambiguity)],['DELETED / 删除',fmt(s.deletedNoise)],['COMPRESSED',fmt(s.compressedMeaning)]] }; $('world-metrics').replaceChildren(...sets[s.act].map(([a,b]) => worldMetric(a,b))); $('world-scale').textContent = s.stopped ? 'SILENCE' : s.act===3 && s.worldScale>=2 ? 'NETWORK' : ['DESK','CITY','CITY','NETWORK','MACHINE','WORLD'][s.act-1]; $('world-card').classList.toggle('stopped', s.stopped); }

  function actionButton(text, sub, type, enabled = true, props = {}, className = '') { const b = document.createElement('button'); b.type='button'; b.dataset.command=type; b.disabled=!enabled; b.className=className; const main = document.createElement('span'); main.textContent=text; b.append(main); if (sub) { const small=document.createElement('span'); small.className='action-sub'; small.textContent=sub; b.append(small); } b.addEventListener('click',()=>perform(type,props)); return b; }
  function renderActions(s) {
    const buttons=[]; const en=locale==='en'; const seen=new Set(s.ahaSeen||[]);
    const add = (key, revealWhen, enabled, text, sub, type, props = {}, className = '') => { if (rememberReveal(`action:${key}`, revealWhen)) buttons.push(actionButton(text, sub, type, enabled, props, className)); };
    if (s.act === 1) {
      buttons.push(actionButton(label(ACTIONS.print), en?'Manual production':'手动生产', 'print', true, {}, 'major'));
      add('sell', s.lifetimeGlyphs>=1, s.glyphs>=1, label(ACTIONS.sell), `${fmt(Math.floor(s.glyphs)*E.PRICE,1)} ${en?'credits':'资金'}`, 'sell');
      add('boost', s.manualBoost || (s.lifetimeGlyphs>=150&&s.credits>=45), !s.manualBoost && s.lifetimeGlyphs>=150&&s.credits>=45, label(ACTIONS.boost), s.manualBoost?tr('done'):(en?'150 total + 45 credits':'累计150字 + 45资金'), 'boost');
      if (s.autoSellUnlocked) buttons.push(actionButton(label(ACTIONS.autoToggle), s.autoSell?'ON':'OFF', 'toggle-auto', true));
      else add('autoResearch', s.lifetimeGlyphs>=300&&s.credits>=60, s.lifetimeGlyphs>=300&&s.credits>=60, label(ACTIONS.autoResearch), en?'300 total + 60 credits':'累计300字 + 60资金', 'research-auto');
      const c=E.CONTRACTS[s.contracts];
      const contractEver = s.contracts>0 || Boolean(c && s.glyphs>=c.glyphs);
      if (rememberReveal('action:contract', contractEver)) {
        if (c) buttons.push(actionButton(label(ACTIONS.contract), `${c.glyphs} → ${c.reward}`, 'contract', s.glyphs>=c.glyphs));
        else buttons.push(actionButton(label(ACTIONS.contract), tr('done'), 'contract', false));
      }
      add('publish', E.canPublish(s), E.canPublish(s), label(ACTIONS.publish), en?'This opens ACT II.':'这不是结局；它会打开 ACT II。', 'publish', {}, 'major');
    }
    else if (s.act === 2) {
      buttons.push(actionButton(label(ACTIONS.print), en?'Old verbs still work, for now.':'旧玩法还在，但意义开始改变。', 'print', true, {}, 'major'));
      add('compose', s.ruleActive||s.composed>0||s.glyphs>=2, s.glyphs>=2, label(ACTIONS.compose), en?'2 glyphs → one repeatable relationship':'2 字 → 一条可重复规则', 'compose-rule');
      add('condense', s.meaning>0||seen.has('A05')||s.glyphs>=20, s.glyphs>=20, label(ACTIONS.condense), en?'Volume becomes meaning.':'字数开始变成意义。', 'condense');
      add('letter', s.letters>0||seen.has('A07')||s.readers>=250, s.readers>=250, label(ACTIONS.letter), `${en?'readers':'读者'} ${fmt(s.readers)}`, 'read-letter');
      add('organic', s.organicWords>0||seen.has('A08')||s.letters>=1, s.letters>=1, label(ACTIONS.organic), en?'The audience writes back.':'让读者也成为作者。', 'organic-word');
      add('viral', s.viralWords>0||seen.has('A09')||s.organicWords>=1, s.organicWords>=1, label(ACTIONS.viral), en?'Propagation > production':'传播速度 > 生产速度', 'viral-word');
      add('delete2', s.deletedNoise>0||seen.has('A11')||s.noise>=1, s.noise>=1, label(ACTIONS.delete), en?'Deletion is now productive.':'删除第一次成为生产行为。', 'delete-noise');
      const cityReady=s.paperCrisis&&s.meaning>=50&&s.deletedNoise>=1;
      add('city', s.worldScale>=1||seen.has('A14')||cityReady, cityReady, label(ACTIONS.city), en?'The workshop is no longer the whole world.':'工坊不再是全部世界。', 'map-city', {}, 'major');
    }
    else if (s.act === 3) {
      buttons.push(actionButton(label(ACTIONS.dialect), en?'Another district diverges.':'再观察一个街区。', 'discover-dialect', true));
      add('concept', s.concepts>0||seen.has('A13')||s.meaning>=25, s.meaning>=25, label(ACTIONS.concept), en?'Spend 25 meaning to change society.':'花25意义，让一个概念进入社会。', 'make-concept');
      const worldReady=s.concepts>=2&&s.districts>=3;
      add('world', s.worldScale>=2||seen.has('A15')||worldReady, worldReady, label(ACTIONS.world), en?'The city is only one node.':'城市只是网络中的一个节点。', 'map-world');
      add('agents', s.agents>=1||seen.has('A16')||s.worldScale>=2, s.worldScale>=2, label(ACTIONS.agents), en?'Hand authorship to a system.':'把“写什么”交给系统。', 'launch-agents', {}, 'major');
    }
    else if (s.act === 4) {
      add('editor', s.editorAutonomy||seen.has('A17')||s.agents>=1, s.agents>=1, label(ACTIONS.editor), en?'It may reject your headline.':'它可以拒绝你的头条。', 'editor-autonomy');
      add('spawn', s.agentFactories>=1||seen.has('A18')||s.editorAutonomy, s.editorAutonomy, label(ACTIONS.spawn), en?'Delegation becomes self-replication.':'委托变成自我扩张。', 'spawn-agents', {}, 'major');
      add('digitize', s.digital||seen.has('A20')||s.agentFactories>=1, s.agentFactories>=1, label(ACTIONS.digitize), en?'Physical inventory stops mattering.':'实体库存开始退出舞台。', 'digitize');
      add('memory', s.archives>=1||seen.has('A21')||s.digital, s.digital, label(ACTIONS.memory), en?'Past writing becomes model memory.':'过去的文字变成机器记忆。', 'train-memory');
      const machineReady=s.archives>=1&&s.agentFactories>=1;
      add('machine', s.machineGlyphs>=1||seen.has('A22')||machineReady, machineReady, label(ACTIONS.machine), en?'Source: unknown.':'来源：未知。', 'discover-machine-glyph', {}, 'major');
    }
    else if (s.act === 5) {
      add('compress', s.compressedMeaning>0||seen.has('A24')||s.meaning>=100, s.meaning>=100, label(ACTIONS.compress), en?'100 meaning → 10,000 compressed meaning':'100意义 → 10,000压缩意义', 'compress-language', {amount:100}, 'major');
      add('infra', s.infrastructure||seen.has('A25')||s.compressedMeaning>=10000, s.compressedMeaning>=10000, label(ACTIONS.infra), en?'Language is ready to become infrastructure.':'语言已经可以接管基础设施。', 'infrastructure');
    }
    else if (s.act === 6) {
      add('delete6', s.deletedNoise>0||seen.has('A27')||s.noise>=1, s.noise>=1, label(ACTIONS.delete), en?'Remove 500 noise.':'一次删除500噪音。', 'delete-noise', {amount:500}, 'major');
      add('ambiguity', seen.has('A26')||s.ambiguity>0, s.ambiguity>0, label(ACTIONS.ambiguity), en?'Clarity becomes a resource.':'清晰度变成一种资源。', 'resolve-ambiguity');
      const stopReady=s.deletedNoise>=1000&&s.compressedMeaning>=10000;
      add('stop', s.stopped||stopReady, !s.stopped&&stopReady, label(ACTIONS.stop), s.stopped?tr('done'):(en?'The final action is now possible.':'最后一个动作现在才出现。'), 'stop-printing', {}, 'danger');
    }
    if (s.stopped) buttons.forEach((button) => { button.disabled=true; });
    $('primary-actions').replaceChildren(...buttons);
  }

  function renderMachines(s) {
    const cards=[];
    if (s.act===1) for (const u of E.UNITS) {
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
    $('aha-list').replaceChildren(...visible.map((item)=>{ const div=document.createElement('button'); div.type='button'; div.className=`aha-item seen ${item.id===active.id?'active':''}`; const copy=ahaCopy(item); div.innerHTML=`<b>${item.id} · ${copy[0]}</b><span>ACT ${item.act}</span>`; div.addEventListener('click',()=>{ directorOpen=true; $('director').hidden=false; $('director-select').value=item.id; selectPreview(item.id); render(); }); return div; }));
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

  function renderText() { document.documentElement.lang=locale==='en'?'en':'zh-CN'; $('lang-toggle').textContent=locale==='en'?'中文':'EN'; $('director-toggle').textContent=tr('director'); $('glyphs-label').textContent=tr('inventory'); $('credits-label').textContent=tr('credits'); $('meaning-label').textContent=tr('meaning'); $('noise-label').textContent=tr('noise'); $('systems-title').textContent=tr('systems'); $('systems-note').textContent=tr('systemsNote'); $('log-title').textContent=tr('log'); $('export').textContent=tr('export'); $('reset').textContent=tr('reset'); $('director-preview').textContent=tr('preview'); $('director-apply').textContent=tr('apply'); $('director-exit').textContent=tr('exit'); }
  function render() { const s=shown(); renderText(); const [title,copy]=actCopy(s); $('act-kicker').textContent=`ACT ${['I','II','III','IV','V','VI'][s.act-1]} · ${E.ACTS[s.act-1].range}`; $('act-title').textContent=title; $('act-copy').textContent=copy; $('glyphs').textContent=fmt(s.glyphs,1); $('credits').textContent=fmt(s.credits,1); $('meaning').textContent=fmt(s.meaning,1); $('noise').textContent=fmt(s.noise,1); $('rate').textContent=fmt(E.rate(s),1); $('total').textContent=fmt(s.lifetimeGlyphs); $('status').textContent=`${tr('business')} · ACT ${s.act}/6${preview?' · DIRECTOR PREVIEW':''}`; $('ending').hidden=!s.stopped; $('director').hidden=!directorOpen || isPlayerAudience(); renderActs(s); renderWorld(s); renderActions(s); renderMachines(s); renderAhas(s); $('log').textContent=(s.log||[]).map((x,i)=>`${i?'·':'›'} ${x}`).join('\n'); renderDisclosure(s); if (!preview) save(); }

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