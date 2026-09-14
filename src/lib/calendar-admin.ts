// FILE: src/lib/calendar-admin.ts
// Server-only — reads/writes calendar-flagged Event rows via Prisma.
// Never import this from a 'use client' component.
import { prisma } from './db';
import { CALENDAR_REGIONS } from './calendar-shared';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CALENDAR_REGIONS_SET = new Set<string>(CALENDAR_REGIONS);

export interface CalendarAdminEvent {
  id: string;
  file: string; // unused post-migration; kept for shape compatibility with the admin UI
  region: string;
  isoDate: string;
  rawDate: string;
  event: string;
  description: string;
  featured: boolean;
  slug?: string;
  emoji?: string;
  color?: string;
}

interface EventInput {
  isoDate: string;
  region: string;
  event: string;
  description?: string;
  featured?: boolean;
  slug?: string;
  emoji?: string;
  color?: string;
}

export interface ImportResult {
  event: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

function isoToRawDate(isoDate: string): string {
  const [, m, d] = isoDate.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

function isoToUtcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayRange(isoDate: string): { gte: Date; lt: Date } {
  const start = isoToUtcDate(isoDate);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { gte: start, lt: end };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(base: string): Promise<string> {
  let candidate = base;
  let suffix = 2;
  while (await prisma.event.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }
  return candidate;
}

function validateInput(input: EventInput): string | null {
  if (!input.isoDate || isNaN(new Date(input.isoDate).getTime())) return `Invalid date: "${input.isoDate}"`;
  if (!input.region || !CALENDAR_REGIONS_SET.has(input.region)) return `Invalid region: "${input.region}"`;
  if (!input.event || !input.event.trim()) return 'Event name is required';
  if (input.featured && !input.slug?.trim()) return 'Featured events require a slug (used for the /questions/how-long-until-<slug> countdown page link)';
  return null;
}

function toAdminEvent(ev: {
  id: string; region: string | null; targetDate: Date; name: string;
  description: string | null; calendarFeatured: boolean; slug: string;
  emoji: string | null; color: string | null;
}): CalendarAdminEvent {
  const isoDate = dateToIso(ev.targetDate);
  return {
    id: ev.id,
    file: '',
    region: ev.region ?? '',
    isoDate,
    rawDate: isoToRawDate(isoDate),
    event: ev.name,
    description: ev.description ?? '',
    featured: ev.calendarFeatured,
    slug: ev.slug,
    emoji: ev.emoji ?? undefined,
    color: ev.color ?? undefined,
  };
}

export async function listCalendarAdminEvents(): Promise<CalendarAdminEvent[]> {
  const rows = await prisma.event.findMany({
    where: { isCalendar: true },
    orderBy: { targetDate: 'asc' },
  });
  return rows.map(toAdminEvent);
}

export async function createCalendarEvent(input: EventInput): Promise<CalendarAdminEvent> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const slug = input.slug?.trim() || await generateUniqueSlug(`${slugify(input.event)}-${input.isoDate}`);

  const created = await prisma.event.create({
    data: {
      slug,
      name: input.event,
      description: input.description || null,
      targetDate: isoToUtcDate(input.isoDate),
      categorySlug: 'time',
      published: true,
      isCalendar: true,
      calendarFeatured: !!input.featured,
      region: input.region,
      emoji: input.emoji || null,
      color: input.color || null,
    },
  });
  return toAdminEvent(created);
}

export async function updateCalendarEvent(id: string, input: EventInput): Promise<CalendarAdminEvent> {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing || !existing.isCalendar) {
    throw new Error(`Event not found at "${id}" — it may have been edited or deleted elsewhere. Refresh and try again.`);
  }

  const slug = input.slug?.trim() || existing.slug;

  try {
    const updated = await prisma.event.update({
      where: { id },
      data: {
        slug,
        name: input.event,
        description: input.description || null,
        targetDate: isoToUtcDate(input.isoDate),
        calendarFeatured: !!input.featured,
        region: input.region,
        emoji: input.emoji || null,
        color: input.color || null,
      },
    });
    return toAdminEvent(updated);
  } catch (e: any) {
    if (e?.code === 'P2002') throw new Error(`Slug "${slug}" is already used by another event — choose a different slug.`);
    throw e;
  }
}

export async function deleteCalendarEvent(id: string): Promise<void> {
  const existing = await prisma.event.findUnique({ where: { id }, select: { id: true, isCalendar: true } });
  if (!existing || !existing.isCalendar) {
    throw new Error(`Event not found at "${id}" — it may have already been deleted. Refresh and try again.`);
  }
  await prisma.event.delete({ where: { id } });
}

// Bulk import: matches by slug when given (most precise), else by
// (region + event name + same calendar day) — same natural-key spirit as
// the original JSON-based importer.
export async function importCalendarEvents(items: EventInput[]): Promise<{ created: number; updated: number; failed: ImportResult[] }> {
  let created = 0;
  let updated = 0;
  const failed: ImportResult[] = [];

  for (const item of items) {
    const err = validateInput(item);
    if (err) {
      failed.push({ event: item.event ?? '(missing event name)', status: 'error', error: err });
      continue;
    }
    try {
      let existing: { id: string } | null = null;
      if (item.slug?.trim()) {
        existing = await prisma.event.findUnique({ where: { slug: item.slug.trim() }, select: { id: true } });
      }
      if (!existing) {
        existing = await prisma.event.findFirst({
          where: {
            isCalendar: true,
            region: item.region,
            name: item.event,
            targetDate: dayRange(item.isoDate),
          },
          select: { id: true },
        });
      }

      if (existing) {
        await prisma.event.update({
          where: { id: existing.id },
          data: {
            name: item.event,
            description: item.description || null,
            targetDate: isoToUtcDate(item.isoDate),
            calendarFeatured: !!item.featured,
            region: item.region,
            emoji: item.emoji || null,
            color: item.color || null,
            ...(item.slug?.trim() ? { slug: item.slug.trim() } : {}),
          },
        });
        updated++;
      } else {
        const slug = item.slug?.trim() || await generateUniqueSlug(`${slugify(item.event)}-${item.isoDate}`);
        await prisma.event.create({
          data: {
            slug,
            name: item.event,
            description: item.description || null,
            targetDate: isoToUtcDate(item.isoDate),
            categorySlug: 'time',
            published: true,
            isCalendar: true,
            calendarFeatured: !!item.featured,
            region: item.region,
            emoji: item.emoji || null,
            color: item.color || null,
          },
        });
        created++;
      }
    } catch (e: any) {
      const msg = e?.code === 'P2002' ? `Slug "${item.slug}" is already used by another event` : (e instanceof Error ? e.message : 'Unknown error');
      failed.push({ event: item.event ?? '(unknown)', status: 'error', error: msg });
    }
  }

  return { created, updated, failed };
}