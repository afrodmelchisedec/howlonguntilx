// FILE: src/app/tools/kitten-growth-tracker/page.tsx
import type { Metadata } from 'next';
import { KittenGrowthTrackerTabs } from '@/components/pro-tools/KittenGrowthTrackerTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/kitten-growth-tracker';
const TITLE = 'Kitten Growth Tracker — Milestone Countdown & Weight Chart';
const DESCRIPTION =
  'Enter your kitten\u2019s birth date to see a live countdown to each developmental milestone — eyes opening, first steps, weaning, and full growth — plus weight tracking against breed averages.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function KittenGrowthTrackerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Kitten Growth Tracker',
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
        <h1 className="text-title1 mb-2">Kitten Growth Tracker</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A live countdown through every kitten milestone, from eyes opening to fully grown — grounded in feline development averages, not a prediction about yours specifically.
        </p>
      </div>
      <KittenGrowthTrackerTabs />
    </main>
  );
}
