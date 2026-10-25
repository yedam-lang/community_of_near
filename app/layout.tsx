import './globals.css';
export const metadata = { title: '커뮤니티 오브 니어', description: '성도 전용 공동체 앱' };
export const viewport = { width: 'device-width', initialScale: 1 };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
