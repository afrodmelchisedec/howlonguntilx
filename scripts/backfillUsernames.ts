// One-off backfill: assigns a username to every existing user that
// doesn't have one yet. Safe to re-run (skips users that already have
// one) — matches the resolved decision: auto-generate for everyone,
// no user-facing UI, zero action needed from existing users.
import { prisma } from '../src/lib/db';
import { generateUniqueUsername } from '../src/lib/username';

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null },
    select: { id: true, name: true, email: true },
  });

  console.log(`Backfilling usernames for ${users.length} user(s)...`);

  let done = 0;
  for (const u of users) {
    const username = await generateUniqueUsername(u.name, u.email);
    await prisma.user.update({ where: { id: u.id }, data: { username } });
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${users.length}`);
  }

  console.log(`Done. ${done} user(s) backfilled.`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
