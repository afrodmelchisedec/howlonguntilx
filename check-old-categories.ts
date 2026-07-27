// FILE: check-old-categories.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const OLD_SLUGS = ['leisure', 'productivity', 'scam', 'tech', 'travel'];

async function main() {
  const olds = await prisma.category.findMany({
    where: { OR: [{ slug: { in: OLD_SLUGS } }, { parent: { slug: { in: OLD_SLUGS } } }] },
    include: { parent: true },
  });

  for (const c of olds) {
    const [events, eventsAsSub, articles, articlesAsSub] = await Promise.all([
      prisma.event.count({ where: { categoryId: c.id } }),
      prisma.event.count({ where: { subcategoryId: c.id } }),
      prisma.article.count({ where: { categoryId: c.id } }),
      prisma.article.count({ where: { subcategoryId: c.id } }),
    ]);
    const label = c.parent ? `  └ ${c.slug}` : c.slug;
    console.log(`${label} — events:${events} eventsAsSub:${eventsAsSub} articles:${articles} articlesAsSub:${articlesAsSub}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
