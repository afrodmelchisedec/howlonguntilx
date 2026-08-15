// FILE: src/app/tools/egg-hatch-calculator/page.tsx
import type { Metadata } from 'next';
import { EggHatchCalculatorTabs } from '@/components/pro-tools/EggHatchCalculatorTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/egg-hatch-calculator';
const TITLE = 'Egg Hatch Countdown Calculator — Chicken, Duck, Goose & Wild Bird Eggs';
const DESCRIPTION =
  'Pick a species — chicken, duck, goose, bluebird, dove, eagle, house finch, or a general wild bird — enter your start date, and get a live countdown to hatch, plus turning schedules and temperature/humidity targets for backyard incubation.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function EggHatchCalculatorPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Egg Hatch Countdown Calculator',
    url: `${BASE}${PATH}`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    description: DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return (
    <main className="px-4 sm:px-6 py-10 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="text-center mb-8" style={{ maxWidth: 820, margin: '0 auto 32px' }}>
        <h1 className="text-title1 mb-2">Egg Hatch Countdown Calculator</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A live countdown to hatch for backyard poultry and wild nesting birds alike — with turning schedules and incubator targets where they actually apply.
        </p>
      </div>
      <EggHatchCalculatorTabs />
    </main>
  );
}
