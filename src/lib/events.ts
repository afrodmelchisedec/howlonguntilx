import { prisma } from './db';
import { cache } from 'react';
import { redis } from './redis';

// Wrapped in React's cache() so the multiple independent calls to this
// function within a single request (generateMetadata calls it, the page
// component calls it again to decide Event-vs-Article, EventPageContent
// calls it a third time) dedupe into ONE DB round trip per request instead
// of three or four. This is why /questions/[slug] was taking 3-4s to TTFB.
const EVENT_CACHE_PREFIX = 'event:slug:';

function fetchEventFromDb(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
    include: { category: true, subcategory: true, reviewer: true }, // subcategory carries the mapped tool; reviewer powers the "Reviewed by" badge
  });
}

// Checks Upstash Redis first (sub-50ms, edge-distributed) before falling
// through to Neon -- Neon is a genuine cross-region round trip from
// Netlify's function region, so skipping it on cache hits is the real
// latency win here, not just the React cache() dedupe above. Cache entries
// are invalidated explicitly by the admin PATCH/DELETE routes on write
// (see invalidateEventCache below), so there's no TTL.
export const getEventBySlug = cache(async (slug: string) => {
  const cacheKey = EVENT_CACHE_PREFIX + slug;
  const cached = await redis.get(cacheKey).catch((err) => { console.error('[redis] getEventBySlug GET failed:', err?.message ?? err); return null; });
  if (cached) return cached as Awaited<ReturnType<typeof fetchEventFromDb>>;

  const event = await fetchEventFromDb(slug);
  if (event) {
    // Fire-and-forget: a slow or failed cache write should never block the response.
    redis.set(cacheKey, event).catch((err) => console.error('[redis] getEventBySlug SET failed:', err?.message ?? err));
  }
  return event;
});

export async function invalidateEventCache(slug: string) {
  await redis.del(EVENT_CACHE_PREFIX + slug).catch(() => {});
}

export async function getPopularEvents(limit = 8) {
  return prisma.event.findMany({
    where: { published: true },
    orderBy: { views: 'desc' },
    take: limit,
  });
}

export async function getAllEventSlugs() {
  const events = await prisma.event.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return events.map(e => e.slug);
}

export async function incrementViews(slug: string) {
  await prisma.event.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
}

export async function getRelatedEvents(categorySlug: string, excludeSlug: string, limit = 4) {
  return prisma.event.findMany({
    where: { categorySlug, published: true, NOT: { slug: excludeSlug } },
    orderBy: { views: 'desc' },
    take: limit,
    include: { category: true }, // related events
  });
}