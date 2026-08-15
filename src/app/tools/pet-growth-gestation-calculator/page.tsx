// FILE: src/app/tools/pet-growth-gestation-calculator/page.tsx
import type { Metadata } from 'next';
import { PetGrowthGestationTrackerTabs } from '@/components/pro-tools/PetGrowthGestationTrackerTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/pet-growth-gestation-calculator';
const TITLE = 'Pet Fully Grown & Gestation Calculator — Cats & Dogs';
const DESCRIPTION =
  'See when your kitten or puppy will be fully grown by breed size, or count down to a litter\u2019s due date with a week-by-week development wheel — for cats and dogs.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function PetGrowthGestationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pet Fully Grown & Gestation Calculator',
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
        <h1 className="text-title1 mb-2">Pet Fully Grown & Gestation Calculator</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Track your kitten or puppy's growth to adult size, or count down to a litter's due date —
          for cats and dogs of any breed size.
        </p>
      </div>

      <PetGrowthGestationTrackerTabs />
    </main>
  );
}
