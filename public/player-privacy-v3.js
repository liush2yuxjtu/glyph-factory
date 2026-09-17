(() => {
  'use strict';

  const LOCALE_KEY = 'glyph-factory-locale-v3';
  const params = new URLSearchParams(location.search);
  const localReviewHost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  // A built player artifact stays a player artifact even when served on localhost.
  const reviewMode = document.documentElement.dataset.audience !== 'player' && localReviewHost && (params.get('review') === '1' || params.get('director') === '1');
  if (reviewMode) return;

  document.documentElement.dataset.audience = 'player';

  // Product rule: new players start in Simplified Chinese. An explicit saved English
  // choice is still respected, so the language switch remains a real user preference.
  let savedLocale = null;
  try {
    savedLocale = localStorage.getItem(LOCALE_KEY);
    if (!savedLocale) localStorage.setItem(LOCALE_KEY, 'zh-CN');
  } catch {}
  if (!savedLocale && document.documentElement.lang === 'en') {
    document.getElementById('lang-toggle')?.click();
  }

  const isChinese = () => document.documentElement.lang !== 'en';
  const updateTitle = () => { document.title = isChinese() ? '字工厂' : 'Glyph Factory'; };
  updateTitle();

  const remove = (selector) => document.querySelectorAll(selector).forEach((node) => node.remove());
  const hide = (selector) => document.querySelectorAll(selector).forEach((node) => {
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
  });

  const enforcePlayerSurface = () => {
    // Aha IDs, reveal copy, history and act/meta framing are design language, not player copy.
    // Never let controller re-renders revive developer/design language in a player surface.
    // These nodes stay in the DOM because the controller owns them, but they remain hidden.
    remove('.head-actions a[href="/preview.html"]');
    hide('#director-toggle');
    hide('#director');
    hide('.aha-focus');
    hide('#aha-list');
    hide('#aha-count');
    hide('.panel-head:has(#aha-count)');
    hide('#act-strip');
    hide('.act-kicker');
    hide('.act-title');
    hide('.act-copy');
    hide('.eyebrow');
    hide('#systems-note');
  };

  const scrubStatus = () => {
    const el = document.getElementById('status');
    if (!el) return;
    const next = el.textContent
      .replace(/\s*·\s*ACT\s+\d+\/6/gi, '')
      .replace(/\s*·\s*DIRECTOR PREVIEW/gi, '')
      .trim();
    if (next !== el.textContent) el.textContent = next;
  };

  const scrubLog = () => {
    const el = document.getElementById('log');
    if (!el) return;
    const next = el.textContent
      .split('\n')
      .filter((line) => !/^[›·]?\s*A\d{2}\s*·/.test(line.trim()))
      .join('\n');
    if (next !== el.textContent) el.textContent = next;
  };

  const metricLabels = new Map([
    ['AUTO / 自动', '自动化'],
    ['CONTRACTS / 委托', '委托'],
    ['TYPISTS / 打字员', '打字员'],
    ['PRESSES / 印刷机', '印刷机'],
    ['READERS / 读者', '读者'],
    ['DEMAND / 需求', '需求'],
    ['COMPOSED / 组合字', '组合字'],
    ['DELETED / 已删噪音', '已删除噪音'],
    ['DISTRICTS / 街区', '街区'],
    ['CONCEPTS / 概念', '概念'],
    ['EFFECTS / 社会变化', '社会变化'],
    ['SCALE / 地图', '地图范围'],
    ['AGENTS', '智能体'],
    ['AGENT FACTORIES', '智能体工厂'],
    ['AUTO ARTICLES', '自动文章'],
    ['ARCHIVES / 记忆', '档案记忆'],
    ['MACHINE GLYPHS', '机器字形'],
    ['MACHINE USE', '机器使用'],
    ['COMPRESSED', '已压缩意义'],
    ['HUMAN MEANING', '人类意义'],
    ['INFRA / 基础设施', '基础设施'],
    ['AMBIGUITY / 歧义', '歧义'],
    ['DELETED / 删除', '已删除'],
  ]);
  const scaleLabels = new Map([
    ['DESK', '桌面'],
    ['CITY', '城市'],
    ['NETWORK', '传播网络'],
    ['MACHINE', '机器语言'],
    ['WORLD', '世界'],
    ['SILENCE', '静默'],
  ]);

  let localizing = false;
  const translateChineseChrome = () => {
    if (!isChinese() || localizing) return;
    localizing = true;
    try {
      const skip = document.querySelector('a.sr-only[href="#main-game"]');
      if (skip && skip.textContent !== '跳到游戏') skip.textContent = '跳到游戏';

      const worldTitle = document.querySelector('.world-head span:first-child');
      if (worldTitle && worldTitle.textContent !== '世界模型') worldTitle.textContent = '世界模型';

      const systemsTitle = document.getElementById('systems-title');
      if (systemsTitle && systemsTitle.textContent !== '系统') systemsTitle.textContent = '系统';

      const logPanelHint = document.querySelector('#log')?.closest('.panel')?.querySelector('.panel-head span');
      if (logPanelHint && logPanelHint.textContent !== '最近 40 条') logPanelHint.textContent = '最近 40 条';

      const worldScale = document.getElementById('world-scale');
      if (worldScale && scaleLabels.has(worldScale.textContent)) worldScale.textContent = scaleLabels.get(worldScale.textContent);

      document.querySelectorAll('#world-metrics span').forEach((node) => {
        const replacement = metricLabels.get(node.textContent);
        if (replacement) node.textContent = replacement;
      });
      document.querySelectorAll('#world-metrics strong').forEach((node) => {
        if (node.textContent === 'ON') node.textContent = '开启';
        if (node.textContent === 'OFF') node.textContent = '关闭';
        if (scaleLabels.has(node.textContent)) node.textContent = scaleLabels.get(node.textContent);
      });
      document.querySelectorAll('#primary-actions button span:first-child').forEach((node) => {
        const next = node.textContent.replace(/Agent/g, '智能体');
        if (next !== node.textContent) node.textContent = next;
      });
      document.querySelectorAll('#primary-actions .action-sub').forEach((node) => {
        if (node.textContent === 'ON') node.textContent = '开启';
        if (node.textContent === 'OFF') node.textContent = '关闭';
      });
      document.querySelectorAll('.machine small').forEach((node) => {
        const next = node.textContent.replace(/\bcredits\b/gi, '资金');
        if (next !== node.textContent) node.textContent = next;
      });
    } finally {
      localizing = false;
    }
  };

  const refreshPlayerBoundary = () => {
    enforcePlayerSurface();
    scrubStatus();
    scrubLog();
    updateTitle();
    translateChineseChrome();
  };

  const observer = new MutationObserver(refreshPlayerBoundary);
  const mainGame = document.getElementById('main-game');
  if (mainGame) observer.observe(mainGame, { childList: true, characterData: true, subtree: true });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  refreshPlayerBoundary();
})();
