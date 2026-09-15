/* Glyph Factory localization adapter. No game-state reads or writes. */
(() => {
  'use strict';
  if (window.GlyphLanguage) return;
  const VERSION = 'local-i18n-20260915.1';
  const KEY = 'glyph-factory.locale';
  const dictionary = Object.freeze({
    'Glyph Factory': '字工厂',
    'GLYPH FACTORY': '字工厂',
    'RESOURCES': '资源',
    'Resources': '资源',
    'FORGE GLYPH': '铸造字符',
    'Forge Glyph': '铸造字符',
    '+1 PER STRIKE': '每次点击 +1',
    'PER STRIKE': '每次点击',
    'TERMINAL.LOG': '终端日志',
    'SYS.ACTIVE': '系统运行中',
    'The terminal flickers to life. A single prompt blinks.': '终端闪烁着苏醒。一条提示正在等待你的回应。',
    'FORGE': '铸造',
    'Forge': '铸造',
    'SYSTEM': '系统',
    'System': '系统',
    'SYSTEM OS': '系统控制台',
    'Status and Core Controls': '运行状态与核心控制',
    'STATISTICS': '统计',
    'Statistics': '统计',
    'Total Glyphs Generated': '累计生成字符',
    'Manual Strikes': '手动点击次数',
    'Uptime': '运行时间',
    'Upgrades Discovered': '已发现升级',
    'DANGER ZONE': '危险操作',
    'Danger Zone': '危险操作',
    'Wiping the core memory will destroy all progress, constructs, and research permanently. The void will reclaim everything.': '清除核心记忆将永久删除所有进度、构造体和研究成果。一切都将归于虚无。',
    'Initiate Core Wipe': '清除全部进度',
    'SYSTEM_NOMINAL': '系统正常',
    'Notifications (F8)': '通知（F8）',
    'Notifications': '通知',
    'Close': '关闭',
    'Cancel': '取消',
    'Confirm': '确认',
    'Continue': '继续',
    'Settings': '设置',
    'Save': '保存',
    'Load': '载入',
    'Export Save': '导出存档',
    'Import Save': '导入存档',
    'Reset Game': '重置游戏',
    'Are you sure?': '确定要继续吗？',
    'This action cannot be undone.': '此操作无法撤销。',
    'UPGRADES': '升级',
    'Upgrades': '升级',
    'RESEARCH': '研究',
    'Research': '研究',
    'CONSTRUCTS': '构造体',
    'Constructs': '构造体',
    'AUTOMATION': '自动化',
    'Automation': '自动化',
    'Buy': '购买',
    'Purchase': '购买',
    'Unlock': '解锁',
    'Unlocked': '已解锁',
    'Locked': '未解锁',
    'Owned': '已拥有',
    'Cost': '费用',
    'Insufficient Glyphs': '字符不足',
    'Insufficient glyphs': '字符不足',
    'Glyphs': '字符',
    'glyphs': '字符',
    'glyph': '字符',
    '/ sec': '/ 秒',
    '/sec': '/秒',
    'sec': '秒',
    'per second': '每秒',
    'per strike': '每次点击'
  });
  const patterns = [
    [/^\+([\d,.]+) PER STRIKE$/, (_, n) => `每次点击 +${n}`],
    [/^([+\-]?[\d,.]+(?:[KMBT])?)\s*\/\s*sec$/i, (_, n) => `${n} / 秒`],
    [/^([\d,.]+(?:[KMBT])?) glyphs?$/i, (_, n) => `${n} 字符`],
    [/^Owned:\s*([\d,.]+)$/, (_, n) => `已拥有：${n}`],
    [/^Cost:\s*([\d,.]+)(?: glyphs?)?$/i, (_, n) => `费用：${n} 字符`]
  ];
  const nodes = new WeakMap();
  const attributes = new WeakMap();
  const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'PRE', 'CODE']);
  let language = 'zh-CN';
  let observer;
  let frame = null;
  let switcher;
  let status;
  const baseTitle = document.title;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'zh-CN') language = saved;
  } catch { /* Language switching remains available when storage is blocked. */ }

  function translate(text, locale = language) {
    if (locale !== 'zh-CN' || !text.trim()) return text;
    const trimmed = text.trim();
    let translated = Object.hasOwn(dictionary, trimmed) ? dictionary[trimmed] : undefined;
    if (translated === undefined) {
      for (const [pattern, render] of patterns) {
        if (pattern.test(trimmed)) { translated = trimmed.replace(pattern, render); break; }
      }
    }
    if (translated === undefined) return text;
    return text.slice(0, text.indexOf(trimmed)) + translated + text.slice(text.indexOf(trimmed) + trimmed.length);
  }

  function ignored(node) {
    for (let element = node.nodeType === 1 ? node : node.parentElement; element; element = element.parentElement) {
      if (element.id === 'glyph-language-switcher' || ignoredTags.has(element.tagName) ||
          element.isContentEditable || element.getAttribute('translate') === 'no' ||
          element.hasAttribute('data-no-localize')) return true;
    }
    return false;
  }

  function translateText(node) {
    if (ignored(node)) return;
    let record = nodes.get(node);
    if (!record || node.data !== record.rendered) record = { original: node.data, rendered: node.data };
    const next = translate(record.original);
    if (node.data !== next) node.data = next;
    record.rendered = next;
    nodes.set(node, record);
  }

  function translateAttributes(element) {
    if (ignored(element)) return;
    let records = attributes.get(element);
    if (!records) { records = new Map(); attributes.set(element, records); }
    for (const name of ['aria-label', 'title', 'placeholder', 'alt']) {
      const value = element.getAttribute(name);
      if (value === null) { records.delete(name); continue; }
      let record = records.get(name);
      if (!record || value !== record.rendered) record = { original: value, rendered: value };
      const next = translate(record.original);
      if (value !== next) element.setAttribute(name, next);
      record.rendered = next;
      records.set(name, record);
    }
  }

  function render() {
    frame = null;
    observer?.disconnect();
    try {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE) translateText(node);
        else translateAttributes(node);
      }
      document.documentElement.lang = language;
      document.title = translate(baseTitle);
      for (const button of switcher.querySelectorAll('button')) {
        const active = button.dataset.locale === language;
        button.setAttribute('aria-pressed', String(active));
      }
      switcher.setAttribute('aria-label', language === 'zh-CN' ? '语言 / Language' : 'Language / 语言');
    } finally {
      observer?.observe(document.body, { childList: true, characterData: true, subtree: true,
        attributes: true, attributeFilter: ['aria-label', 'title', 'placeholder', 'alt'] });
    }
  }

  function schedule() {
    if (frame === null) frame = requestAnimationFrame(render);
  }

  function setLanguage(locale, persist = true) {
    if (locale !== 'en' && locale !== 'zh-CN') throw new TypeError('Unsupported language');
    language = locale;
    if (persist) {
      try { localStorage.setItem(KEY, locale); }
      catch { status.textContent = locale === 'zh-CN' ? '浏览器不允许记住语言' : 'Language cannot be saved in this browser'; }
    }
    if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
    render();
    window.dispatchEvent(new CustomEvent('glyph:languagechange', { detail: { language: locale } }));
  }

  function start() {
    if (document.getElementById('glyph-language-switcher')) return;
    const style = document.createElement('style');
    style.dataset.glyphLanguage = VERSION;
    style.textContent = `
#glyph-language-switcher{position:relative;z-index:1000;display:flex;justify-content:flex-end;align-items:center;gap:6px;min-height:58px;padding:7px max(12px,env(safe-area-inset-right)) 7px max(12px,env(safe-area-inset-left));box-sizing:border-box;background:#0b1019;color:#eef3fb;border-bottom:1px solid #34425c;font:14px/1.3 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;isolation:isolate}
#glyph-language-switcher button{font:inherit;min-height:44px;min-width:82px;padding:8px 12px;border:1px solid #677899;border-radius:4px;background:#151f30;color:#f2f5fb;cursor:pointer;touch-action:manipulation}
#glyph-language-switcher button[aria-pressed="true"]{background:#edf3ff;color:#142034;border-color:#edf3ff;font-weight:700}
#glyph-language-switcher button:focus-visible{outline:3px solid #79b8ff;outline-offset:2px}
#glyph-language-status{font-size:12px;flex:1;overflow-wrap:anywhere}
html[lang="zh-CN"] body{font-family:"PingFang SC","Microsoft YaHei","Noto Sans CJK SC",system-ui,sans-serif}
@media(max-width:360px){#glyph-language-switcher{gap:4px;padding-inline:8px}#glyph-language-switcher button{min-width:76px;padding-inline:8px}}
`;
    document.head.append(style);
    switcher = document.createElement('nav');
    switcher.id = 'glyph-language-switcher';
    switcher.dataset.release = VERSION;
    switcher.setAttribute('aria-label', '语言 / Language');
    status = document.createElement('span');
    status.id = 'glyph-language-status';
    status.setAttribute('role', 'status');
    switcher.append(status);
    for (const [locale, label] of [['zh-CN', '简体中文'], ['en', 'English']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.lang = locale;
      button.dataset.locale = locale;
      button.textContent = label;
      button.addEventListener('click', () => setLanguage(locale));
      switcher.append(button);
    }
    document.body.prepend(switcher);
    observer = new MutationObserver(schedule);
    render();
    window.GlyphLanguage = Object.freeze({ version: VERSION, setLanguage,
      getLanguage: () => language, translate, supported: Object.freeze(['zh-CN', 'en']) });
    window.addEventListener('storage', (event) => {
      if (event.key === KEY && (event.newValue === 'en' || event.newValue === 'zh-CN')) setLanguage(event.newValue, false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
