import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'MuList — Your music, ready to play', description:'곡 중심 악보 라이브러리' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ko"><body>{children}</body></html>; }
