// FILE: src/app/tools/birth-control-effectiveness-countdown/page.tsx
import type { Metadata } from 'next';
import { BirthControlEffectivenessCountdownTabs } from '@/components/pro-tools/BirthControlEffectivenessCountdownTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/birth-control-effectiveness-countdown';
const TITLE = 'Birth Control Effectiveness Countdown';
const DESCRIPTION =
  'Pick your method and start date to see a live coverage meter counting up to typical full effectiveness — or, for emergency contraception, a closing window counting down — plus refill reminders and method history.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function BirthControlEffectivenessCountdownPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Birth Control Effectiveness Countdown',
    url: `${BASE}${PATH}`,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    description: DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center mb-8" style={{ maxWidth: 820, margin: '0 auto 32px' }}>
        <h1 className="text-title1 mb-2">Birth Control Effectiveness Countdown</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          General, typical coverage windows — not a substitute for your prescription's instructions or your provider's guidance.
        </p>
      </div>
      <BirthControlEffectivenessCountdownTabs />
    </main>
  );
}
