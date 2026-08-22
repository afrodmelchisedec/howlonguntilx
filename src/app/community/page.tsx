// FILE: src/app/community/page.tsx
import { getCommunityFeed, getCommunityCategories, type FeedItemRow } from '@/lib/communityFeed';
import { CommunityFeedClient } from '@/components/community/CommunityFeedClient';
import type { FeedItem } from '@/components/community/CommunityFeedCard';

export const metadata = {
  title: 'Community countdowns — HowLongUntil',
  description: `Browse "How long until…?" countdowns shared by the community.`,
};

// Server-rendered so the default (sort=recent, no filters) page of results
// is already in the initial HTML — the browser can discover and start
// requesting the first card's image immediately, instead of waiting on a
// full JS-download-hydrate-then-fetch waterfall before any content exists.
export default async function CommunityFeedPage() {
  const [{ items, nextCursor }, categories] = await Promise.all([
    getCommunityFeed({ sort: 'recent' }),
    getCommunityCategories(),
  ]);

  const initialItems: FeedItem[] = items.map((item: FeedItemRow) => ({
    ...item,
    targetDate: item.targetDate.toISOString(),
    images: Array.isArray(item.images) ? (item.images as string[]) : null,
  }));

  return (
    <CommunityFeedClient
      initialItems={initialItems}
      initialCursor={nextCursor}
      initialCategories={categories}
    />
  );
}
