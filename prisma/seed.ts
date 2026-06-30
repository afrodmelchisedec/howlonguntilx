import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_EVENTS = [
  { slug: 'christmas', name: 'Christmas', category: 'holidays', targetDate: new Date('2025-12-25') },
  { slug: 'new-year', name: 'New Year', category: 'holidays', targetDate: new Date('2026-01-01') },
  { slug: 'halloween', name: 'Halloween', category: 'holidays', targetDate: new Date('2025-10-31') },
  { slug: 'easter', name: 'Easter', category: 'holidays', targetDate: new Date('2026-04-05') },
  { slug: 'valentines-day', name: "Valentine's Day", category: 'holidays', targetDate: new Date('2026-02-14') },
  { slug: 'summer-solstice', name: 'Summer Solstice', category: 'nature', targetDate: new Date('2025-06-21') },
];

async function main() {
  for (const ev of SEED_EVENTS) {
    await prisma.event.upsert({
      where: { slug: ev.slug },
      update: {},
      create: ev,
    });
  }
  console.log('✅ Seeded events');
}

main().finally(() => prisma.$disconnect());
