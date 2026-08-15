// FILE: src/app/tools/labor-onset-predictor/page.tsx
import type { Metadata } from 'next';
import { LaborOnsetPredictorTabs } from '@/components/pro-tools/LaborOnsetPredictorTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/labor-onset-predictor';
const TITLE = 'Labor Onset Predictor — Is It Happening?';
const DESCRIPTION =
  'Log mucus plug loss, baby dropping, or water breaking to see a statistical likelihood status for the week ahead, time contractions against the 5-1-1 rule, and share a read-only Labor Watch link with family.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function LaborOnsetPredictorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Labor Onset Predictor',
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
        <h1 className="text-title1 mb-2">Labor Onset Predictor</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A statistical status based on signs you log — grounded in population patterns, not a prediction of your exact timing.
        </p>
      </div>
      <LaborOnsetPredictorTabs />
    </main>
  );
}
