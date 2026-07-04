// FILE: src/lib/calendar.ts
import fs from 'fs';
import path from 'path';

export interface CalendarEvent {
  region: string;
  event: string;
  description: string;
}

type CalendarMap = Record<string, CalendarEvent[]>; // "YYYY-MM-DD" -> events

const MONTH_NAMES: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function parseDateString(dateStr: string, year: number): string | null {
  const match = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const monthNum = MONTH_NAMES[match[1].toLowerCase()];
  if (!monthNum) return null;
  const day = match[2].padStart(2, '0');
  return `${year}-${monthNum}-${day}`;
}

const SOURCE_DIR = path.join(process.cwd(), 'content', 'calendar', 'source');

function loadAllSourceFiles(): CalendarMap {
  const map: CalendarMap = {};
  if (!fs.existsSync(SOURCE_DIR)) return map;

  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8'));
    const year: number = raw.year ?? new Date().getFullYear();
    for (const region of Object.keys(raw)) {
      if (region === 'year') continue;
      const entries = raw[region] as { date: string; event: string; description?: string }[];
      for (const entry of entries) {
        const isoDate = parseDateString(entry.date, year);
        if (!isoDate) continue;
        if (!map[isoDate]) map[isoDate] = [];
        map[isoDate].push({ region, event: entry.event, description: entry.description ?? '' });
      }
    }
  }
  return map;
}

export function getCalendarMonth(year: number, month: number): CalendarMap {
  const all = loadAllSourceFiles();
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const filtered: CalendarMap = {};
  for (const date of Object.keys(all)) {
    if (date.startsWith(prefix)) filtered[date] = all[date];
  }
  return filtered;
}

export const CALENDAR_REGIONS = ['united_states', 'europe', 'united_kingdom', 'africa', 'middle_east'] as const;

const REGION_LABELS: Record<string, string> = {
  united_states: 'United States',
  europe: 'Europe',
  united_kingdom: 'United Kingdom',
  africa: 'Africa',
  middle_east: 'Middle East',
};

const REGION_GLOW: Record<string, string> = {
  united_states: 'brand',
  europe: 'travel',
  united_kingdom: 'entertainment',
  africa: 'nature',
  middle_east: 'space',
};

export function prettifyRegion(region: string): string {
  return REGION_LABELS[region] ?? region;
}

export function getRegionGlow(region: string): string {
  return REGION_GLOW[region] ?? 'brand';
}
