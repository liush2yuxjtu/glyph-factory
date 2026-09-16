# Glyph Factory Acts Engine v3 Design

## Goal
Turn the current Chapter 1 dead-end into a six-act incremental narrative where all 28 approved Aha Moments appear, with roughly ten of them changing the player's core verb and the rest acting as consequential world events, unlocks, or state reveals.

## Player promise
The player should repeatedly think: “原来这个游戏不是我刚才以为的那个游戏。” Growth remains legible, but each act changes what growth means.

## Acts

1. **ACT I · 手工与自动化** — A01–A02. Preserve the current desk economy: print, sell, buy keyboards/typists/presses, complete street contracts, publish 《明日》.
2. **ACT II · 字开始生长** — A03–A11. Publishing no longer ends the game. Composition rules unlock (`木 + 木 → 林`), readership creates demand, meaning-per-glyph becomes relevant, and deletion can become valuable.
3. **ACT III · 文字改变城市** — A12–A15. District dialects, concept effects, and a city/world map turn text into a social system rather than inventory.
4. **ACT IV · 机器开始写** — A16–A21. Reporter/editor agents choose work, agents can create agents, overnight autonomous publishing becomes visible, digital publishing removes physical inventory constraints, and archives become training memory.
5. **ACT V · 机器语言** — A22–A24. The system creates an unknown glyph, machine-only usage grows, and semantic compression can reduce enormous corpora into compact symbols.
6. **ACT VI · 从增长到沉默** — A25–A28. Language becomes infrastructure, ambiguity/noise rises, optimization flips from production to deletion/compression, and the final winning action is “停止印刷”.

## Core mechanical Ahas
The following must change gameplay, not just display copy: A01 automation, A03 composition rules, A06 readership-demand feedback, A10 meaning-per-glyph scarcity, A13 concepts alter city state, A16 autonomous reporter/editor agents, A18 agents create agents, A22 machine-created glyph, A24 semantic compression, A27 deletion/noise optimization, A28 stop-printing ending.

The remaining Ahas must still be individually addressable (`A01`…`A28`) and appear as events, unlocks, metrics, or visible world changes.

## Engine architecture
Create a standalone browser-compatible `GlyphEngineV3` in `public/glyph-engine-v3.js`. It owns deterministic state transitions and no DOM. It exports/attaches constants, `fresh`, `restore`, `advance`, `act`, `rate`, `actIndex`, `ahaUnlocked`, `directorState`, and formatting-safe state values.

`public/play.html` becomes presentation only and loads `glyph-engine-v3.js` plus `glyph-game-v3.js`. The UI controller renders metrics, act timeline, current Aha, action panels, logs, Director Mode, and save/export/reset behavior.

## State
Keep v2-compatible resources (`glyphs`, `credits`, `lifetimeGlyphs`, `keyboards`, `typists`, `presses`, contracts, research flags). Add v3 fields for `act`, `readers`, `demand`, `meaning`, `noise`, `concepts`, `districts`, `agents`, `agentFactories`, `machineGlyphs`, `compressedMeaning`, `deletedNoise`, `stopped`, `ahaSeen`, and `director`.

State values must be finite, non-negative, bounded where appropriate, and restored defensively. Old v1/v2 saves migrate without resource loss. A completed v2 save must migrate into ACT II rather than remain in an end-state.

## Aha progression
Each Aha has an ID, act, title, short reveal, trigger predicate, and optional mechanic/action. The engine records Ahas as seen so reveals are not repeatedly charged or duplicated. Director Mode can preview any Aha with a deterministic representative state without modifying the player's normal save unless explicitly applied.

## Ending
A28 is reachable only after late-game noise/compression goals. “停止印刷” sets `stopped=true`; production ceases and the ending copy becomes “世界已经写完了。现在，去读它。” The player can still export or reset.

## Preview and video
Add `/preview.html` as a PR review surface. It contains a real `<video controls>` element loading `/glyph-factory-v3-preview.webm`, a six-act timeline, links to the playable game and Director Mode, and a concise list of the 28 Ahas. The video is a short product trailer showing the six act transitions and the final reversal.

## Accessibility and responsive behavior
Mobile-first; keyboard-visible focus; no horizontal scrolling at 360px; semantic buttons; aria-live only for meaningful state changes; reduced-motion support. Preserve the current iframe app shell and existing accessibility enhancement injection.

## Tests
Tests execute the shipped engine source directly. Cover v2 migration, Chapter 1 publication into ACT II, each core mechanical Aha, all 28 Aha IDs, director snapshots, offline cap, finite-state validation, stop-printing production halt, and a legal-action simulation reaching A28. Build and lint must pass.

## Deployment acceptance
A GitHub PR targets `main`. Its Vercel Preview must be READY. `/`, `/play.html`, and `/preview.html` must return successfully. The preview page must reference a deployed playable WebM. Vercel runtime errors must remain empty during verification.