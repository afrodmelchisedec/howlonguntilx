// FILE: src/app/tools/garden-growth-bloom-tracker/page.tsx
import type { Metadata } from 'next';
import { GardenGrowthTrackerTabs } from '@/components/pro-tools/GardenGrowthTrackerTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/garden-growth-bloom-tracker';
const TITLE = 'Garden Growth & Bloom Tracker — Dahlias, Carrots, Onions, Grass Seed';
const DESCRIPTION =
  'Count down from planting to sprout and on to bloom or harvest — for dahlia tubers, carrots, onions, and grass seed — with a growing stem visual and a stage-by-stage timeline.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function GardenGrowthPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Garden Growth & Bloom Tracker',
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
        <h1 className="text-title1 mb-2">Garden Growth & Bloom Tracker</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          From planting to sprout to bloom or harvest — dahlias, carrots, onions, and grass seed,
          tracked stage by stage.
        </p>
      </div>

      <GardenGrowthTrackerTabs />
    </main>
  );
}
