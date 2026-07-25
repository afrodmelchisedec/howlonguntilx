// FILE: prisma/seed-scripts/seed-ces-2027-article.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BLOCKS = [
  { type: 'hero_countdown', targetDate: '2027-01-06', label: 'CES 2027' },
  { type: 'heading', text: 'When is CES 2027?' },
  { type: 'paragraph', text: 'CES (Consumer Electronics Show) is the world\'s largest consumer tech showcase, held every January in Las Vegas. CES 2027 is expected to follow the same early-January pattern the show has kept for decades, typically opening the first full week after New Year\'s Day.' },
  { type: 'paragraph', text: 'CES 2027 dates are officially confirmed by the Consumer Technology Association: January 6–9, 2027 in Las Vegas — continuing the early-January pattern the show has kept in nine of the last ten years.', sourceUrl: 'https://www.ces.tech/press-releases/ces-2026-the-future-is-here', sourceLabel: 'Source: CTA press release' },
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
  { type: 'paragraph', text: "CES 2027 also marks the show's 60th anniversary, which the Consumer Technology Association is treating as a milestone edition rather than a routine year — expect added retrospective programming alongside the usual product launches. That extra draw historically pushes hotel demand near the Las Vegas Convention Center and Venetian Expo campuses higher than a typical CES, so registering and booking lodging early tends to matter more this cycle than most.", sourceUrl: 'https://www.ces.tech/press-releases/ces-2026-the-future-is-here', sourceLabel: 'Source: CTA press release' },
  { type: 'heading', text: 'CES 2026 by the numbers' },
  { type: 'paragraph', text: "To put the 2027 show's expected scale in context, the most recently completed edition — CES 2026 — drew 148,392 independently audited attendees, including 55,841 international participants from 141 countries, regions, and territories. More than 4,100 exhibitors filled 2.6 million net square feet of show floor, among them roughly 1,200 startups in the Eureka Park pavilion, and 307 of the 2025 Fortune 500 spent time on site.", sourceUrl: 'https://www.ces.tech/press-releases/ces-2026-audit-shows-four-percent-growth-in-participation-as-innovators-showed-up-in-las-vegas', sourceLabel: 'Source: CTA audited attendance report' },
  { type: 'paragraph', text: "Category-level data from that audit also hints at where 2027's floor traffic is likely to concentrate: AI-focused sessions and exhibits drew 39,929 attendees in 2026, up 22% year over year, while robotics drew 19,605, up 26%. For scale, attendance still sits below CES's pre-pandemic peak of 182,198 in 2018, but has climbed steadily since bottoming out near 45,000 in 2022 — a recovery trend the 60th-anniversary edition looks positioned to extend rather than reverse.", sourceUrl: 'https://www.ces.tech/press-releases/ces-2026-audit-shows-four-percent-growth-in-participation-as-innovators-showed-up-in-las-vegas', sourceLabel: 'Source: CTA audited attendance report' },
  { type: 'paragraph', text: 'Below is the live Tech Events Calendar — use it to see CES alongside every other major keynote and launch this year, and star any event to build your own watchlist.' },
  { type: 'tool_embed_full' },
  {
    type: 'faq',
    items: [
      { q: 'Where is CES 2027 held?', a: 'CES is held annually at the Las Vegas Convention Center and several surrounding venues in Las Vegas, Nevada.' },
      { q: 'Is CES open to the public?', a: 'No — CES is a trade-only show. Attendance requires professional/industry registration, though most major announcements are livestreamed and covered widely by tech press.' },
      { q: 'What\'s usually announced at CES?', a: 'Expect new TVs, laptops, smart home devices, EV and automotive tech, and increasingly AI-powered hardware across nearly every consumer category.' },
      { q: 'Is CES 2027 different from a typical year?', a: "Yes — CES 2027 marks the show's 60th anniversary, so expect additional retrospective programming and exhibits alongside the standard four days of product launches and keynotes." },
    ],
  },
];

async function main() {
  const article = await prisma.article.upsert({
    where: { toolSlug_slug: { toolSlug: 'tech-events', slug: 'ces-2027-dates' } },
    update: {
        title: 'When is CES 2027?',
        dek: 'Everything we know so far about CES 2027 dates, location, and what to expect — plus a live event calendar.',
        authorName: 'Afrod M (Msc Statistics at Makerere University)',
        blocks: BLOCKS,
      },
    create: {
      toolSlug: 'tech-events',
      slug: 'ces-2027-dates',
      title: 'When is CES 2027?',
      dek: 'Everything we know so far about CES 2027 dates, location, and what to expect — plus a live event calendar.',
      heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600',
      heroImageAlt: 'A large tech conference exhibition hall',
      authorName: 'Afrod M (Msc Statistics at Makerere University)',
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
