// FILE: migrate-categories.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const OLD_TOP_LEVEL_SLUGS = ['leisure', 'productivity', 'scam', 'tech', 'travel'];

async function main() {
  const time = await prisma.category.findUniqueOrThrow({ where: { slug: 'time' } });
  const holidaysSpecialEvents = await prisma.category.findUniqueOrThrow({ where: { slug: 'holidays-special-events' } });
  const leisure = await prisma.category.findUnique({ where: { slug: 'leisure' } });
  const holidaysCelebrations = await prisma.category.findUnique({ where: { slug: 'holidays-celebrations' } });

  // Step 1 — reassign the only real references that exist: events pointing at
  // leisure (as category) and holidays-celebrations (as subcategory) move to
  // their closest equivalents in the new taxonomy. categorySlug is updated too
  // so the sitemap chunking (Phase 5) stays accurate.
  if (leisure) {
    const movedCategory = await prisma.event.updateMany({
      where: { categoryId: leisure.id },
      data: { categoryId: time.id, categorySlug: time.slug },
    });
    console.log(`Moved ${movedCategory.count} event(s) from leisure -> time`);
  }
  if (holidaysCelebrations) {
    const movedSub = await prisma.event.updateMany({
      where: { subcategoryId: holidaysCelebrations.id },
      data: { subcategoryId: holidaysSpecialEvents.id },
    });
    console.log(`Moved ${movedSub.count} event(s) from holidays-celebrations -> holidays-special-events`);
  }

  // Step 2 — safety net: catch any remaining references to ANY old category
  // (top-level or child) that step 1 didn't cover, and null them out rather
  // than leaving a dangling FK that would block deletion.
  const oldParents = await prisma.category.findMany({ where: { slug: { in: OLD_TOP_LEVEL_SLUGS } } });
  const oldChildren = await prisma.category.findMany({ where: { parentId: { in: oldParents.map(p => p.id) } } });
  const allOldIds = [...oldParents.map(p => p.id), ...oldChildren.map(c => c.id)];

  const strandedEventsAsCategory = await prisma.event.updateMany({
    where: { categoryId: { in: allOldIds } },
    data: { categoryId: null, categorySlug: 'time' },
  });
  const strandedEventsAsSub = await prisma.event.updateMany({
    where: { subcategoryId: { in: allOldIds } },
    data: { subcategoryId: null },
  });
  const strandedArticlesAsCategory = await prisma.article.updateMany({
    where: { categoryId: { in: allOldIds } },
    data: { categoryId: null },
  });
  const strandedArticlesAsSub = await prisma.article.updateMany({
    where: { subcategoryId: { in: allOldIds } },
    data: { subcategoryId: null },
  });
  if (strandedEventsAsCategory.count || strandedEventsAsSub.count || strandedArticlesAsCategory.count || strandedArticlesAsSub.count) {
    console.log(`Safety net caught extra stranded references — events:${strandedEventsAsCategory.count}/${strandedEventsAsSub.count}, articles:${strandedArticlesAsCategory.count}/${strandedArticlesAsSub.count}`);
  }

  // Step 3 — delete children first (FK constraint), then the 5 old parents.
  const deletedChildren = await prisma.category.deleteMany({ where: { id: { in: oldChildren.map(c => c.id) } } });
  const deletedParents = await prisma.category.deleteMany({ where: { id: { in: oldParents.map(p => p.id) } } });
  console.log(`Deleted ${deletedChildren.count} old subcategories and ${deletedParents.count} old top-level categories`);

  // Step 4 — confirm final state.
  const remaining = await prisma.category.findMany({ where: { parentId: null }, orderBy: { name: 'asc' } });
  console.log(`\nFinal top-level categories (${remaining.length}):`);
  for (const c of remaining) console.log(`  ${c.emoji} ${c.name} (${c.slug})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
