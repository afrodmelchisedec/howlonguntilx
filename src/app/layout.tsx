import LeadMagnetBanner from '@/components/LeadMagnetBanner';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';
import { ConsentBanner } from '@/components/ui/ConsentBanner';
import { ChromeGate } from '@/components/ui/ChromeGate';
import Script from 'next/script';

export const metadata: Metadata = {
  title: { template: '%s | HowLongUntilX', default: 'HowLongUntilX — Live countdown to any event' },
  description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com'),
  // TODO: verification: { google: 'PASTE_SEARCH_CONSOLE_CONTENT_VALUE_HERE' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Theme Initialization (blocking to prevent flash of wrong theme) */}
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

        {/* 1. Default Consent State Script */}
        <Script
          id="gtag-consent"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                ad_storage: 'denied',
                analytics_storage: 'granted', // <-- Set to granted so GA4 receives events
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
            `,
          }}
        />

        {/* 2. Load Google Analytics Library */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="worker"
            />
            {/* 3. Initialize GA Configuration */}
            <Script
              id="gtag-init"
              strategy="worker"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}