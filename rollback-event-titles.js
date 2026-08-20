const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const events = await prisma.event.findMany({ select: { id: true, name: true, slug: true } });
  for (const ev of events) {
    const bare = ev.name.replace(/^how long until\s+/i, '').replace(/\?+$/, '').trim();
    if (bare === ev.name) { console.log(`SKIP  ${ev.slug}: unchanged`); continue; }
    await prisma.event.update({ where: { id: ev.id }, data: { name: bare } });
    console.log(`RESTORED ${ev.slug}: "${ev.name}" -> "${bare}"`);
  }
  await prisma.$disconnect();
})();
