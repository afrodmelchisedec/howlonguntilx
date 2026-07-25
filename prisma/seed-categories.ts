import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      slug: 'leisure', name: 'Leisure', emoji: '⚽',
      description: 'Sports, entertainment, holidays and shopping events',
      children: [
        { slug: 'sports-games', name: 'Sports & Games', emoji: '⚽', description: 'World Cup, Olympics, Super Bowl and major sporting events' },
        { slug: 'entertainment', name: 'Entertainment', emoji: '🎬', description: 'Oscars, Grammys, award shows and releases' },
        { slug: 'holidays-celebrations', name: 'Holidays & Celebrations', emoji: '🎄', description: 'Christmas, Easter, Halloween and every holiday worldwide' },
        { slug: 'shopping-deals', name: 'Shopping & Deals', emoji: '🛍️', description: 'Black Friday, Prime Day, Cyber Monday' },
      ],
    },
    {
      slug: 'tech', name: 'Tech', emoji: '💻',
      description: 'Technology events and product launches',
      children: [
        { slug: 'tech-events', name: 'Tech Events', emoji: '💻', description: 'Apple events, Google I/O, CES and major launches' },
      ],
    },
    {
      slug: 'food', name: 'Food', emoji: '🍽️',
      description: 'Food festivals, restaurant launches and harvest seasons',
      children: [
        { slug: 'food-festivals', name: 'Food Festivals', emoji: '🍽️', description: 'Food and drink festivals worldwide' },
        { slug: 'restaurant-launches', name: 'Restaurant Launches', emoji: '🍴', description: 'New restaurant and menu launches' },
        { slug: 'harvest-seasons', name: 'Harvest Seasons', emoji: '🌾', description: 'Seasonal harvest and agricultural events' },
      ],
    },
    {
      slug: 'travel', name: 'Travel', emoji: '✈️',
      description: 'Travel, nature, space and sky events',
      children: [
        { slug: 'nature-space-sky', name: 'Nature, Space & Sky', emoji: '🌍', description: 'Eclipses, meteor showers, solstices and natural events' },
      ],
    },
    {
      slug: 'scam', name: 'Scam', emoji: '🔐',
      description: 'Scam alerts, cyber threats and fraud warnings',
      children: [
        { slug: 'cyber-scams', name: 'Cyber Scams', emoji: '🔐', description: 'Online scams and cybersecurity threats' },
        { slug: 'financial-fraud', name: 'Financial Fraud', emoji: '💸', description: 'Financial scams and fraud alerts' },
        { slug: 'phishing-identity', name: 'Phishing & Identity Theft', emoji: '🪪', description: 'Phishing attacks and identity theft warnings' },
      ],
    },
    {
      slug: 'finance', name: 'Finance', emoji: '💰',
      description: 'Money milestones, tax deadlines and salary events',
      children: [
        { slug: 'money-milestones', name: 'Money & Milestones', emoji: '💰', description: 'Salary day, budget announcements and financial milestones' },
        { slug: 'tax-budget', name: 'Tax & Budget Deadlines', emoji: '📋', description: 'Tax filing deadlines and government budget announcements' },
        { slug: 'salary-payroll', name: 'Salary & Payroll Events', emoji: '💵', description: 'Payday countdowns and payroll events' },
      ],
    },
    {
      slug: 'productivity', name: 'Productivity', emoji: '🗂️',
      description: 'Meetings, deadlines and focus tools',
      children: [
        { slug: 'meeting-overlap', name: 'Meeting Overlap', emoji: '🕒', description: 'Timezone overlap and scheduling windows' },
        { slug: 'deadline-buffer', name: 'Deadline Buffers', emoji: '⏳', description: 'Buffer time and deadline planning' },
        { slug: 'focus-blocks', name: 'Focus Blocks', emoji: '🎯', description: 'Deep work and focus block scheduling' },
      ],
    },
    {
      slug: 'health', name: 'Health', emoji: '🩺',
      description: 'Health timelines, medical guidance and body recovery windows',
      children: [
        { slug: 'medical-timelines', name: 'Medical Timelines', emoji: '🩺', description: 'Recovery, treatment, and symptom duration timelines' },
        { slug: 'testing-detection', name: 'Testing & Detection', emoji: '🧪', description: 'Test accuracy windows and detection timeframes' },
      ],
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, emoji: cat.emoji, description: cat.description },
      create: {
        slug: cat.slug, name: cat.name,
        emoji: cat.emoji, description: cat.description,
      },
    });
    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: { name: child.name, emoji: child.emoji, description: child.description, parentId: parent.id },
        create: {
          slug: child.slug, name: child.name,
          emoji: child.emoji, description: child.description,
          parentId: parent.id,
        },
      });
    }
    console.log(`✅ ${cat.name} + ${cat.children.length} subcategories`);
  }
  console.log('Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
