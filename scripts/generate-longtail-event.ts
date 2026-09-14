// FILE: scripts/generate-longtail-event.ts
// Run with: npx tsx scripts/generate-longtail-event.ts <baseSlug> <startYear> <endYear> [nearTermYears]
// e.g.:     npx tsx scripts/generate-longtail-event.ts christmas 2032 2076 2026,2027,2028,2029,2030,2031
//
// Writes generated/<baseSlug>-longtail.json — a single-item array (bare
// slug, e.g. "christmas") covering startYear..endYear as one FAQ block.
// targetDate is resolved fresh via resolveRecurrenceDate every time this
// runs — that's also THE annual bump mechanism: once a year, re-run this
// exact command and re-paste the output into the admin Import box (it
// updates the existing row by slug, per the Import box's own label).
import fs from 'fs';
import path from 'path';
import { buildLongTailEventItem } from '../src/lib/yearlyEventTemplates';

const [, , baseSlug, startYearArg, endYearArg, nearTermYearsArg] = process.argv;
if (!baseSlug || !startYearArg || !endYearArg) {
  console.error('Usage: npx tsx scripts/generate-longtail-event.ts <baseSlug> <startYear> <endYear> [nearTermYears=comma,separated]');
  process.exit(1);
}
const startYear = Number(startYearArg);
const endYear = Number(endYearArg);
if (!Number.isInteger(startYear) || !Number.isInteger(endYear) || endYear < startYear) {
  console.error('startYear and endYear must be integers, endYear >= startYear.');
  process.exit(1);
}
const nearTermYears = nearTermYearsArg
  ? nearTermYearsArg.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n))
  : [];

const item = buildLongTailEventItem(baseSlug, startYear, endYear, nearTermYears);

const outDir = path.join(process.cwd(), 'generated');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `${baseSlug}-longtail.json`);
fs.writeFileSync(outPath, JSON.stringify([item], null, 2), 'utf8');

console.log(`Wrote ${outPath}`);
console.log(`  slug: ${item.slug}`);
console.log(`  targetDate (next occurrence): ${item.targetDate}`);
console.log(`  years covered: ${startYear}-${endYear} (${endYear - startYear + 1} years, up to that many FAQ entries)`);
console.log(`  related (near-term years): [${(item.content.relatedSlugs || []).join(', ')}]`);
