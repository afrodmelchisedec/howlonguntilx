import dynamic from 'next/dynamic';

// Both are pure overlays — zero content Google needs to index, and
// LeadMagnetBanner renders nothing until its own fetch resolves anyway.
// Deferring their JS so it doesn't compete with above-the-fold paint.
const LeadMagnetBanner = dynamic(() => import('@/components/LeadMagnetBanner'), { ssr: false });
import type { Metadata } from 'next';
import { Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/ui/Providers';
import { Nav } from '@/components/ui/Nav';
import { Footer } from '@/components/ui/Footer';
const ConsentBanner = dynamic(() => import('@/components/ui/ConsentBanner').then(m => m.ConsentBanner), { ssr: false });
import { ChromeGate } from '@/components/ui/ChromeGate';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import Script from 'next/script';

export const metadata: Metadata = {
  title: { template: '%s | HowLongUntilX', default: 'HowLongUntilX — Live countdown to any event' },
  description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com'),
  // TODO: verification: { google: 'PASTE_SEARCH_CONSOLE_CONTENT_VALUE_HERE' },
};

// Medium's actual current body/headline typeface is Source Serif 4 — used
// ONLY inside `.article-prose` (see globals.css). Everything else on the
// site (nav, cards, buttons, the iOS chrome) stays on the system sans stack
// untouched. next/font self-hosts + subsets this at build time, so it's
// still a single font request, cached, with no layout-shift flash.
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning className={sourceSerif.variable}>
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
        {/* No-JS fallback for the scroll-reveal system (ScrollReveal.tsx /
            .anim-fade-up in globals.css): that CSS pauses the entrance
            animation until JS adds .is-revealed on intersection. If JS
            never runs, this forces every .anim-fade-up element visible
            immediately instead of leaving real content permanently
            invisible for anyone browsing without JavaScript. */}
        <noscript>
          <style>{`.anim-fade-up { animation: none !important; opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body suppressHydrationWarning style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <ScrollReveal />
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