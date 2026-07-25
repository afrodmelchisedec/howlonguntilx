const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const parent = await prisma.category.upsert({
    where: { slug: 'productivity' },
    update: {},
    create: {
      slug: 'productivity',
      name: 'Productivity',
      emoji: '🗂️',
      description: 'Meetings, deadlines and focus tools',
    },
  });
  console.log('Parent:', parent);

  const subs = [
    { slug: 'meeting-overlap',  name: 'Meeting Overlap',  emoji: '🕒', description: 'Timezone overlap and scheduling windows' },
    { slug: 'deadline-buffer',  name: 'Deadline Buffers',  emoji: '⏳', description: 'Buffer time and deadline planning' },
    { slug: 'focus-blocks',     name: 'Focus Blocks',      emoji: '🎯', description: 'Deep work and focus block scheduling' },
  ];

  for (const s of subs) {
    const row = await prisma.category.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, parentId: parent.id },
    });
    console.log('Sub:', row);
  }

  await prisma.$disconnect();
})();
