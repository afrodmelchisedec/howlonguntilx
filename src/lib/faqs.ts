import { prisma } from '@/lib/db';

export interface FaqItem {
  id: string;
  question: string;
  slug: string;
  targetDate: string;
}

const LIVE_LIMIT = 50; // 5 slider pages × 10 per page

export async function getLiveFaqs(): Promise<FaqItem[]> {
  const faqs = await prisma.faq.findMany({
    where: { status: 'LIVE' },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    take: LIVE_LIMIT,
    include: { event: { select: { slug: true, targetDate: true } } },
  });

  return faqs.map(f => ({
    id: f.id,
    question: f.question,
    slug: f.event.slug,
    targetDate: f.event.targetDate.toISOString(),
  }));
}

export async function getArchivedFaqs(page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [faqs, total] = await Promise.all([
    prisma.faq.findMany({
      where: { status: 'ARCHIVE' },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      include: { event: { select: { slug: true, targetDate: true } } },
    }),
    prisma.faq.count({ where: { status: 'ARCHIVE' } }),
  ]);

  const items: FaqItem[] = faqs.map(f => ({
    id: f.id,
    question: f.question,
    slug: f.event.slug,
    targetDate: f.event.targetDate.toISOString(),
  }));

  return { faqs: items, hasMore: skip + items.length < total };
}
