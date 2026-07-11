const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const article = await prisma.article.findFirst({
    where: { toolSlug: 'tech-events', slug: 'ces-2027-dates' },
  });
  if (!article) {
    console.log('❌ No row found at all for tech-events/ces-2027-dates — it may have been deleted or a migration reset the table.');
  } else {
    console.log('✅ Row exists. status:', article.status, '| toolSlug:', article.toolSlug, '| slug:', article.slug);
  }
}
main().finally(() => prisma.$disconnect());
