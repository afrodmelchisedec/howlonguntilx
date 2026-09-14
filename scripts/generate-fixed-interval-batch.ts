// FILE: scripts/generate-fixed-interval-batch.ts
// Run with: npx tsx scripts/generate-fixed-interval-batch.ts <key1,key2,...|all>
// e.g.:     npx tsx scripts/generate-fixed-interval-batch.ts olympics-2032,world-cup-2030
//           npx tsx scripts/generate-fixed-interval-batch.ts all
//
// Unlike yearlyEventTemplates.ts, fixed-interval events (Olympics/World Cup)
// have no per-year formula — each entry in FIXED_INTERVAL_EVENTS is already
// fully written. This script does NOT generate new content; it validates
// and packages the entries you've already written in
// fixedIntervalEventTemplates.ts into the same JSON-array shape the Events
// admin panel's "Import from JSON" box expects, so you have one consistent
// workflow for both event families.
//
// Guard: refuses to write the file if any selected entry has <300 words of
// body content (paragraphs+headings) — the same check the admin SEO scorer
// applies, run here BEFORE import so you catch it before pasting into
// Admin, not after.
//
// Writes generated/fixed-interval-batch-<keys>.json — review it, then paste
// the whole array into the Events admin panel's "Import from JSON" box.
// Never publishes anything on its own.
import fs from 'fs';
import path from 'path';
import { FIXED_INTERVAL_EVENTS, buildFixedIntervalEventItem } from '../src/lib/fixedIntervalEventTemplates';

const [, , keysArg] = process.argv;
if (!keysArg) {
  console.error('Usage: npx tsx scripts/generate-fixed-interval-batch.ts <key1,key2,...|all>');
  console.error(`Valid keys: ${Object.keys(FIXED_INTERVAL_EVENTS).join(', ')}`);
  process.exit(1);
}

const keys = keysArg === 'all'
  ? Object.keys(FIXED_INTERVAL_EVENTS)
  : keysArg.split(',').map((s) => s.trim()).filter(Boolean);

const unknown = keys.filter((k) => !FIXED_INTERVAL_EVENTS[k]);
if (unknown.length > 0) {
  console.error(`Unknown key(s): ${unknown.join(', ')}`);
  console.error(`Valid keys: ${Object.keys(FIXED_INTERVAL_EVENTS).join(', ')}`);
  process.exit(1);
}

const items = keys.map((k) => buildFixedIntervalEventItem(k));

// Guard: same >=300-word check as the admin SEO scorer (computeEventSeoScore
// in AdminClient.tsx), run standalone here so a regression is caught before
// you paste into Admin, not after.
const failures: string[] = [];
for (const item of items) {
  const words = (item.content.body ?? []).reduce(
    (sum: number, b: any) => sum + String(b?.text ?? '').trim().split(/\s+/).filter(Boolean).length,
    0
  );
  if (words < 300) {
    failures.push(`  ${item.slug}: only ${words} words (need >=300)`);
  }
}
if (failures.length > 0) {
  console.error('Word-count guard failed for:');
  console.error(failures.join('\n'));
  console.error('Add more real content to these entries in fixedIntervalEventTemplates.ts before generating.');
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'generated');
fs.mkdirSync(outDir, { recursive: true });
const label = keysArg === 'all' ? 'all' : keys.join('-');
const outPath = path.join(outDir, `fixed-interval-batch-${label}.json`);
fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');

console.log(`Wrote ${outPath} (${items.length} entries)`);
for (const item of items) {
  const words = (item.content.body ?? []).reduce(
    (sum: number, b: any) => sum + String(b?.text ?? '').trim().split(/\s+/).filter(Boolean).length,
    0
  );
  console.log(`  ${item.slug}: ${item.targetDate} - provisional: ${item.content.provisional} - ${words} words`);
}
