/** window.GlyphPixel — HTML-string helpers for the Glyph Factory pixel system (no React).
 *  components/bundle.js is a classic script that assigns this global; it exports no module binding. */
export {};

export interface Action { l: string; s?: string; m?: boolean; e?: boolean; x?: boolean; d?: boolean }
export interface Machine { n: string; t?: string; d?: boolean }
export type Scale = '桌面' | '城市' | '传播网络' | '机器语言' | '世界' | '静默' | 'DESK' | 'CITY' | 'NETWORK' | 'MACHINE' | 'WORLD' | 'SILENCE';
export type ActState = 'done' | 'current' | 'future';

/** One screen reading, as bundled in GlyphPixel.data.screens (trimmed from scripts/flows/screens.json). */
export interface ScreenReading {
  id: string; name: string; note: string; surface: 'player' | 'review'; viewport: string;
  status: string; rate: string; total: string;
  actKicker: string; actTitle: string; actCopy: string; worldScale: Scale;
  ahaId: string; ahaTitle: string; ahaCopy: string; ahaCount: string;
  saveStatus: string; endingTitle: string;
  metrics: { l: string; v: string }[]; actions: Action[]; machines: Machine[];
  /** [label, value] pairs of the world card. */
  world: [string, string][];
  /** One entry per act reached (player) or per act (review). */
  acts: ActState[];
  log: string[];
  ending: boolean; director: boolean; world_on: boolean; machines_on: boolean;
}

export interface FlowReading {
  fid: string; act: number; title: string; range: string; ahas: number; decisions: number; seconds: number;
  screens: string[]; exit: string[]; steps: { l: string; c: string; g: string }[];
}

export interface GlyphPixelApi {
  data: { screens: ScreenReading[]; flows: FlowReading[] };
  sprites: string[];
  /** HTML-escapes a value for interpolation into the returned strings. */
  esc(s: unknown): string;
  /** A 12×12 sprite as inline SVG; size 24 | 36 | 48. */
  sprite(name: string, size?: number): string;
  /** A 96×40 pixel scene for a world scale. */
  scene(scale: Scale): string;
  button(a: Action, extraClass?: string): string;
  chip(label: string, value: string): string;
  /** 'review' draws all six acts; 'player' draws only the reached ones (the shipped game shows none). */
  actTrack(states: ActState[], surface: 'player' | 'review'): string;
  logTerm(lines: string[], title?: string): string;
  machine(m: Machine): string;
  screen(s: ScreenReading, skin: 'pixel' | 'classic'): string;
  thumb(s: ScreenReading, skin: 'pixel' | 'classic', width: number): string;
  fitThumbs(root?: ParentNode): void;
  toggle(name: string, options: { value: string; label: string }[], current: string): string;
  bindToggle(root: HTMLElement, onChange: (name: string, value: string) => void): void;
}

declare global {
  interface Window { GlyphPixel: GlyphPixelApi }
  const GlyphPixel: GlyphPixelApi;
}
