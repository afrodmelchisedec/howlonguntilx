// FILE: src/app/tools/baby-animal-nest-watch/page.tsx
import type { Metadata } from 'next';
import { BabyAnimalNestWatchTabs } from '@/components/pro-tools/BabyAnimalNestWatchTabs';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const PATH = '/tools/baby-animal-nest-watch';
const TITLE = 'Baby Animal Nest-Watch — Bird, Bunny, Kitten & Puppy Milestones';
const DESCRIPTION =
  'Pick a baby bird, bunny, kitten, or puppy and its arrival date to scrub through a real milestone timeline, then test yourself with the Guess the Stage quiz and share your score.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE}${PATH}` },
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${BASE}${PATH}`, type: 'website' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function BabyAnimalNestWatchPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Baby Animal Nest-Watch',
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
        <h1 className="text-title1 mb-2">Baby Animal Nest-Watch</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Bird, bunny, kitten, or puppy — watch their first weeks unfold, then test what you know.
        </p>
      </div>
      <BabyAnimalNestWatchTabs />
    </main>
  );
}
