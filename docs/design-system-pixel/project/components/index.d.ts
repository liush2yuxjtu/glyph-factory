/** window.GlyphPixel — HTML-string helpers for the Glyph Factory pixel system (no React). */
export interface Action { l: string; s?: string; m?: boolean; e?: boolean; x?: boolean; d?: boolean }
export interface Machine { n: string; t?: string; d?: boolean }
export type Scale = '桌面' | '城市' | '传播网络' | '机器语言' | '世界' | '静默' | 'DESK' | 'CITY' | 'NETWORK' | 'MACHINE' | 'SILENCE';
export interface ScreenReading { id: string; name: string; note: string; surface: 'player' | 'review'; viewport: string; actTitle: string; actCopy: string; worldScale: Scale; metrics: { l: string; v: string }[]; actions: Action[]; machines: Machine[]; log: string[] }
export declare const GlyphPixel: {
  data: { screens: ScreenReading[]; flows: unknown[] };
  sprites: string[];
  /** A 12×12 sprite as inline SVG; size 24 | 36 | 48. */
  sprite(name: string, size?: number): string;
  /** A 96×40 pixel scene for a world scale. */
  scene(scale: Scale): string;
  button(a: Action, extraClass?: string): string;
  chip(label: string, value: string): string;
  /** states: 'done' | 'current' per reached act; player surface omits undiscovered acts. */
  actTrack(states: string[], surface: 'player' | 'review'): string;
  logTerm(lines: string[], title?: string): string;
  machine(m: Machine): string;
  screen(s: ScreenReading, skin: 'pixel' | 'classic'): string;
  thumb(s: ScreenReading, skin: 'pixel' | 'classic', width: number): string;
  fitThumbs(root?: ParentNode): void;
  toggle(name: string, options: { value: string; label: string }[], current: string): string;
  bindToggle(root: HTMLElement, onChange: (name: string, value: string) => void): void;
};
