import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Glyph Factory / 字工厂 · Start with one glyph',
  description: 'A bilingual Chinese/English pixel incremental game about printing glyphs, automation, research, street orders, and local saves.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1c241e',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
