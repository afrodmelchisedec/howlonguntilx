import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: { template: '%s | HowLongUntilX', default: 'HowLongUntilX — Live countdown to any event' },
  description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  // Dark is the default — only add .light if the user explicitly chose it.
                  if (stored === 'light') {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <Nav />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
