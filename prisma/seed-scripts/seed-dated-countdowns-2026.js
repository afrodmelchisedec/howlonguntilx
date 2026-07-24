// FILE: prisma/seed-scripts/seed-dated-countdowns-2026.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COUNTDOWN_EVENTS = [
  { slug: 'august', name: 'August', description: 'Countdown to the start of August.', targetDate: new Date('2026-08-01T00:00:00.000Z'), categorySlug: 'leisure', type: 'COUNTDOWN' },
  { slug: 'christmas', name: 'Christmas', description: 'Countdown to Christmas Day.', targetDate: new Date('2026-12-25T00:00:00.000Z'), categorySlug: 'holidays-celebrations', type: 'COUNTDOWN' },
  { slug: 'christmas-2026', name: 'Christmas 2026', description: 'Countdown to Christmas Day 2026.', targetDate: new Date('2026-12-25T00:00:00.000Z'), categorySlug: 'holidays-celebrations', type: 'COUNTDOWN' },
  { slug: 'december', name: 'December', description: 'Countdown to the start of December.', targetDate: new Date('2026-12-01T00:00:00.000Z'), categorySlug: 'leisure', type: 'COUNTDOWN' },
  { slug: 'december-2027', name: 'December 2027', description: 'Countdown to the start of December 2027.', targetDate: new Date('2027-12-01T00:00:00.000Z'), categorySlug: 'leisure', type: 'COUNTDOWN' },
  { slug: 'easter', name: 'Easter', description: 'Countdown to the next Easter Sunday (Western/Gregorian).', targetDate: new Date('2027-03-28T00:00:00.000Z'), categorySlug: 'holidays-celebrations', type: 'COUNTDOWN' },
];

const ELAPSED_EVENTS = [
  {
    slug: 'easter-2026',
    name: 'How long has it been since Easter 2026?',
    description: 'Elapsed time since Easter Sunday, April 5, 2026.',
    targetDate: new Date('2026-04-05T00:00:00.000Z'),
    categorySlug: 'holidays-celebrations',
    type: 'ELAPSED',
    archived: true,
    content: {
      intro: "Easter 2026 fell on Sunday, April 5, 2026. Here's exactly how much time has passed since then.",
      quickFacts: [
        'Easter 2026 was the 95th day of the year.',
        'Gregorian Easter dates are set by the first Sunday after the first full moon following the spring equinox.',
        'The next Easter (2027) falls on March 28 — earlier than 2026.',
      ],
      faqAnswer: 'Easter 2026 was on April 5, 2026. The live counter above shows exactly how much time has passed since that date.',
      relatedQuestions: [
        { slug: 'easter', name: 'How long until Easter?' },
        { slug: 'christmas', name: 'How long until Christmas?' },
      ],
      disclaimer: null,
    },
  },
];

async function main() {
  for (const ev of COUNTDOWN_EVENTS) {
    await prisma.event.upsert({
      where: { slug: ev.slug },
      update: { targetDate: ev.targetDate, description: ev.description, categorySlug: ev.categorySlug, type: ev.type },
      create: ev,
    });
    console.log(`✅ upserted COUNTDOWN: ${ev.slug} -> ${ev.targetDate.toISOString()}`);
  }
  for (const ev of ELAPSED_EVENTS) {
    await prisma.event.upsert({ where: { slug: ev.slug }, update: ev, create: ev });
    console.log(`✅ upserted ELAPSED: ${ev.slug}`);
  }
  console.log('✅ All 7 dated countdown events seeded.');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
