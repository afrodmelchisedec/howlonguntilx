// FILE: scripts/verify-related-slugs.ts
// Run with: npx tsx scripts/verify-related-slugs.ts <slug>
// e.g.:     npx tsx scripts/verify-related-slugs.ts christmas-2027
//
// Directly checks the exact silent-failure mode noted in the handover
// pitfalls: content.relatedSlugs entries that don't resolve to a real Event
// row get filtered out by the renderer with no error. This checks the DB
// directly, bypassing the browser/cache entirely.
import { prisma } from '../src/lib/db';

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npx tsx scripts/verify-related-slugs.ts <slug>');
    process.exit(1);
  }

  const event = await prisma.event.findUnique({ where: { slug } });
  if (!event) {
    console.error(`No Event found with slug "${slug}".`);
    process.exit(1);
  }

  const content = (event.content ?? {}) as { relatedSlugs?: string[] };
  const related = content.relatedSlugs ?? [];

  console.log(`"${slug}" -- name: "${event.name}"`);
  console.log(`relatedSlugs (${related.length}): ${JSON.stringify(related)}`);
  console.log('');

  if (related.length === 0) {
    console.log('No relatedSlugs on this row -- nothing to verify.');
    await prisma.$disconnect();
    return;
  }

  for (const relSlug of related) {
    const rel = await prisma.event.findUnique({ where: { slug: relSlug } });
    console.log(rel ? `  OK      ${relSlug}  ("${rel.name}")` : `  MISSING ${relSlug}  <-- would be silently dropped by the renderer`);
  }
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
