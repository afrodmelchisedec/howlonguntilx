import LeadMagnetBanner from '@/components/LeadMagnetBanner';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';
import { ConsentBanner } from '@/components/ui/ConsentBanner';
import { ChromeGate } from '@/components/ui/ChromeGate';

export const metadata: Metadata = {
  title: { template: '%s | HowLongUntilX', default: 'HowLongUntilX — Live countdown to any event' },
  description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com'),
  // TODO: verification: { google: 'PASTE_SEARCH_CONSOLE_CONTENT_VALUE_HERE' },
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
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
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
          <ChromeGate><Nav /></ChromeGate>
          <main style={{ flex: 1 }}>{children}</main>
          <ChromeGate><Footer /></ChromeGate>
        </Providers>
        <ChromeGate><ConsentBanner /></ChromeGate>
        <ChromeGate><LeadMagnetBanner /></ChromeGate>
      </body>
    </html>
  );
}