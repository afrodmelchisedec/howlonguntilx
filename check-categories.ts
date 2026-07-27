// FILE: check-categories.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({ orderBy: [{ parentId: 'asc' }, { name: 'asc' }] });
  for (const c of cats) {
    console.log((c.parentId ? '  └ ' : '') + c.slug + ' — ' + c.name);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
