// scripts/migrate-calendar-to-db.ts
// One-time backfill: reads content/calendar/source/*.json and creates/updates
// Event rows with isCalendar=true. Safe to re-run (idempotent upsert by slug).
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SOURCE_DIR = path.join(process.cwd(), 'content', 'calendar', 'source');

const MONTH_NAMES: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function parseIsoDate(dateStr: string, year: number): string | null {
  const match = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const monthNum = MONTH_NAMES[match[1].toLowerCase()];
  if (!monthNum) return null;
  const day = match[2].padStart(2, '0');
  return `${year}-${monthNum}-${day}`;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface RawEntry {
  date: string; event: string; description?: string;
  slug?: string; emoji?: string; color?: string; featured?: boolean;
}
interface FlatEntry extends RawEntry { region: string; isoDate: string; }

function loadAllEntries(): FlatEntry[] {
  const out: FlatEntry[] = [];
  if (!fs.existsSync(SOURCE_DIR)) return out;
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8'));
    const year: number = raw.year ?? new Date().getFullYear();
    for (const region of Object.keys(raw)) {
      if (region === 'year') continue;
      const entries = (raw[region] ?? []) as RawEntry[];
      for (const entry of entries) {
        const isoDate = parseIsoDate(entry.date, year);
        if (!isoDate) continue;
        out.push({ ...entry, region, isoDate });
      }
    }
  }
  return out;
}

async function main() {
  const entries = loadAllEntries();
  console.log(`Loaded ${entries.length} calendar entries from ${SOURCE_DIR}`);

  const existingSlugs = new Set((await prisma.event.findMany({ select: { slug: true } })).map(e => e.slug));
  const usedThisRun = new Set<string>();

  let created = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  for (const entry of entries) {
    try {
      let slug = entry.slug;
      if (!slug) {
        const base = `${slugify(entry.event)}-${entry.isoDate}`;
        let candidate = base;
        let suffix = 2;
        while (usedThisRun.has(candidate) && !existingSlugs.has(candidate)) {
          candidate = `${base}-${slugify(entry.region)}${suffix > 2 ? '-' + suffix : ''}`;
          suffix++;
        }
        slug = candidate;
      }
      usedThisRun.add(slug);

      const targetDate = new Date(`${entry.isoDate}T00:00:00.000Z`);
      if (isNaN(targetDate.getTime())) {
        errors.push(`Bad date for "${entry.event}" (${entry.isoDate}) — skipped`);
        skipped++;
        continue;
      }

      const wasExisting = existingSlugs.has(slug);

      await prisma.event.upsert({
        where: { slug },
        update: {
          isCalendar: true,
          calendarFeatured: !!entry.featured,
          region: entry.region,
          emoji: entry.emoji ?? null,
          color: entry.color ?? null,
        },
        create: {
          slug,
          name: entry.event,
          description: entry.description || null,
          targetDate,
          categorySlug: 'time',
          published: true,
          isCalendar: true,
          calendarFeatured: !!entry.featured,
          region: entry.region,
          emoji: entry.emoji ?? null,
          color: entry.color ?? null,
        },
      });

      existingSlugs.add(slug);
      if (wasExisting) updated++; else created++;
    } catch (e: any) {
      errors.push(`"${entry.event}" (${entry.isoDate}, ${entry.region}): ${e.message}`);
      skipped++;
    }
  }

  console.log(`\nDone. Created: ${created}, Updated: ${updated}, Skipped/errors: ${skipped}`);
  if (errors.length) { console.log('\nErrors:'); errors.forEach(e => console.log(' - ' + e)); }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
