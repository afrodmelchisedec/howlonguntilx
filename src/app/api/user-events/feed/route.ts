// FILE: src/app/api/user-events/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCommunityFeed, type FeedSort } from '@/lib/communityFeed';

const VALID_SORTS: FeedSort[] = ['anticipated', 'engagement', 'recent'];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortParam = searchParams.get('sort') ?? 'recent';
  const sort: FeedSort = VALID_SORTS.includes(sortParam as FeedSort) ? (sortParam as FeedSort) : 'recent';
  const categorySlug = searchParams.get('category') ?? undefined;
  const q = searchParams.get('q') ?? undefined;
  const cursor = searchParams.get('cursor') ?? undefined;
  const takeParam = searchParams.get('take');
  const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 9, 1), 24) : undefined;

  const { items, nextCursor } = await getCommunityFeed({ sort, categorySlug, q, cursor, take });
  return NextResponse.json({ items, nextCursor });
}
