const fs = require('fs');

function patchFile(path, ops) {
  const raw = fs.readFileSync(path, 'utf8');
  const hadCRLF = raw.includes('\r\n');
  let src = raw.replace(/\r\n/g, '\n');

  function replaceOnce(label, search, replace) {
    const count = src.split(search).length - 1;
    if (count !== 1) {
      throw new Error(`[${path}] Expected exactly 1 match for "${label}", found ${count}. Aborting -- no changes written to this file.`);
    }
    src = src.replace(search, replace);
  }

  for (const [label, search, replace] of ops) {
    replaceOnce(label, search, replace);
  }

  const out = hadCRLF ? src.replace(/\n/g, '\r\n') : src;
  fs.writeFileSync(path, out, 'utf8');
  console.log(`${path} patched (line endings: ${hadCRLF ? 'CRLF' : 'LF'}).`);
}

// --- src/lib/events.ts: dedupe getEventBySlug with React cache() ---
patchFile('src/lib/events.ts', [
  [
    'getEventBySlug -> cache()',
    `import { prisma } from './db';\nexport async function getEventBySlug(slug: string) {\n  return prisma.event.findUnique({\n    where: { slug },\n    include: { category: true, subcategory: true, reviewer: true }, // subcategory carries the mapped tool; reviewer powers the "Reviewed by" badge\n  });\n}`,
    `import { prisma } from './db';\nimport { cache } from 'react';\n\n// Wrapped in React's cache() so the multiple independent calls to this\n// function within a single request (generateMetadata calls it, the page\n// component calls it again to decide Event-vs-Article, EventPageContent\n// calls it a third time) dedupe into ONE DB round trip per request instead\n// of three or four. This is why /questions/[slug] was taking 3-4s to TTFB.\nexport const getEventBySlug = cache(async (slug: string) => {\n  return prisma.event.findUnique({\n    where: { slug },\n    include: { category: true, subcategory: true, reviewer: true }, // subcategory carries the mapped tool; reviewer powers the "Reviewed by" badge\n  });\n});`
  ]
]);

// --- src/lib/renderEventPage.tsx: stop blocking render on the view-count write ---
patchFile('src/lib/renderEventPage.tsx', [
  [
    'incrementViews no longer awaited',
    `  const event = await getEventBySlug(rawSlug);\n  if (!event) notFound();\n  await incrementViews(rawSlug);`,
    `  const event = await getEventBySlug(rawSlug);\n  if (!event) notFound();\n  // Fire-and-forget: the view counter has no reason to block the page render.\n  // Awaiting this added a full extra DB round trip to every page load.\n  incrementViews(rawSlug).catch(() => {});`
  ]
]);
