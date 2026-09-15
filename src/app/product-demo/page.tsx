'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

export default function ProductDemoPage() {
  const [wood, setWood] = useState(0);
  const [forest, setForest] = useState(0);
  const [mold, setMold] = useState(false);

  useEffect(() => {
    if (!mold) return;

    const id = window.setInterval(() => {
      setWood((currentWood) => {
        if (currentWood < 2) return currentWood;
        setForest((currentForest) => currentForest + 1);
        return currentWood - 2;
      });
    }, 900);

    return () => window.clearInterval(id);
  }, [mold]);

  const unlocked = wood >= 3 || mold;
  const phase = mold ? 3 : unlocked ? 2 : 1;

  function printWood() {
    setWood((value) => value + 1);
  }

  function activateRule() {
    if (wood < 3 || mold) return;
    setWood((value) => value - 2);
    setForest((value) => value + 1);
    setMold(true);
  }

  function resetDemo() {
    setWood(0);
    setForest(0);
    setMold(false);
  }

  return (
    <main className={styles.page}>
      <section className={styles.frame}>
        <div className={styles.topline}>
          <p className={styles.eyebrow}>GLYPH FACTORY · PRODUCT DEMO</p>
          <p className={styles.phase}>PHASE {phase} / 3</p>
        </div>

        <h1 className={styles.title}>Aha Moment：不是印更多字，而是发明“字的机器”</h1>
        <p className={styles.deck}>
          先让玩家亲手印「木」。第三次之后，游戏突然揭示：两个「木」之间的结构关系，也可以被刻成一条自动生产规则。
        </p>

        <div className={styles.progress} aria-label="体验进度">
          <div className={`${styles.step} ${phase >= 1 ? styles.stepActive : ''}`}>
            <span className={styles.stepNumber}>01</span>
            <strong>手工：我在印字</strong>
          </div>
          <div className={`${styles.step} ${phase >= 2 ? styles.stepActive : ''}`}>
            <span className={styles.stepNumber}>02</span>
            <strong>发现：字能组成规则</strong>
          </div>
          <div className={`${styles.step} ${phase >= 3 ? styles.stepActive : ''}`}>
            <span className={styles.stepNumber}>03</span>
            <strong>自动：规则自己运行</strong>
          </div>
        </div>

        <div className={styles.game}>
          <section className={styles.workbench} aria-label="字库存">
            <div className={styles.stock} aria-live="polite">
              <div className={styles.glyphBox}>
                <div>
                  <span className={styles.glyph}>木</span>
                  <span className={styles.count}>× {wood}</span>
                </div>
              </div>

              <div className={styles.arrow} aria-hidden="true">→</div>

              <div className={`${styles.glyphBox} ${styles.glyphBoxForest}`}>
                <div>
                  <span className={styles.glyph}>林</span>
                  <span className={styles.count}>× {forest}</span>
                </div>
              </div>
            </div>

            <button className={styles.primary} type="button" onClick={printWood}>
              {mold ? '给机器再印一个「木」' : '亲手印一个「木」'}
            </button>

            <button
              className={styles.secondary}
              type="button"
              disabled={!unlocked || mold}
              onClick={activateRule}
            >
              {mold ? '组合规则已运行' : unlocked ? '刻模：木 + 木 → 林' : `再印 ${Math.max(0, 3 - wood)} 个「木」解锁刻模`}
            </button>
          </section>

          <aside className={`${styles.machineCard} ${mold ? styles.running : ''}`} aria-live="polite">
            <h2 className={styles.machineTitle}>组合模具 / COMPOSITION MOLD</h2>
            <div className={styles.machineVisual}>
              <div>
                <div className={styles.recipe}>
                  <span>木</span><span>+</span><span>木</span><span>→</span><span>林</span>
                </div>
                <div className={styles.gear} aria-hidden="true">⚙</div>
              </div>
            </div>
            <p className={styles.machineCopy}>
              {!unlocked && '现在它只是一个空机器。先亲手做出 3 个「木」。'}
              {unlocked && !mold && '新能力出现：不是买一台“更快的印刷机”，而是把字形关系本身做成机器。'}
              {mold && '模具已启动。继续供应「木」，库存每凑够两个，机器就会自动压出一个「林」。'}
            </p>
          </aside>
        </div>

        {mold && (
          <section className={styles.aha} aria-label="Aha Moment">
            <small>AHA MOMENT</small>
            <strong>“原来我不是在刷字。<br />我是在设计一套会自己造新字的系统。”</strong>
          </section>
        )}

        <div className={styles.note}>
          <div>
            <b>Universal Paperclips</b>
            手动做夹子 → 自动做夹子 → 玩家开始优化“生产系统”。
          </div>
          <div>
            <b>Glyph Factory</b>
            手动印字 → 自动执行字形关系 → 玩家开始设计“文字系统”。
          </div>
        </div>

        <div className={styles.footer}>
          <a className={styles.link} href="/eli5-aha.html">打开中文 ELI5 图解 →</a>
          <button className={styles.reset} type="button" onClick={resetDemo}>重新体验</button>
        </div>
      </section>
    </main>
  );
}
