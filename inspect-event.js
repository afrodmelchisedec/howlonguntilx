const fs = require('fs');
const path = require('path');

// Manually load .env since `node -e`/`node script.js` doesn't auto-load it
// the way `next dev` does.
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
  console.log('Loaded .env from', envPath);
} else {
  console.log('No .env found at', envPath, '— DATABASE_URL must already be in the environment.');
}

console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

(async () => {
  try {
    const rows = await p.event.findMany({
      where: { name: { contains: 'many days ago', mode: 'insensitive' } },
      select: { id: true, slug: true, name: true },
    });
    console.log('Rows found (name contains "many days ago"):', rows.length);
    for (const r of rows) {
      console.log('id:', r.id);
      console.log('slug:', JSON.stringify(r.slug), 'length:', r.slug.length);
      console.log('name:', JSON.stringify(r.name));
      console.log('slug charCodes:', [...r.slug].map(c => c.charCodeAt(0)).join(','));
      console.log('---');
    }

    // Also try the exact slug lookup, same as the live page does, to
    // reproduce the 404 directly against the DB.
    const bySlug = await p.event.findUnique({ where: { slug: 'how-many-days-ago-was-2020' } });
    console.log('findUnique by exact slug "how-many-days-ago-was-2020":', bySlug ? 'FOUND' : 'NOT FOUND');

    // And a broader slug search in case the real slug differs slightly.
    const bySlugContains = await p.event.findMany({
      where: { slug: { contains: '2020' } },
      select: { id: true, slug: true, name: true },
    });
    console.log('Rows with slug containing "2020":', bySlugContains.length);
    for (const r of bySlugContains) {
      console.log(' -', JSON.stringify(r.slug), '| name:', JSON.stringify(r.name));
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await p.$disconnect();
  }
})();
