// FILE: src/lib/faqs.ts

import { prisma } from '@/lib/db';

const LIVE_LIMIT = 50;

export interface FaqItem {
  id: string;
  question: string;
  slug: string;
  targetDate: string;
  type: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE';
  archived: boolean;
}

export async function getLiveFaqs(): Promise<FaqItem[]> {
  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: LIVE_LIMIT,
    select: {
      id: true,
      name: true,
      slug: true,
      targetDate: true,
      type: true,
      archived: true,
    },
  });

  return events.map(e => ({
    id: e.id,
    question: e.name,
    slug: e.slug,
    targetDate: e.targetDate.toISOString(),
    type: e.type as 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE',
    archived: e.archived,
  }));
}

export async function getArchiveFaqs(
  page: number,
  limit: number
): Promise<{ faqs: FaqItem[]; hasMore: boolean }> {
  const skip = page * limit;
  const events = await prisma.event.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    skip,
    select: {
      id: true,
      name: true,
      slug: true,
      targetDate: true,
      type: true,
      archived: true,
    },
  });

  const hasMore = events.length > limit;
  return {
    faqs: events.slice(0, limit).map(e => ({
      id: e.id,
      question: e.name,
      slug: e.slug,
      targetDate: e.targetDate.toISOString(),
      type: e.type as 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE',
      archived: e.archived,
    })),
    hasMore,
  };
}
