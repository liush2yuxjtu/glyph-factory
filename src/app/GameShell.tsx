'use client';

export default function GameShell() {
  return (
    <main
      aria-label="Glyph Factory / 字工厂"
      style={{ margin: 0, width: '100%', minHeight: '100dvh', background: '#cfd4c2' }}
    >
      <iframe
        title="Glyph Factory / 字工厂 — playable game"
        src="/play.html"
        style={{ display: 'block', width: '100%', height: '100dvh', border: 0, background: '#cfd4c2' }}
      />
    </main>
  );
}
