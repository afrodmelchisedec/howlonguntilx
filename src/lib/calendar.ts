// FILE: src/lib/calendar.ts
// Server-only — reads calendar-flagged Event rows via Prisma.
// Never import this from a 'use client' file.
import { prisma } from './db';
import type { CalendarEvent } from './calendar-shared';

type CalendarMap = Record<string, CalendarEvent[]>; // "YYYY-MM-DD" -> events

function dateToIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toCalendarEvent(ev: {
  region: string | null; name: string; description: string | null;
  targetDate: Date; slug: string; emoji: string | null; color: string | null;
  calendarFeatured: boolean;
}): CalendarEvent {
  return {
    region: ev.region ?? '',
    event: ev.name,
    description: ev.description ?? '',
    date: dateToIso(ev.targetDate),
    slug: ev.slug,
    emoji: ev.emoji ?? undefined,
    color: ev.color ?? undefined,
    featured: ev.calendarFeatured,
  };
}

export async function getCalendarMonth(year: number, month: number): Promise<CalendarMap> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(month === 12 ? year + 1 : year, month === 12 ? 0 : month, 1));
  const rows = await prisma.event.findMany({
    where: { isCalendar: true, targetDate: { gte: start, lt: end } },
    orderBy: { targetDate: 'asc' },
  });
  const map: CalendarMap = {};
  for (const row of rows) {
    const iso = dateToIso(row.targetDate);
    if (!map[iso]) map[iso] = [];
    map[iso].push(toCalendarEvent(row));
  }
  return map;
}

export async function getUpcomingEvents(limit: number = 8): Promise<CalendarEvent[]> {
  const rows = await prisma.event.findMany({
    where: { isCalendar: true, calendarFeatured: true, targetDate: { gt: new Date() } },
    orderBy: { targetDate: 'asc' },
    take: limit,
  });
  return rows.map(toCalendarEvent);
}

// Mirrors getUpcomingEvents() but returns featured events whose date has
// already passed, sorted most-recent-first (descending) - i.e. index 0 is
// the closest-to-now past event, higher indices go further back in time.
export async function getPastFeaturedEvents(limit: number = 8): Promise<CalendarEvent[]> {
  const rows = await prisma.event.findMany({
    where: { isCalendar: true, calendarFeatured: true, targetDate: { lte: new Date() } },
    orderBy: { targetDate: 'desc' },
    take: limit,
  });
  return rows.map(toCalendarEvent);
}
