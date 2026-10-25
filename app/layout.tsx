import './globals.css';
import RegisterSW from '@/components/RegisterSW';
export const metadata = {
  title: '커뮤니티 오브 니어',
  description: '성도 전용 공동체 앱',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icons/favicon-48.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: '니어', statusBarStyle: 'default' },
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><RegisterSW />{children}</body></html>;
}
