// FILE: src/app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma'; // TODO: adjust path

const TOOL_SLUGS = ['tech-events', 'dark-sky-explorer']; // TODO: extend as you add tools

export async function generateSitemaps() {
  // One sitemap chunk per tool category — keeps each chunk's indexed ratio diagnosable in GSC
  return TOOL_SLUGS.map((_, id) => ({ id }));
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const toolSlug = TOOL_SLUGS[id];
  const articles = await prisma.article.findMany({
    where: { toolSlug, status: 'published' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
    take: 50000,
  });

  return [
    { url: `https://www.howlonguntilx.com/tools/${toolSlug}`, changeFrequency: 'daily', priority: 0.9 },
    ...articles.map(a => ({
      url: `https://www.howlonguntilx.com/tools/${toolSlug}/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
