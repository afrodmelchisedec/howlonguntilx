const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const a = await prisma.article.findFirst({
    where: { slug: 'how-long-until-checks-expire' },
    select: { slug: true, blocks: true, subcategoryId: true, subcategory: { select: { name: true, tools: true } } },
  });
  console.log(JSON.stringify(a, null, 2));
  await prisma.$disconnect();
})();
