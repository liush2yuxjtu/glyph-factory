'use client';

import { useEffect, useState } from 'react';

export default function ProductDemoPage() {
  const [wood, setWood] = useState(0);
  const [forest, setForest] = useState(0);
  const [mold, setMold] = useState(false);

  useEffect(() => {
    if (!mold) return;
    const id = window.setInterval(() => {
      setWood((currentWood) => {
        if (currentWood < 2) return currentWood;
        setForest((value) => value + 1);
        return currentWood - 2;
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, [mold]);

  const unlocked = wood >= 3 || mold;

  return (
    <main style={styles.page}>
      <section style={styles.frame}>
        <div style={styles.eyebrow}>GLYPH FACTORY · PRODUCT DEMO</div>
        <h1 style={styles.title}>Aha Moment：从“印字”到“发明规则”</h1>
        <p style={styles.deck}>先让玩家以为自己在做字。然后突然告诉他：真正能扩张的，是字与字之间的关系。</p>

        <div style={styles.stage}>
          <div style={styles.counterRow}>
            <div style={styles.metric}><span style={styles.metricLabel}>木</span><strong style={styles.metricValue}>{wood}</strong></div>
            <div style={styles.arrow}>→</div>
            <div style={{...styles.metric, background:'#c8ef70'}}><span style={styles.metricLabel}>林</span><strong style={styles.metricValue}>{forest}</strong></div>
          </div>

          <button style={{...styles.button, ...styles.primary}} onClick={() => setWood((value) => value + 1)}>
            印一个「木」
          </button>

          <button
            style={{...styles.button, opacity: unlocked && !mold ? 1 : 0.45}}
            disabled={!unlocked || mold}
            onClick={() => {
              if (wood < 2) return;
              setWood((value) => value - 2);
              setForest((value) => value + 1);
              setMold(true);
            }}
          >
            刻模：木 + 木 → 林
          </button>

          <div style={styles.machine}>
            {!unlocked && <>先亲手印 3 个「木」</>}
            {unlocked && !mold && <>新发现：字形关系也能被做成机器。</>}
            {mold && <>模具已启动。只要库存里有两个「木」，机器就自动压出「林」。</>}
          </div>
        </div>

        <div style={styles.aha}>
          <div style={styles.ahaLabel}>玩家脑中的那一下</div>
          <div style={styles.ahaQuote}>“原来我不是在刷字。<br/>我在设计一套会自己生产新字的系统。”</div>
        </div>

        <div style={styles.compare}>
          <div><b>Paperclips</b><span>手动做夹子 → 自动夹子 → 你开始优化机器</span></div>
          <div><b>Glyph Factory</b><span>手动印字 → 刻出组合规则 → 你开始设计文字机器</span></div>
        </div>

        <a href="/eli5-aha.html" style={styles.link}>打开中文 ELI5 图解 →</a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#d7d9c9', color: '#17201a', padding: '24px 14px', fontFamily: 'system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif' },
  frame: { maxWidth: 860, margin: '0 auto', background: '#f1eddf', border: '2px solid #17201a', boxShadow: '6px 6px 0 #17201a', padding: 'clamp(20px,5vw,44px)' },
  eyebrow: { fontSize: 12, letterSpacing: '.13em', fontWeight: 800, color: '#a34e34' },
  title: { fontSize: 'clamp(32px,7vw,58px)', lineHeight: 1.02, margin: '10px 0 12px' },
  deck: { fontSize: 16, lineHeight: 1.7, maxWidth: 680, color: '#526055', marginBottom: 26 },
  stage: { background: '#fffdf5', border: '2px solid #17201a', padding: 18, display: 'grid', gap: 12 },
  counterRow: { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' },
  metric: { border: '2px solid #17201a', background: '#fffdf5', padding: 16, textAlign: 'center' },
  metricLabel: { display: 'block', fontSize: 32, fontFamily: 'serif', fontWeight: 800 },
  metricValue: { display: 'block', fontSize: 44, lineHeight: 1.1 },
  arrow: { fontSize: 34, fontWeight: 900 },
  button: { minHeight: 54, border: '2px solid #17201a', background: '#fffdf5', color: '#17201a', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: '3px 3px 0 #17201a' },
  primary: { background: '#17201a', color: '#c8ef70' },
  machine: { border: '2px dashed #17201a', padding: 16, textAlign: 'center', fontWeight: 800, minHeight: 58 },
  aha: { marginTop: 26, background: '#17201a', color: '#c8ef70', padding: 24, textAlign: 'center' },
  ahaLabel: { fontSize: 12, letterSpacing: '.12em', marginBottom: 8 },
  ahaQuote: { fontSize: 'clamp(22px,5vw,34px)', fontWeight: 900, lineHeight: 1.35 },
  compare: { display: 'grid', gap: 10, marginTop: 18 },
  link: { display: 'inline-block', marginTop: 20, color: '#17201a', fontWeight: 800, textUnderlineOffset: 4 },
};
