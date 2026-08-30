// FILE: src/lib/articles.ts
import { prisma } from '@/lib/db';
import { redis } from '@/lib/redis';

const ARTICLE_CACHE_PREFIX = 'article:';

function fetchArticleFromDb(toolSlug: string, slug: string) {
  return prisma.article.findFirst({
    where: { toolSlug, slug, status: 'published' },
    include: { category: true, subcategory: true, reviewer: true },
  });
}

// Same Redis-first pattern as getEventBySlug in events.ts -- see the
// comment there for why. Invalidated explicitly on admin save/publish
// (see invalidateArticleCache below), no TTL.
export async function getPublishedArticle(toolSlug: string, slug: string) {
  const cacheKey = ARTICLE_CACHE_PREFIX + toolSlug + ':' + slug;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return cached as Awaited<ReturnType<typeof fetchArticleFromDb>>;

  const article = await fetchArticleFromDb(toolSlug, slug);
  if (article) {
    redis.set(cacheKey, article).catch(() => {});
  }
  return article;
}

export async function invalidateArticleCache(toolSlug: string, slug: string) {
  await redis.del(ARTICLE_CACHE_PREFIX + toolSlug + ':' + slug).catch(() => {});
}

export async function listPublishedArticles(toolSlug: string, limit = 24) {
  return prisma.article.findMany({
    where: { toolSlug, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { category: { select: { slug: true, name: true, emoji: true } } },
  });
}

export async function countPublishedForSitemap(toolSlug?: string) {
  return prisma.article.count({ where: { status: 'published', ...(toolSlug ? { toolSlug } : {}) } });
}