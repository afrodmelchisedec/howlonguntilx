// FILE: scripts/generate-yearly-event-batch.ts
// Run with: npx tsx scripts/generate-yearly-event-batch.ts <baseSlug> <startYear> [count] [extraYears]
// e.g.:     npx tsx scripts/generate-yearly-event-batch.ts christmas 2027 5 2026
//   extraYears: comma-separated already-published years to cross-link to
//   (e.g. "2026") — these are NOT regenerated, only referenced in
//   content.relatedSlugs so the new batch links back to what's already live.
//
// Writes generated/<baseSlug>-batch-<startYear>-<endYear>.json — a single
// JSON array covering `count` consecutive years (default 5), each with
// distinct chart/fact/weekday content and content.relatedSlugs pointing at
// every other year in play (siblings in this batch + extraYears). Review
// it, then paste the whole array into the Events admin panel's "Import
// from JSON" box in one go. Never publishes anything on its own.
import fs from 'fs';
import path from 'path';
import { buildYearlyEventBatch } from '../src/lib/yearlyEventTemplates';

const [, , baseSlug, startYearArg, countArg, extraYearsArg, longTailSlugArg] = process.argv;
if (!baseSlug || !startYearArg) {
  console.error('Usage: npx tsx scripts/generate-yearly-event-batch.ts <baseSlug> <startYear> [count=5] [extraYears=comma,separated] [longTailSlug]');
  process.exit(1);
}
const startYear = Number(startYearArg);
const count = countArg ? Number(countArg) : 5;
if (!Number.isInteger(startYear) || !Number.isInteger(count) || count < 1) {
  console.error('startYear and count must be valid integers, count >= 1.');
  process.exit(1);
}
const extraYears = extraYearsArg
  ? extraYearsArg.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n))
  : [];

const items = buildYearlyEventBatch(baseSlug, startYear, count, extraYears, longTailSlugArg || undefined);

const outDir = path.join(process.cwd(), 'generated');
fs.mkdirSync(outDir, { recursive: true });
const endYear = startYear + count - 1;
const outPath = path.join(outDir, `${baseSlug}-batch-${startYear}-${endYear}.json`);
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');

console.log(`Wrote ${outPath} (${items.length} years: ${startYear}-${endYear})`);
if (extraYears.length > 0) {
  console.log(`  cross-linked to already-live years: ${extraYears.join(', ')}`);
}
for (const item of items) {
  console.log(`  ${item.slug}: ${item.targetDate} - related: [${(item.content.relatedSlugs || []).join(', ')}]`);
}
