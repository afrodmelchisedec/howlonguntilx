const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const models = ['category', 'event', 'article', 'featuredPiece', 'user', 'faq'];
  for (const m of models) {
    try {
      const count = await prisma[m].count();
      console.log(`${count === 0 ? '⚠️ ' : '✅'} ${m}: ${count} rows`);
    } catch (e) {
      console.log(`❌ ${m}: model not found or error — ${e.message.split('\n')[0]}`);
    }
  }
}
main().finally(() => prisma.$disconnect());
