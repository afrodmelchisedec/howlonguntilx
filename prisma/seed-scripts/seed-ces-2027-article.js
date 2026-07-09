// FILE: prisma/seed-scripts/seed-ces-2027-article.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.upsert({
    where: { toolSlug_slug: { toolSlug: 'tech-events', slug: 'ces-2027-dates' } },
    update: {}, // leave existing untouched if it already exists — re-run safe
    create: {
      toolSlug: 'tech-events',
      slug: 'ces-2027-dates',
      title: 'When is CES 2027?',
      dek: 'Everything we know so far about CES 2027 dates, location, and what to expect.',
      heroImageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600',
      heroImageAlt: 'A large tech conference exhibition hall',
      authorName: 'Editorial Team',
      status: 'published',
      contentType: 'evergreen',
      publishedAt: new Date(),
      blocks: [
        { type: 'heading', text: 'When is CES 2027?' },
        { type: 'paragraph', text: 'CES 2027 is expected to open in early January in Las Vegas.' },
        {
          type: 'tool_embed',
          widget: 'countdown',
          config: { targetDate: '2027-01-06', label: 'CES 2027', accent: '162, 137, 255' },
        },
      ],
    },
  });

  console.log('✅ Article seeded:', article.toolSlug + '/' + article.slug);
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
