import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';
import { ConsentBanner } from '@/components/ui/ConsentBanner';

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
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  analytics_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 500
                });
              `,
            }}
          />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  // Dark is the default — only add .light if the user explicitly chose it.
                  if (stored === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    // Keep Tailwind's dark: classes (darkMode:'class') in sync with
                    // the default/dark state too, avoiding a flash on hydration.
                    document.documentElement.classList.add('dark');
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
          <ConsentBanner />
      </body>
    </html>
  );
}
