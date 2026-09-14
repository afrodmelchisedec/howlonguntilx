// scripts/migrate-tech-tax-events.ts
// One-time backfill: creates Event rows for the 12 recurring tech events and
// 7 recurring tax deadlines, previously hardcoded in TechEventsCalendar.tsx
// and TaxBudgetDeadlines.tsx. Snapshot dates (next real occurrence from
// today), same pattern as "Christmas" — re-run/re-date manually each cycle.
// Safe to re-run: upserts by slug.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s.toLowerCase().replace(/['":]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function nextOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getFullYear();
  let candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate < from) candidate = new Date(Date.UTC(year + 1, month - 1, day));
  return candidate;
}

interface TechSeed { name: string; month: number; day: number; type: string; emoji: string; blurb: string; city: string }
interface TaxSeed { key: string; name: string; emoji: string; month: number; day: number; category: string; defaultTarget: number }

const TECH_SEEDS: TechSeed[] = [
  { name: 'CES', month: 1, day: 6, type: 'conference', emoji: '🖥️', blurb: "The world's biggest consumer tech showcase opens in Las Vegas.", city: 'Las Vegas' },
  { name: 'Samsung Galaxy Unpacked', month: 1, day: 22, type: 'launch', emoji: '📱', blurb: "Samsung's flagship Galaxy S-series unveiling.", city: 'San Francisco' },
  { name: 'MWC Barcelona', month: 2, day: 24, type: 'conference', emoji: '📡', blurb: "Mobile World Congress — the telecom industry's biggest stage.", city: 'Barcelona' },
  { name: 'GDC', month: 3, day: 18, type: 'conference', emoji: '🎮', blurb: 'Game Developers Conference — the industry gathers to talk shop.', city: 'San Francisco' },
  { name: 'Google I/O', month: 5, day: 14, type: 'keynote', emoji: '🤖', blurb: "Google's big developer keynote — Android, AI, and search news.", city: 'Mountain View' },
  { name: 'Apple WWDC', month: 6, day: 9, type: 'keynote', emoji: '🍎', blurb: "Apple's Worldwide Developers Conference opening keynote.", city: 'Cupertino' },
  { name: 'Prime Day Tech Drop', month: 7, day: 15, type: 'launch', emoji: '📦', blurb: 'A wave of hardware announcements riding along with Prime Day.', city: 'Seattle' },
  { name: 'IFA Berlin', month: 9, day: 4, type: 'conference', emoji: '🌍', blurb: "Europe's biggest consumer electronics show.", city: 'Berlin' },
  { name: 'Apple September Event', month: 9, day: 9, type: 'launch', emoji: '🚀', blurb: "Apple's annual iPhone and Watch launch event.", city: 'Cupertino' },
  { name: 'Meta Connect', month: 9, day: 24, type: 'keynote', emoji: '🕶️', blurb: "Meta's AR/VR and AI keynote.", city: 'Menlo Park' },
  { name: 'Microsoft Ignite', month: 11, day: 17, type: 'conference', emoji: '💼', blurb: "Microsoft's enterprise, cloud, and AI conference.", city: 'Chicago' },
  { name: 'AWS re:Invent', month: 12, day: 1, type: 'conference', emoji: '☁️', blurb: "AWS's massive cloud-computing conference.", city: 'Las Vegas' },
];

const TAX_SEEDS: TaxSeed[] = [
  { key: 'q1', name: 'Q1 Estimated Tax', emoji: '📄', month: 4, day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q2', name: 'Q2 Estimated Tax', emoji: '📄', month: 6, day: 16, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q3', name: 'Q3 Estimated Tax', emoji: '📄', month: 9, day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q4', name: 'Q4 Estimated Tax', emoji: '📄', month: 1, day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'annual', name: 'Annual Filing Deadline', emoji: '🗂️', month: 4, day: 15, category: 'federal', defaultTarget: 4000 },
  { key: 'extension', name: 'Extension Deadline', emoji: '⏳', month: 10, day: 15, category: 'federal', defaultTarget: 0 },
  { key: 'state', name: 'State Estimated Tax', emoji: '🏛️', month: 4, day: 15, category: 'state', defaultTarget: 1200 },
];

async function main() {
  const now = new Date();
  let created = 0, updated = 0;
  const errors: string[] = [];

  for (const t of TECH_SEEDS) {
    try {
      const date = nextOccurrence(t.month, t.day, now);
      const slug = `${slugify(t.name)}-${date.getUTCFullYear()}`;
      const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
      await prisma.event.upsert({
        where: { slug },
        update: {
          name: t.name, description: t.blurb, targetDate: date, emoji: t.emoji,
          isCalendar: true, calendarFeatured: true,
          content: { kind: 'tech', type: t.type, city: t.city },
        },
        create: {
          slug, name: t.name, description: t.blurb, targetDate: date,
          categorySlug: 'time', published: true, emoji: t.emoji,
          isCalendar: true, calendarFeatured: true,
          content: { kind: 'tech', type: t.type, city: t.city },
        },
      });
      existing ? updated++ : created++;
    } catch (e: any) {
      errors.push(`${t.name}: ${e.message}`);
    }
  }

  for (const t of TAX_SEEDS) {
    try {
      const date = nextOccurrence(t.month, t.day, now);
      const slug = `${slugify(t.name)}-${date.getUTCFullYear()}`;
      const existing = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
      await prisma.event.upsert({
        where: { slug },
        update: {
          name: t.name, targetDate: date, emoji: t.emoji,
          isCalendar: true, calendarFeatured: true,
          content: { kind: 'tax', key: t.key, category: t.category, defaultTarget: t.defaultTarget },
        },
        create: {
          slug, name: t.name, description: null, targetDate: date,
          categorySlug: 'time', published: true, emoji: t.emoji,
          isCalendar: true, calendarFeatured: true,
          content: { kind: 'tax', key: t.key, category: t.category, defaultTarget: t.defaultTarget },
        },
      });
      existing ? updated++ : created++;
    } catch (e: any) {
      errors.push(`${t.name}: ${e.message}`);
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`);
  if (errors.length) errors.forEach(e => console.log(' - ' + e));
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
