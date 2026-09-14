// FILE: scripts/generate-yearly-event.ts
// Run with: npx tsx scripts/generate-yearly-event.ts <baseSlug> <year>
// e.g.:     npx tsx scripts/generate-yearly-event.ts christmas 2027
//
// Writes generated/<baseSlug>-<year>.json — review it, then paste the array
// into the Events admin panel's "Import from JSON" box (or POST it yourself
// to /api/admin/events/import). This script never publishes anything on its
// own; it only produces the JSON for you to review first.
import fs from 'fs';
import path from 'path';
import { buildYearlyEventItem } from '../src/lib/yearlyEventTemplates';

const [, , baseSlug, yearArg] = process.argv;
if (!baseSlug || !yearArg) {
  console.error('Usage: npx tsx scripts/generate-yearly-event.ts <baseSlug> <year>');
  process.exit(1);
}
const year = Number(yearArg);
if (!Number.isInteger(year)) {
  console.error(`"${yearArg}" is not a valid year.`);
  process.exit(1);
}

const item = buildYearlyEventItem(baseSlug, year);

const outDir = path.join(process.cwd(), 'generated');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${baseSlug}-${year}.json`);
fs.writeFileSync(outPath, JSON.stringify([item], null, 2), 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`Target date: ${item.targetDate}`);
console.log(`heroFact: ${item.content.heroFact}`);
