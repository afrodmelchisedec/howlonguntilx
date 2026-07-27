import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const categories = [
    {
      slug: 'health',
      name: 'Health, Medical & Pharmaceuticals',
      emoji: '🩺',
      description: 'Medication timelines, infections, body recovery, and substance metabolism',
      children: [
        {
          slug: 'medications-metabolism',
          name: 'Medications & Metabolism',
          emoji: '💊',
          description: 'Drug onset, side effects, supplement performance, and system clearance',
        },
        {
          slug: 'infections-illnesses',
          name: 'Infections & Illnesses',
          emoji: '🦠',
          description: 'Infection durations, contagiousness windows, and disease recovery',
        },
        {
          slug: 'injuries-body-recovery',
          name: 'Injuries & Body Recovery',
          emoji: '🩹',
          description: 'Minor trauma, medical procedures, healing, piercings, and tattoos',
        },
        {
          slug: 'substance-metabolism',
          name: 'Substance Metabolism',
          emoji: '🧪',
          description: 'Substance clearance, detox timelines, and withdrawal durations',
        },
      ],
    },
    {
      slug: 'family',
      name: 'Pregnancy, Reproduction & Infant Care',
      emoji: '🍼',
      description: 'Fertility, pregnancy milestones, labor, and infant development',
      children: [
        {
          slug: 'fertility-contraception',
          name: 'Fertility & Contraception',
          emoji: '🛡️',
          description: 'Birth control effectiveness, ovulation, conception, and implantation',
        },
        {
          slug: 'pregnancy-testing',
          name: 'Pregnancy & Testing',
          emoji: '🤰',
          description: 'Pregnancy test accuracy, symptom onset, body changes, and development',
        },
        {
          slug: 'labor-postpartum',
          name: 'Labor & Postpartum',
          emoji: '👶',
          description: 'Labor indicators, delivery countdowns, birth recovery, and milk supply',
        },
        {
          slug: 'infant-care-development',
          name: 'Infant Care & Development',
          emoji: '🧸',
          description: 'Baby milestones, sleep schedules, sensory development, and newborn care',
        },
      ],
    },
    {
      slug: 'biology',
      name: 'Animals, Biology & Gardening',
      emoji: '🌱',
      description: 'Pets, wildlife hatching, plant growth, and harvesting schedules',
      children: [
        {
          slug: 'pets-domestic-animals',
          name: 'Pets & Domestic Animals',
          emoji: '🐾',
          description: 'Pet growth stages, weaning, animal pregnancy, and training milestones',
        },
        {
          slug: 'wildlife-avian-hatching',
          name: 'Wildlife & Avian Hatching',
          emoji: '🪺',
          description: 'Wild animal lifecycles, bird nest fledging, and egg incubation',
        },
        {
          slug: 'gardening-crop-cultivation',
          name: 'Gardening & Crop Cultivation',
          emoji: '🥕',
          description: 'Seed germination, flowering cycles, and fruit/vegetable harvesting',
        },
      ],
    },
    {
      slug: 'food',
      name: 'Food, Shelf Life & Perishables',
      emoji: '🍽️',
      description: 'Food expiration, storage safety, cooking times, and household product shelf life',
      children: [
        {
          slug: 'fresh-ingredients-produce',
          name: 'Fresh Ingredients & Produce',
          emoji: '🥬',
          description: 'Spoilage and freshness windows for raw foods, dairy, and produce',
        },
        {
          slug: 'prepared-foods-cooking',
          name: 'Prepared Foods & Cooking',
          emoji: '🍲',
          description: 'Storage times for cooked meals, leftovers, and fermentation processes',
        },
        {
          slug: 'household-consumables',
          name: 'Household Consumables',
          emoji: '📦',
          description: 'Expiration and degradation timelines for household supplies and non-edibles',
        },
      ],
    },
    {
      slug: 'finance',
      name: 'Finance, Taxes, Legal & Bureaucracy',
      emoji: '💰',
      description: 'Tax refunds, credit reporting, debt collections, and document expirations',
      children: [
        {
          slug: 'banking-government-refunds',
          name: 'Banking & Government Refunds',
          emoji: '📋',
          description: 'IRS processing, tax refund cycles, check validity, and deposit clearing',
        },
        {
          slug: 'credit-reporting-collections',
          name: 'Credit Reporting & Collections',
          emoji: '💳',
          description: 'Debt collection timelines, credit score updates, and late payment drop-offs',
        },
        {
          slug: 'legal-identity-expirations',
          name: 'Legal, Identity & Expirations',
          emoji: '⚖️',
          description: 'Government documents, driver licenses, tickets, and statutory legal limits',
        },
      ],
    },
    {
      slug: 'culture',
      name: 'Gaming, Media & Pop Culture',
      emoji: '🎮',
      description: 'Video game releases, streaming premieres, and social media platform timers',
      children: [
        {
          slug: 'video-games-ingame-systems',
          name: 'Video Games & In-Game Systems',
          emoji: '🕹️',
          description: 'Game launches, server resets, item despawns, and in-game mechanics',
        },
        {
          slug: 'shows-movies-streaming',
          name: 'Shows, Movies & Streaming',
          emoji: '🎬',
          description: 'TV season premieres, movie releases, anime timelines, and series endings',
        },
        {
          slug: 'social-media-online-platforms',
          name: 'Social Media & Online Platforms',
          emoji: '📱',
          description: 'Platform timers, app limits, like reset cooldowns, and account rules',
        },
      ],
    },
    {
      slug: 'science',
      name: 'Science, Environment & Astronomy',
      emoji: '🌌',
      description: 'Space phenomena, physics, environmental cycles, and planetary changes',
      children: [
        {
          slug: 'space-physics-universe',
          name: 'Space, Physics & Universe',
          emoji: '🪐',
          description: 'Astronomical events, stellar lifecycles, theoretical physics, and computing limits',
        },
        {
          slug: 'environment-geology',
          name: 'Environment & Geology',
          emoji: '🌍',
          description: 'Climate changes, geological degradation, resource depletion, and decay half-lives',
        },
      ],
    },
    {
      slug: 'time',
      name: 'Dates, Holidays, Time & Timers',
      emoji: '⏳',
      description: 'Calendar holidays, clock times, countdown timers, and temporal milestones',
      children: [
        {
          slug: 'holidays-special-events',
          name: 'Holidays & Special Events',
          emoji: '🎄',
          description: 'Countdowns for major national, religious, cultural, and seasonal holidays',
        },
        {
          slug: 'clock-times-countdown-timers',
          name: 'Clock Times & Countdown Timers',
          emoji: '🕒',
          description: 'Real-time clock checks, specific hours of the day, and live timer intervals',
        },
        {
          slug: 'calendar-periods-future-years',
          name: 'Calendar Periods & Future Years',
          emoji: '📅',
          description: 'Days of the week, named months, seasons, and long-term future year targets',
        },
      ],
    },
  ];

  for (const cat of categories) {
    const parent = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, emoji: cat.emoji, description: cat.description },
      create: {
        slug: cat.slug,
        name: cat.name,
        emoji: cat.emoji,
        description: cat.description,
      },
    });

    for (const child of cat.children) {
      await prisma.category.upsert({
        where: { slug: child.slug },
        update: {
          name: child.name,
          emoji: child.emoji,
          description: child.description,
          parentId: parent.id,
        },
        create: {
          slug: child.slug,
          name: child.name,
          emoji: child.emoji,
          description: child.description,
          parentId: parent.id,
        },
      });
    }
    console.log(`✅ ${cat.name} + ${cat.children.length} subcategories`);
  }
  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());