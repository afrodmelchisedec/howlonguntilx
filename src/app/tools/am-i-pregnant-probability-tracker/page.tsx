// FILE: src/app/tools/am-i-pregnant-probability-tracker/page.tsx
import type { Metadata } from 'next';
import { AmIPregnantTrackerTabs } from '@/components/pro-tools/AmIPregnantTrackerTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/am-i-pregnant-probability-tracker';
const TITLE = 'Am I Pregnant? Probability Tracker — Detection Odds by Day';
const DESCRIPTION =
  'Track your statistical odds of a positive pregnancy test day by day, log symptoms, and see exactly when a test becomes reliable — grounded in hCG detection research, not guesswork.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function AmIPregnantTrackerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Am I Pregnant? Probability Tracker',
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
        <h1 className="text-title1 mb-2">Am I Pregnant? Probability Tracker</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A day-by-day statistical read on detection odds — built on hCG research, not a diagnosis
          and not a substitute for an actual test.
        </p>
      </div>

      <AmIPregnantTrackerTabs />
    </main>
  );
}