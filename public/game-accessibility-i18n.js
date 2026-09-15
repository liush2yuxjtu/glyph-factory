/* Glyph Factory bilingual + accessibility enhancement layer.
 * Runs inside the same-origin play.html frame and never reads or mutates game state.
 */
(() => {
  'use strict';
  if (window.GlyphAccessibilityI18n) return;

  const VERSION = 'a11y-i18n-20260915.1';
  const LOCALE_KEY = 'glyph-factory.locale.v2';
  const ZH = 'zh-CN';
  const EN = 'en';

  const ENGLISH = Object.freeze({
    '一间工坊，写满世界。': 'One workshop. A world of words.',
    '单人工坊': 'Solo workshop',
    '怎么玩': 'How to play',
    '自动': 'Automatic',
    '累计': 'Total',
    '字': 'glyphs',
    '字／秒': 'glyphs/sec',
    '营业中': 'OPEN',
    '印字工坊': 'Glyph printing workshop',
    '像素画：夜晚的书桌、台灯和打字机': 'Pixel art: a nighttime desk, lamp, and typewriter',
    '第一句话，还在等你。': 'The first sentence is still waiting.',
    '机器不停，故事就不会结束。': 'As long as the machines run, the story keeps going.',
    '待售文字': 'Glyph inventory',
    '字 · 库存': 'glyphs · inventory',
    '工坊资金': 'Workshop credits',
    '每字售价 0.5': 'Sell price: 0.5 each',
    '印一个字': 'Print one glyph',
    '印四个字': 'Print four glyphs',
    '出售全部库存': 'Sell all inventory',
    '先印 10 个字，再出售，买下第一台机械键盘。': 'Print 10 glyphs, sell them, then buy your first mechanical keyboard.',
    '出售库存可以换取资金；第一台机械键盘只需 5 资金。': 'Sell inventory for credits; your first mechanical keyboard costs only 5 credits.',
    '工坊已经开始自动生产。完成街角委托，扩建你的车间。': 'Your workshop is producing automatically. Complete street orders and expand the floor.',
    '打开研发室，让手动印字更快，或解锁自动出售。': 'Open R&D to speed up manual printing or unlock auto-sell.',
    '正在自动出售。需要积攒委托库存时，请到研发室暂停。': 'Auto-sell is running. Pause it in R&D when you need inventory for an order.',
    '第一章已通关。继续经营，或导出存档留作纪念。': 'Chapter 1 complete. Keep running the workshop, or export your save as a keepsake.',
    '阶段进度': 'Chapter progress',
    '工坊面板': 'Workshop panels',
    '生产车间': 'Production',
    '研发室': 'R&D',
    '工坊日志': 'Workshop log',
    '让文字自己生长': 'Make the words grow themselves',
    '设备持续生产 · 价格递增': 'Machines produce continuously · prices increase',
    '不只印得更多': 'Print smarter, not just more',
    '研发只需购买一次': 'Research is purchased once',
    '复写纸': 'Carbon paper',
    '手动印字从 1 个变为 4 个。': 'Manual printing increases from 1 glyph to 4.',
    '累计 150 字解锁 · 45 资金': 'Unlock at 150 total glyphs · 45 credits',
    '自动售货台': 'Auto-sell counter',
    '无需点击出售。交付委托前，可暂停积攒库存。': 'Sells without clicking. Pause it before orders to build inventory.',
    '累计 300 字解锁 · 60 资金': 'Unlock at 300 total glyphs · 60 credits',
    '研发': 'Research',
    '已研发': 'Researched',
    '自动出售：已暂停': 'Auto-sell: paused',
    '自动出售：已暂停 · 点击开启': 'Auto-sell: paused · click to start',
    '自动出售：运行中 · 点击暂停': 'Auto-sell: running · click to pause',
    '夜班记录': 'Night-shift log',
    '保留最近 24 条': 'Latest 24 entries',
    '街角委托': 'Street orders',
    '待寄': 'TO SEND',
    '给邻居的一封信': 'A letter for the neighbor',
    '街角书店的传单': 'Flyers for the corner bookshop',
    '送往远方的故事': 'A story sent far away',
    '交付委托': 'Deliver order',
    '委托比直接出售更划算。它们需要库存，不是累计产量。': 'Orders pay better than direct sales. They require inventory, not lifetime production.',
    '这条街，记住了你的名字。': 'This street remembers your name.',
    '三份委托全部完成。把工坊的故事，写进你的第一份报纸。': 'All three orders are complete. Put the workshop story into your first newspaper.',
    '委托已全部完成': 'All orders complete',
    '你的第一份报纸': 'Your first newspaper',
    '把明天，交到所有人手中。': 'Put tomorrow into everyone’s hands.',
    '累计印出 5,000 字，拥有 1 台印刷机，准备 200 库存文字与 300 资金。': 'Print 5,000 total glyphs, own 1 printing press, and prepare 200 inventory plus 300 credits.',
    '发行《明日》创刊号': 'Publish the first issue of Tomorrow',
    '第一章通关：世界有了明天。': 'Chapter 1 complete: the world has a tomorrow.',
    '你从一个字开始，造出一间工厂，又把第一份《明日》送到了城市每个角落。现在可以继续经营，或导出这份存档。': 'You began with one glyph, built a factory, and delivered the first issue of Tomorrow across the city. Keep playing or export this save.',
    '《明日》创刊号 · 已发行': 'Tomorrow · first issue published',
    '第一章已通关，你仍可以继续经营。': 'Chapter 1 is complete; you can keep running the workshop.',
    '最后一步：发行《明日》创刊号': 'Final step: publish the first issue of Tomorrow',
    '已自动保存 · 当前浏览器 · 最多结算离线 8 小时': 'Autosaved · this browser · up to 8 hours of offline progress',
    '浏览器不允许存档 · 请导出备份，关闭页面会丢失进度': 'This browser blocked saving · export a backup or progress will be lost when the page closes',
    '浏览器不允许存档 · 请导出备份': 'This browser blocked saving · export a backup',
    '正在读取本地存档…': 'Loading local save…',
    '导出存档': 'Export save',
    '重新开始': 'Start over',
    '从一个字，到一座工厂。': 'From one glyph to a factory.',
    '关闭玩法说明': 'Close game instructions',
    '关闭': 'Close',
    '01　印字': '01  Print',
    '点击「印一个字」。文字先放进库存。': 'Choose “Print one glyph.” New glyphs first go into inventory.',
    '02　出售或交订单': '02  Sell or deliver orders',
    '把库存换成资金；街角委托给得更多。': 'Turn inventory into credits; street orders pay more.',
    '03　购买自动化': '03  Buy automation',
    '机械键盘、打字员、印刷机会自己印字。离线最多结算 8 小时。': 'Mechanical keyboards, typists, and printing presses produce automatically. Offline progress is capped at 8 hours.',
    '04　写满世界': '04  Write across the world',
    '解锁研发，累计印出 5,000 字，再发行《明日》创刊号，完成第一章。': 'Unlock research, print 5,000 total glyphs, then publish the first issue of Tomorrow to finish Chapter 1.',
    '存档只存在当前浏览器，不上传服务器。清理网站数据会删除进度，请用「导出存档」备份。自动出售会消耗库存，交订单前请暂停。': 'Your save stays only in this browser and is not uploaded. Clearing site data deletes progress, so use “Export save” for backups. Auto-sell consumes inventory; pause it before orders.',
    '重新开始这一章？': 'Start this chapter over?',
    '这会清空当前浏览器中的工坊进度。可以先取消并导出存档。': 'This clears workshop progress in this browser. You can cancel and export your save first.',
    '保留进度': 'Keep progress',
    '确认重新开始': 'Confirm restart',
    '游戏需要浏览器启用 JavaScript。': 'This game requires JavaScript.',
    '机械键盘': 'Mechanical keyboard',
    '夜班打字员': 'Night-shift typist',
    '小型印刷机': 'Small printing press',
    '让第一行字自己长出来。': 'Let the first line of text grow by itself.',
    '你休息的时候，故事还在继续。': 'The story continues while you rest.',
    '一张书桌，开始变成一间工厂。': 'A desk begins to become a factory.',
    '台灯时代': 'Lamp-lit era',
    '街角印坊': 'Corner printshop',
    '机器轰鸣': 'Machines roaring',
    '城市来信': 'Letters from the city',
    '写满世界': 'Write across the world',
    '深夜，你在旧仓库找到一台打字机。它只问你：第一句话是什么？': 'Late at night, you find a typewriter in an old warehouse. It asks only one thing: what is the first sentence?',
    '第一批字走出了房间。街角有人问：明天还会有新的故事吗？': 'The first batch of words leaves the room. Someone on the corner asks: will there be a new story tomorrow?',
    '墙后的空房间开始亮灯。你造的不再只是文字，而是传播文字的机器。': 'Lights come on in the empty room beyond the wall. You are no longer making only words, but machines that spread them.',
    '陌生城市寄来空白信封。他们等着你，为他们写下明天。': 'Blank envelopes arrive from unfamiliar cities. They are waiting for you to write tomorrow for them.',
    '印刷机的声音穿过夜色。现在，给所有人印一份属于他们的报纸。': 'The sound of printing presses travels through the night. Now print a newspaper for everyone.',
    '台灯亮了。点击「印一个字」，开始你的工坊。': 'The lamp clicks on. Choose “Print one glyph” to begin your workshop.',
    '复写纸研发完成。每次手动印字变为 4 个。': 'Carbon-paper research complete. Manual printing now makes 4 glyphs per press.',
    '自动售货台研发完成。手动开启后自动出售库存；交订单前可暂停。': 'Auto-sell research complete. Turn it on to sell inventory automatically; pause it before orders.',
    '自动出售已暂停，开始积攒订单库存。': 'Auto-sell paused. Inventory will now accumulate for orders.',
    '自动出售已开启。库存将按每字 0.5 资金出售。': 'Auto-sell enabled. Inventory sells for 0.5 credits per glyph.',
    '《明日》创刊号发行了。你从一个字开始，让整座城市有了共同的故事。第一章通关。': 'The first issue of Tomorrow is out. Starting from one glyph, you gave the whole city a shared story. Chapter 1 complete.',
    '已开始新的工坊。': 'A new workshop has begun.',
    '已导出存档文件。请妥善保管。': 'Save file exported. Keep it somewhere safe.',
    '工坊资源': 'Workshop resources',
    '存档与数据': 'Save and data controls'
  });

  const textRecords = new WeakMap();
  const attributeRecords = new WeakMap();
  const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'PRE', 'CODE']);
  let locale = ZH;
  let observer = null;
  let renderFrame = null;
  let announcer = null;

  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === ZH || saved === EN) locale = saved;
    else locale = navigator.language.toLowerCase().startsWith('zh') ? ZH : EN;
  } catch {
    locale = navigator.language.toLowerCase().startsWith('zh') ? ZH : EN;
  }

  const english = (text) => ENGLISH[text] || text;

  function compactNumber(token) {
    let match = token.match(/^([\d.]+)万$/);
    if (match) return `${Number((Number(match[1]) * 10).toFixed(1))}K`;
    match = token.match(/^([\d.]+)亿$/);
    if (match) return `${Number((Number(match[1]) * 100).toFixed(1))}M`;
    return token;
  }

  function translateCore(text) {
    if (locale !== EN || !text) return text;
    if (ENGLISH[text]) return ENGLISH[text];

    let match = text.match(/^([·›]\s)(.+)$/);
    if (match) return match[1] + translateCore(match[2]);

    if (/^[\d.]+(?:万|亿)$/.test(text)) return compactNumber(text);

    match = text.match(/^0(\d) · (.+)$/);
    if (match) return `0${match[1]} · ${english(match[2])}`;
    match = text.match(/^第一章 · (.+)$/);
    if (match) return `Chapter 1 · ${english(match[1])}`;
    match = text.match(/^每次 \+(.+)$/);
    if (match) return `+${compactNumber(match[1])} per press`;
    match = text.match(/^每台 \+(.+) 字／秒$/);
    if (match) return `+${compactNumber(match[1])} glyphs/sec each`;
    match = text.match(/^下一阶段：累计印出 (.+) 字$/);
    if (match) return `Next stage: ${compactNumber(match[1])} total glyphs`;
    match = text.match(/^累计 (.+) 字解锁$/);
    if (match) return `Unlock at ${compactNumber(match[1])} total glyphs`;
    match = text.match(/^已拥有 (.+) 台$/);
    if (match) return `${compactNumber(match[1])} owned`;
    match = text.match(/^尚未解锁$/);
    if (match) return 'Locked';
    match = text.match(/^\+(.+) 资金$/);
    if (match) return `+${compactNumber(match[1])} credits`;
    match = text.match(/^([\d,.]+(?:万|亿)?) 资金$/);
    if (match) return `${compactNumber(match[1])} credits`;
    match = text.match(/^交付 (.+) 个库存文字，获得 (.+) 资金。$/);
    if (match) return `Deliver ${compactNumber(match[1])} inventory glyphs and receive ${compactNumber(match[2])} credits.`;
    match = text.match(/^交付 (.+) 字 → \+(.+) 资金$/);
    if (match) return `Deliver ${compactNumber(match[1])} glyphs → +${compactNumber(match[2])} credits`;
    match = text.match(/^购买(.+)$/);
    if (match) return `Buy ${english(match[1])}`;
    match = text.match(/^(.+) 购买需要 (.+) 资金。$/);
    if (match) return `${english(match[1])} Purchase requires ${compactNumber(match[2])} credits.`;
    match = text.match(/^新篇章：(.+)。(.+)$/);
    if (match) return `New chapter: ${english(match[1])}. ${english(match[2])}`;
    match = text.match(/^欢迎回来。离开时工坊生产了 (.+) 个字（最多结算 8 小时）。$/);
    if (match) return `Welcome back. The workshop made ${compactNumber(match[1])} glyphs while you were away (up to 8 hours).`;
    match = text.match(/^购入(.+)。自动产量增加 (.+) 字／秒。$/);
    if (match) return `Bought ${english(match[1])}. Automatic output increased by ${compactNumber(match[2])} glyphs/sec.`;
    match = text.match(/^完成委托「(.+)」，获得 (.+) 资金。$/);
    if (match) return `Completed “${english(match[1])}” and received ${compactNumber(match[2])} credits.`;
    match = text.match(/^发行条件：累计 (.+) \/ 5,000 字 · 印刷机 (.+) \/ 1 台 · 库存 (.+) \/ 200 字 · 资金 (.+) \/ 300。$/);
    if (match) return `Publish requirements: total ${compactNumber(match[1])} / 5,000 glyphs · presses ${match[2]} / 1 · inventory ${compactNumber(match[3])} / 200 glyphs · credits ${compactNumber(match[4])} / 300.`;

    return text;
  }

  function withWhitespace(raw, translated) {
    const first = raw.search(/\S/);
    if (first < 0) return raw;
    const last = raw.search(/\s*$/);
    return raw.slice(0, first) + translated + raw.slice(last);
  }

  function shouldIgnore(node) {
    for (let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement; el; el = el.parentElement) {
      if (el.id === 'glyph-accessibility-bar' || el.id === 'glyph-a11y-announcer') return true;
      if (ignoredTags.has(el.tagName) || el.isContentEditable || el.hasAttribute('data-no-i18n') || el.getAttribute('translate') === 'no') return true;
    }
    return false;
  }

  function translateTextNode(node) {
    if (shouldIgnore(node) || !node.data.trim()) return;
    let record = textRecords.get(node);
    if (!record || node.data !== record.rendered) record = { source: node.data, rendered: node.data };
    const sourceTrimmed = record.source.trim();
    const next = locale === EN ? withWhitespace(record.source, translateCore(sourceTrimmed)) : record.source;
    if (node.data !== next) node.data = next;
    record.rendered = next;
    textRecords.set(node, record);
  }

  function translateAttributes(el) {
    if (shouldIgnore(el)) return;
    let records = attributeRecords.get(el);
    if (!records) { records = new Map(); attributeRecords.set(el, records); }
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = el.getAttribute(name);
      if (value == null) { records.delete(name); continue; }
      let record = records.get(name);
      if (!record || value !== record.rendered) record = { source: value, rendered: value };
      const next = locale === EN ? translateCore(record.source) : record.source;
      if (value !== next) el.setAttribute(name, next);
      record.rendered = next;
      records.set(name, record);
    }
  }

  function installStyles() {
    if (document.getElementById('glyph-a11y-style')) return;
    const style = document.createElement('style');
    style.id = 'glyph-a11y-style';
    style.textContent = `
      .glyph-skip-link{position:fixed;z-index:10000;left:12px;top:8px;transform:translateY(-160%);padding:10px 14px;border:2px solid #1c241e;background:#f7f3e8;color:#1c241e;font:700 14px/1.2 system-ui,sans-serif;box-shadow:3px 3px 0 #1c241e}
      .glyph-skip-link:focus{transform:none}
      #glyph-accessibility-bar{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap;margin:0 0 14px;padding:8px 0;border-bottom:1px solid #a8ad98;font:600 12px/1.3 system-ui,"PingFang SC","Microsoft YaHei",sans-serif}
      #glyph-accessibility-bar .glyph-language-label{margin-right:auto;color:#4c5545}
      #glyph-accessibility-bar button{min-width:92px;min-height:44px;padding:8px 12px;border:1.5px solid #1c241e;background:#f7f3e8;color:#1c241e;font:700 12px/1.2 inherit;box-shadow:2px 2px 0 #1c241e}
      #glyph-accessibility-bar button[aria-pressed="true"]{background:#1c241e;color:#c7f36b}
      #glyph-accessibility-bar button:focus-visible,.glyph-skip-link:focus-visible{outline:3px solid #7c2f1e;outline-offset:3px}
      .glyph-visually-hidden{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
      :where(button,a,[tabindex]):focus-visible{outline:3px solid #7c2f1e!important;outline-offset:3px!important}
      @media(pointer:coarse){.tabs button,.quiet{min-height:44px!important;min-width:44px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
      @media(forced-colors:active){#glyph-accessibility-bar button,.glyph-skip-link{border:2px solid ButtonText;box-shadow:none}.progress-track>div{forced-color-adjust:auto}}
    `;
    document.head.appendChild(style);
  }

  function installChrome() {
    installStyles();
    document.querySelector('.brand-stamp')?.setAttribute('data-no-i18n', '');
    document.getElementById('paper')?.setAttribute('data-no-i18n', '');
    const brand = document.querySelector('.brand h1');
    brand?.setAttribute('data-no-i18n', '');

    if (!document.querySelector('.glyph-skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'glyph-skip-link';
      skip.href = '#main-game';
      skip.textContent = 'Skip to game / 跳到游戏';
      skip.addEventListener('click', () => setTimeout(() => document.getElementById('main-game')?.focus(), 0));
      document.body.prepend(skip);
    }

    if (!document.getElementById('glyph-accessibility-bar')) {
      const bar = document.createElement('nav');
      bar.id = 'glyph-accessibility-bar';
      bar.setAttribute('aria-label', 'Language / 语言');
      bar.setAttribute('data-no-i18n', '');
      const label = document.createElement('span');
      label.className = 'glyph-language-label';
      label.textContent = '语言 / Language';
      bar.append(label);
      for (const [value, labelText] of [[ZH, '简体中文'], [EN, 'English']]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.locale = value;
        button.lang = value;
        button.textContent = labelText;
        button.addEventListener('click', () => setLocale(value));
        bar.append(button);
      }
      const shell = document.querySelector('.shell');
      shell?.prepend(bar);
    }

    if (!document.getElementById('glyph-a11y-announcer')) {
      announcer = document.createElement('span');
      announcer.id = 'glyph-a11y-announcer';
      announcer.className = 'glyph-visually-hidden';
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.setAttribute('data-no-i18n', '');
      document.body.append(announcer);
    } else announcer = document.getElementById('glyph-a11y-announcer');
  }

  function installSemantics() {
    const main = document.querySelector('main');
    if (main) { main.id = 'main-game'; main.tabIndex = -1; }

    const metrics = document.querySelector('.metrics');
    if (metrics) { metrics.setAttribute('role', 'group'); metrics.setAttribute('aria-label', '工坊资源'); }

    const notice = document.getElementById('notice');
    notice?.setAttribute('aria-atomic', 'true');

    const logs = document.getElementById('logs');
    if (logs) {
      logs.setAttribute('role', 'log');
      logs.setAttribute('aria-live', 'polite');
      logs.setAttribute('aria-relevant', 'additions text');
    }

    const save = document.getElementById('save-status');
    save?.setAttribute('role', 'status');

    const footer = document.querySelector('footer');
    footer?.setAttribute('aria-label', '存档与数据');

    const print = document.getElementById('print');
    print?.setAttribute('aria-keyshortcuts', 'Space');
    print?.setAttribute('aria-describedby', 'hint');

    const help = document.getElementById('help');
    if (help) { help.setAttribute('aria-haspopup', 'dialog'); help.setAttribute('aria-controls', 'help-dialog'); }
    const reset = document.getElementById('reset');
    if (reset) { reset.setAttribute('aria-haspopup', 'dialog'); reset.setAttribute('aria-controls', 'reset-dialog'); }

    const helpDialog = document.getElementById('help-dialog');
    const helpTitle = helpDialog?.querySelector('h2');
    if (helpDialog && helpTitle) {
      helpTitle.id ||= 'help-dialog-title';
      helpDialog.setAttribute('aria-labelledby', helpTitle.id);
    }
    const resetDialog = document.getElementById('reset-dialog');
    const resetTitle = resetDialog?.querySelector('h2');
    const resetDescription = resetDialog?.querySelector('p');
    if (resetDialog && resetTitle) {
      resetTitle.id ||= 'reset-dialog-title';
      resetDialog.setAttribute('aria-labelledby', resetTitle.id);
    }
    if (resetDialog && resetDescription) {
      resetDescription.id ||= 'reset-dialog-description';
      resetDialog.setAttribute('aria-describedby', resetDescription.id);
    }

    const tabs = document.querySelector('.tabs');
    if (tabs && !tabs.dataset.a11yKeyboard) {
      tabs.dataset.a11yKeyboard = 'true';
      tabs.setAttribute('role', 'tablist');
      tabs.addEventListener('keydown', (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        const buttons = [...tabs.querySelectorAll('button[data-tab]')];
        const current = buttons.indexOf(document.activeElement);
        if (current < 0) return;
        event.preventDefault();
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        buttons[next].focus();
        buttons[next].click();
      });
    }
  }

  function syncTabs() {
    document.querySelectorAll('.tabs button[data-tab]').forEach((button, index) => {
      const panelId = button.dataset.tab;
      const panel = panelId && document.getElementById(panelId);
      const active = button.getAttribute('aria-pressed') === 'true';
      button.id ||= `glyph-tab-${panelId || index}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', String(active));
      button.setAttribute('aria-controls', panelId || '');
      button.tabIndex = active ? 0 : -1;
      if (panel) {
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', button.id);
        panel.tabIndex = 0;
      }
    });
  }

  function syncActionNames() {
    const print = document.getElementById('print');
    const printLabel = document.getElementById('print-label')?.textContent?.trim();
    const printGain = document.getElementById('print-gain')?.textContent?.trim();
    if (print && printLabel) {
      print.setAttribute('aria-label', locale === EN
        ? `${printLabel}. ${printGain || ''}. Spacebar shortcut.`
        : `${printLabel}。${printGain || ''}。空格键快捷操作。`);
    }

    document.querySelectorAll('button[id^="buy-"]').forEach((button) => {
      const card = button.closest('.upgrade');
      const name = card?.querySelector('h3')?.textContent?.trim();
      const state = button.textContent?.trim();
      if (name && state) button.setAttribute('aria-label', locale === EN ? `Buy ${name}: ${state}` : `购买${name}：${state}`);
    });
  }

  function syncProgress() {
    const progress = document.getElementById('era-progress');
    const text = document.getElementById('progress-text')?.textContent?.trim();
    const goal = document.getElementById('next-goal')?.textContent?.trim();
    if (progress) {
      progress.setAttribute('aria-label', locale === EN ? 'Chapter progress' : '阶段进度');
      if (text || goal) progress.setAttribute('aria-valuetext', [text, goal].filter(Boolean).join('. '));
    }
  }

  function renderBrandAndMetadata() {
    const brand = document.querySelector('.brand h1');
    if (brand && brand.dataset.glyphLocale !== locale) {
      brand.dataset.glyphLocale = locale;
      brand.innerHTML = locale === EN ? 'GLYPH<span>//</span>FACTORY' : '字<span>//</span>工厂';
    }
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    document.title = locale === EN ? 'Glyph Factory · Start with one glyph' : '字工厂 · 从一个字开始';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', locale === EN
      ? 'A mobile-friendly pixel incremental game about printing glyphs, automation, research, street orders, and local saves.'
      : '从印一个字，到写满世界。手机可玩的中文像素增量游戏，自动化、研发、订单与本地存档。');
    const bar = document.getElementById('glyph-accessibility-bar');
    bar?.setAttribute('aria-label', locale === EN ? 'Language' : '语言');
    bar?.querySelectorAll('button[data-locale]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.locale === locale));
    });
  }

  function renderAll() {
    renderFrame = null;
    observer?.disconnect();
    try {
      installChrome();
      installSemantics();
      renderBrandAndMetadata();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
        else translateAttributes(node);
      }
      syncTabs();
      syncActionNames();
      syncProgress();
    } finally {
      observer?.observe(document.body, {
        childList: true,
        characterData: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-label', 'title', 'placeholder', 'alt', 'aria-pressed', 'hidden']
      });
    }
  }

  function scheduleRender() {
    if (renderFrame == null) renderFrame = requestAnimationFrame(renderAll);
  }

  function setLocale(next, persist = true) {
    if (next !== ZH && next !== EN) return;
    locale = next;
    if (persist) {
      try { localStorage.setItem(LOCALE_KEY, next); } catch { /* switching still works without persistence */ }
    }
    if (renderFrame != null) cancelAnimationFrame(renderFrame);
    renderFrame = null;
    renderAll();
    if (announcer) announcer.textContent = next === EN ? 'Language switched to English.' : '语言已切换为简体中文。';
    window.dispatchEvent(new CustomEvent('glyph:localechange', { detail: { locale: next } }));
  }

  function start() {
    installChrome();
    installSemantics();
    observer = new MutationObserver(scheduleRender);
    renderAll();
    window.GlyphAccessibilityI18n = Object.freeze({
      version: VERSION,
      getLocale: () => locale,
      setLocale,
      supportedLocales: Object.freeze([ZH, EN])
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
