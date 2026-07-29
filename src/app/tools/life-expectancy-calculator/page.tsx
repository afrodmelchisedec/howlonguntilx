// FILE: src/app/tools/life-expectancy-calculator/page.tsx
import type { Metadata } from 'next';
import { LifeExpectancyCalculatorTabs } from '@/components/pro-tools/LifeExpectancyCalculatorTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/life-expectancy-calculator';
const TITLE = 'Life Expectancy Calculator — Estimate Your Statistical Lifespan';
const DESCRIPTION =
  'Calculate your statistical life expectancy by region, age, and sex, adjust for lifestyle factors, and see a live countdown based on population averages from official health data sources.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE}${PATH}`,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function LifeExpectancyCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Life Expectancy Calculator',
    url: `${BASE}${PATH}`,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Any',
    description: DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="text-center mb-8" style={{ maxWidth: 820, margin: '0 auto 32px' }}>
        <h1 className="text-title1 mb-2">Life Expectancy Calculator</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A statistical estimate of your remaining years, based on region, age, sex, and lifestyle —
          grounded in population data, not a prediction about any one person.
        </p>
      </div>

      <LifeExpectancyCalculatorTabs />
    </main>
  );
}