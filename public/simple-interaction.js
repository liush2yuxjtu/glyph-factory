/* Glyph Factory simple-interaction layer.
 * Keeps the core loop visible and collapses advanced systems behind one control.
 */
(() => {
  'use strict';
  if (window.GlyphSimpleInteraction) return;
  window.GlyphSimpleInteraction = { version: '2026-09-16.1' };

  const STYLE_ID = 'glyph-simple-interaction-style';
  const DETAILS_ID = 'glyph-advanced-systems';

  function installStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${DETAILS_ID}{margin:18px 0 8px;border-top:1px solid var(--line,#c9cbbb);padding-top:12px}
      #${DETAILS_ID}>summary{list-style:none;cursor:pointer;min-height:48px;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--ink,#1c241e);background:transparent;font-weight:750;font-size:12px;letter-spacing:.04em;touch-action:manipulation}
      #${DETAILS_ID}>summary::-webkit-details-marker{display:none}
      #${DETAILS_ID}>summary::after{content:'＋';margin-left:8px;font-size:16px}
      #${DETAILS_ID}[open]>summary::after{content:'－'}
      #${DETAILS_ID}[open]>.lower-grid{margin-top:14px}
      @media (max-width:700px){
        .shell{padding:16px 14px 12px!important}
        .masthead{padding-bottom:12px!important}
        .brand{gap:10px!important}.brand-stamp{width:44px!important;height:48px!important;font-size:30px!important}
        h1{font-size:27px!important}.header-right{gap:8px!important}.status{display:none!important}
        .ticker{padding:9px 0 11px!important}
        .hero{grid-template-columns:1fr!important;gap:14px!important}
        .pixel-scene{min-height:210px!important;order:2}
        .control-panel{order:1}
        .metrics{gap:8px!important}.metric{padding:10px 12px!important}.metric strong{font-size:32px!important}
        .print-button{min-height:68px!important;font-size:20px!important}
        .sell-button{min-height:48px!important}
        .story-card{margin:14px 0!important;padding:10px 12px!important}
        #${DETAILS_ID}{margin-top:14px}
        #${DETAILS_ID} .lower-grid{grid-template-columns:1fr!important;gap:14px!important}
        footer{margin-top:12px!important;flex-wrap:wrap}
        footer>div{width:100%;justify-content:flex-end}
        footer button{min-height:40px!important}
      }
    `;
    document.head.appendChild(style);
  }

  function labelForLocale() {
    return document.documentElement.lang?.toLowerCase().startsWith('en')
      ? 'More factory systems'
      : '更多工坊系统';
  }

  function updateLabel(summary) {
    summary.textContent = labelForLocale();
    summary.setAttribute('aria-label', labelForLocale());
  }

  function simplify() {
    installStyles();
    if (document.getElementById(DETAILS_ID)) return;
    const lower = document.querySelector('.lower-grid');
    if (!lower || !lower.parentElement) return;

    const details = document.createElement('details');
    details.id = DETAILS_ID;
    const summary = document.createElement('summary');
    updateLabel(summary);
    details.appendChild(summary);
    lower.parentElement.insertBefore(details, lower);
    details.appendChild(lower);

    // Keep complexity opt-in after reload; always start collapsed.
    details.open = false;

    new MutationObserver(() => updateLabel(summary)).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang']
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', simplify, { once: true });
  else simplify();

  // The game can rerender sections; retry briefly without touching game state.
  const observer = new MutationObserver(() => simplify());
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
