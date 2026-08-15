// FILE: src/app/tools/newborn-milestone-tracker/page.tsx
import type { Metadata } from 'next';
import { NewbornMilestoneTrackerTabs } from '@/components/pro-tools/NewbornMilestoneTrackerTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/newborn-milestone-tracker';
const TITLE = 'Newborn Milestone Tracker';
const DESCRIPTION =
  'Enter your baby\u2019s birth date to see an auto-generated milestone timeline you can scrub through, log growth check-ins, add notes to any milestone, and share a read-only Milestone Watch link with family.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function NewbornMilestoneTrackerPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Newborn Milestone Tracker',
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
        <h1 className="text-title1 mb-2">Newborn Milestone Tracker</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          General timelines, not a diagnostic schedule for any individual baby.
        </p>
      </div>
      <NewbornMilestoneTrackerTabs />
    </main>
  );
}
