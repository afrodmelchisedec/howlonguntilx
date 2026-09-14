import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.event.findMany({
    where: {
      slug: {
        in: [
          'olympics-2032',
          'world-cup-2030',
          'winter-olympics-2030',
          'winter-olympics-2034',
          'world-cup-2034',
        ],
      },
    },
    select: { slug: true, content: true },
  });
  for (const r of rows) {
    const c = r.content as any;
    console.log(r.slug, '-> relatedSlugs:', c?.relatedSlugs ?? '(none/undefined)');
  }
  await prisma.$disconnect();
})();
