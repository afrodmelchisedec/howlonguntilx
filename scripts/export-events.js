// FILE: scripts/export-events.js
//
// One-off maintenance script — NOT part of the app build. Run manually with:
//   node scripts/export-events.js <slug1> <slug2> ...
//
// Prints the given events' content as a JSON array in the exact shape the
// admin "Import from JSON" box expects, so they can be copied out, edited
// (e.g. to add {{...}} dynamic tokens), and pasted back in for re-import —
// without clicking the per-row "JSON" download link one at a time.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('Usage: node scripts/export-events.js <slug1> <slug2> ...');
    process.exitCode = 1;
    return;
  }

  const events = await prisma.event.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, authorName: true, heroImageUrl: true, heroImageAlt: true, content: true },
  });

  const found = new Set(events.map(e => e.slug));
  for (const s of slugs) {
    if (!found.has(s)) console.error(`⚠️  No event found for slug "${s}" — skipped.`);
  }

  const payload = events.map(e => ({
    slug: e.slug,
    authorName: e.authorName,
    heroImageUrl: e.heroImageUrl,
    heroImageAlt: e.heroImageAlt,
    content: e.content,
  }));

  console.log(JSON.stringify(payload, null, 2));
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
