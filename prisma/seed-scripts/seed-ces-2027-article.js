// FILE: prisma/seed-scripts/seed-ces-2027-article.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BLOCKS = [
  { type: 'hero_countdown', targetDate: '2027-01-06', label: 'CES 2027' },
  { type: 'heading', text: 'When is CES 2027?' },
  { type: 'paragraph', text: 'CES (Consumer Electronics Show) is the world\'s largest consumer tech showcase, held every January in Las Vegas. CES 2027 is expected to follow the same early-January pattern the show has kept for decades, typically opening the first full week after New Year\'s Day.' },
  { type: 'paragraph', text: 'While the exact 2027 dates haven\'t been officially confirmed by the Consumer Technology Association yet, the show has opened between January 6th and 9th in nine of the last ten years — so early January remains the safest bet for travel and hotel planning.' },
  {
    type: 'chart',
    title: 'CES opening date, last 5 years (day of January)',
    data: [
      { label: '2023', value: 5 },
      { label: '2024', value: 9 },
      { label: '2025', value: 7 },
      { label: '2026', value: 6 },
      { label: '2027*', value: 6 },
    ],
  },
  { type: 'paragraph', text: 'Below is the live Tech Events Calendar — use it to see CES alongside every other major keynote and launch this year, and star any event to build your own watchlist.' },
  { type: 'tool_embed_full' },
  {
    type: 'faq',
    items: [
      { q: 'Where is CES 2027 held?', a: 'CES is held annually at the Las Vegas Convention Center and several surrounding venues in Las Vegas, Nevada.' },
      { q: 'Is CES open to the public?', a: 'No — CES is a trade-only show. Attendance requires professional/industry registration, though most major announcements are livestreamed and covered widely by tech press.' },
      { q: 'What\'s usually announced at CES?', a: 'Expect new TVs, laptops, smart home devices, EV and automotive tech, and increasingly AI-powered hardware across nearly every consumer category.' },
    ],
  },
];

async function main() {
  const article = await prisma.article.upsert({
    where: { toolSlug_slug: { toolSlug: 'tech-events', slug: 'ces-2027-dates' } },
    update: { blocks: BLOCKS },
    create: {
      toolSlug: 'tech-events',
      slug: 'ces-2027-dates',
      title: 'When is CES 2027?',
      dek: 'Everything we know so far about CES 2027 dates, location, and what to expect — plus a live event calendar.',
      heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600',
      heroImageAlt: 'A large tech conference exhibition hall',
      authorName: 'Editorial Team',
      status: 'published',
      contentType: 'evergreen',
      publishedAt: new Date(),
      blocks: BLOCKS,
    },
  });
  console.log('✅ Article seeded/updated:', article.toolSlug + '/' + article.slug);
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
