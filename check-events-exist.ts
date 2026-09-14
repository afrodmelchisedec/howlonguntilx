import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const rows = await prisma.event.findMany({
    where: {
      slug: {
        in: [
          'world-cup-2030',
          'winter-olympics-2030',
          'winter-olympics-2034',
          'olympics-2032',
          'world-cup-2034',
        ],
      },
    },
    select: { slug: true, name: true, createdAt: true, updatedAt: true },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})();
