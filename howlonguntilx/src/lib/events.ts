import { prisma } from './db';

export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({ where: { slug } });
}

export async function getPopularEvents(limit = 8) {
  return prisma.event.findMany({
    orderBy: { views: 'desc' },
    take: limit,
  });
}

export async function getAllEventSlugs() {
  const events = await prisma.event.findMany({ select: { slug: true } });
  return events.map(e => e.slug);
}

export async function incrementViews(slug: string) {
  await prisma.event.update({
    where: { slug },
    data: { views: { increment: 1 } },
  });
}

export async function getRelatedEvents(category: string, excludeSlug: string, limit = 4) {
  return prisma.event.findMany({
    where: { category, NOT: { slug: excludeSlug } },
    orderBy: { views: 'desc' },
    take: limit,
  });
}
