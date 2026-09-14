'use client';

import { useEffect, useMemo, useState } from 'react';

type GameState = {
  glyphs: number;
  credits: number;
  keyboards: number;
  typists: number;
  presses: number;
  lifetimeGlyphs: number;
  log: string[];
};

const INITIAL: GameState = {
  glyphs: 0,
  credits: 0,
  keyboards: 0,
  typists: 0,
  presses: 0,
  lifetimeGlyphs: 0,
  log: ['BOOT SEQUENCE COMPLETE.', 'One blank page waits under the lamp.'],
};

const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

export default function Home() {
  const [game, setGame] = useState<GameState>(INITIAL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('glyph-factory-save-v1');
    if (saved) {
      try { setGame({ ...INITIAL, ...JSON.parse(saved) }); } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('glyph-factory-save-v1', JSON.stringify(game));
  }, [game, loaded]);

  const glyphsPerSecond = useMemo(
    () => game.keyboards * 0.5 + game.typists * 2 + game.presses * 12,
    [game.keyboards, game.typists, game.presses]
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setGame((g) => {
        const rate = g.keyboards * 0.5 + g.typists * 2 + g.presses * 12;
        if (!rate) return g;
        const made = rate / 4;
        return { ...g, glyphs: g.glyphs + made, lifetimeGlyphs: g.lifetimeGlyphs + made };
      });
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  const addLog = (text: string) => {
    setGame((g) => ({ ...g, log: [text, ...g.log].slice(0, 7) }));
  };

  const printGlyph = () => {
    setGame((g) => ({ ...g, glyphs: g.glyphs + 1, lifetimeGlyphs: g.lifetimeGlyphs + 1 }));
  };

  const sell = () => {
    setGame((g) => {
      const amount = Math.floor(g.glyphs);
      if (amount < 1) return g;
      return { ...g, glyphs: g.glyphs - amount, credits: g.credits + amount * 0.12 };
    });
  };

  const buy = (type: 'keyboards' | 'typists' | 'presses', cost: number, label: string) => {
    setGame((g) => {
      if (g.credits < cost) return g;
      return { ...g, credits: g.credits - cost, [type]: g[type] + 1 };
    });
    addLog(`${label} added to the floor.`);
  };

  const reset = () => {
    localStorage.removeItem('glyph-factory-save-v1');
    setGame(INITIAL);
  };

  const era = game.lifetimeGlyphs >= 1000 ? 'INDUSTRIAL SCRIPT' : game.lifetimeGlyphs >= 150 ? 'SMALL PRESS' : 'DESK LAMP ERA';

  return (
    <main className="shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">TEXT INDUSTRY SIMULATION // MOBILE BUILD 001</p>
          <h1>GLYPH<span>//</span>FACTORY</h1>
        </div>
        <div className="statusLamp"><i /> ONLINE</div>
      </header>

      <section className="ticker" aria-label="game status">
        <span>ERA: {era}</span>
        <span>OUTPUT: {money(glyphsPerSecond)}/s</span>
        <span>TOTAL: {Math.floor(game.lifetimeGlyphs).toLocaleString()}</span>
      </section>

      <section className="heroGrid">
        <div className="pixelScene" aria-label="pixel art printing desk">
          <div className="windowPixels" />
          <div className="lamp"><b /><i /></div>
          <div className="printer"><b className="paper">A</b><i /><em /></div>
          <div className="desk" />
          <div className="floorLines" />
        </div>

        <div className="resourcePanel">
          <div className="metric primary"><span>GLYPHS</span><strong>{Math.floor(game.glyphs).toLocaleString()}</strong></div>
          <div className="metric"><span>CREDITS</span><strong>¢ {money(game.credits)}</strong></div>
          <button className="bigAction" onClick={printGlyph}>PRINT 1 GLYPH</button>
          <button className="sellAction" onClick={sell} disabled={game.glyphs < 1}>SELL PRINTED STOCK</button>
        </div>
      </section>

      <section className="sectionBlock">
        <div className="sectionTitle"><span>PRODUCTION FLOOR</span><small>AUTOMATION</small></div>
        <div className="upgradeList">
          <Upgrade title="MECHANICAL KEYBOARD" subtitle="+0.5 glyph / sec" owned={game.keyboards} cost={5} credits={game.credits} onBuy={() => buy('keyboards', 5, 'Mechanical keyboard')} icon="⌨" />
          <Upgrade title="NIGHT TYPIST" subtitle="+2 glyphs / sec" owned={game.typists} cost={24} credits={game.credits} onBuy={() => buy('typists', 24, 'Night typist')} icon="人" />
          <Upgrade title="MINI PRESS" subtitle="+12 glyphs / sec" owned={game.presses} cost={120} credits={game.credits} onBuy={() => buy('presses', 120, 'Mini press')} icon="▣" />
        </div>
      </section>

      <section className="terminal">
        <div className="sectionTitle"><span>TERMINAL</span><small>EVENT LOG</small></div>
        {game.log.map((line, i) => <p key={`${line}-${i}`}><span>{i === 0 ? '>' : '·'}</span> {line}</p>)}
      </section>

      <footer>
        <span>SAVE: LOCAL DEVICE</span>
        <button onClick={reset}>RESET RUN</button>
      </footer>
    </main>
  );
}

function Upgrade({ title, subtitle, owned, cost, credits, onBuy, icon }: { title: string; subtitle: string; owned: number; cost: number; credits: number; onBuy: () => void; icon: string; }) {
  return (
    <article className="upgradeCard">
      <div className="pixelIcon">{icon}</div>
      <div className="upgradeCopy"><strong>{title}</strong><span>{subtitle}</span><small>OWNED {owned}</small></div>
      <button onClick={onBuy} disabled={credits < cost}>¢{cost}</button>
    </article>
  );
}
