// FILE: src/lib/articles.ts
import { prisma } from '@/lib/prisma'; // TODO: adjust to your actual Prisma singleton path

export async function getPublishedArticle(toolSlug: string, slug: string) {
  return prisma.article.findFirst({ where: { toolSlug, slug, status: 'published' } });
}

export async function listPublishedArticles(toolSlug: string, limit = 24) {
  return prisma.article.findMany({
    where: { toolSlug, status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: limit,
  });
}

export async function countPublishedForSitemap(toolSlug?: string) {
  return prisma.article.count({ where: { status: 'published', ...(toolSlug ? { toolSlug } : {}) } });
}
