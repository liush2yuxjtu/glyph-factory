(() => {
  'use strict';

  const params = new URLSearchParams(location.search);
  const reviewMode = params.get('review') === '1' || params.get('director') === '1';
  if (reviewMode) return;

  document.documentElement.dataset.audience = 'player';
  document.title = document.documentElement.lang === 'en' ? 'Glyph Factory' : '字工厂';

  const remove = (selector) => document.querySelectorAll(selector).forEach((node) => node.remove());
  const hide = (selector) => document.querySelectorAll(selector).forEach((node) => {
    node.hidden = true;
    node.setAttribute('aria-hidden', 'true');
  });

  // Review/designer affordances must never appear in the normal player surface.
  remove('.head-actions a[href="/preview.html"]');
  remove('#director-toggle');
  hide('#director');

  // Aha IDs, reveal copy, history and act/meta framing are design language, not player copy.
  hide('.aha-focus');
  hide('#aha-list');
  hide('#aha-count');
  const ahaHead = document.querySelector('#aha-count')?.closest('.panel-head');
  if (ahaHead) hide('.panel-head:has(#aha-count)');
  hide('#act-strip');
  hide('.act-kicker');
  hide('.act-title');
  hide('.act-copy');
  hide('.eyebrow');
  hide('#systems-note');

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

  const observer = new MutationObserver(() => {
    scrubStatus();
    scrubLog();
  });
  const status = document.getElementById('status');
  const log = document.getElementById('log');
  if (status) observer.observe(status, { childList: true, characterData: true, subtree: true });
  if (log) observer.observe(log, { childList: true, characterData: true, subtree: true });

  scrubStatus();
  scrubLog();
})();
