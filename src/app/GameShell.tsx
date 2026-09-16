'use client';

function injectEnhancements(frame: HTMLIFrameElement) {
  const doc = frame.contentDocument;
  if (!doc) return;

  if (!doc.getElementById('glyph-a11y-i18n-script')) {
    const script = doc.createElement('script');
    script.id = 'glyph-a11y-i18n-script';
    script.src = '/game-accessibility-i18n.js';
    script.defer = true;
    doc.head.appendChild(script);
  }

  if (!doc.getElementById('glyph-simple-interaction-script')) {
    const simple = doc.createElement('script');
    simple.id = 'glyph-simple-interaction-script';
    simple.src = '/simple-interaction.js';
    simple.defer = true;
    doc.head.appendChild(simple);
  }
}

export default function GameShell() {
  return (
    <main
      aria-label="Glyph Factory / 字工厂"
      style={{ margin: 0, width: '100%', minHeight: '100dvh', background: '#d7d9c9' }}
    >
      <iframe
        title="Glyph Factory / 字工厂 — playable game"
        src="/play.html"
        onLoad={(event) => injectEnhancements(event.currentTarget)}
        style={{ display: 'block', width: '100%', height: '100dvh', border: 0, background: '#d7d9c9' }}
      />
    </main>
  );
}
