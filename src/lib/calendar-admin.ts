// FILE: src/lib/calendar-admin.ts
// Server-only — reads/writes content/calendar/source/*.json for the admin CRUD UI.
// Never import this from a 'use client' component.
import fs from 'fs';
import path from 'path';
import { CALENDAR_REGIONS } from './calendar-shared';

const SOURCE_DIR = path.join(process.cwd(), 'content', 'calendar', 'source');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface CalendarAdminEvent {
  id: string;
  file: string;
  region: string;
  isoDate: string;   // YYYY-MM-DD, derived from the entry's "Month Day" + the file's year
  rawDate: string;    // "Month Day" exactly as stored in the JSON
  event: string;
  description: string;
  featured: boolean;
  slug?: string;
  emoji?: string;
  color?: string;
}

interface RawEntry {
  date: string;
  event: string;
  description?: string;
  slug?: string;
  emoji?: string;
  color?: string;
  featured?: boolean;
}

export interface EventInput {
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

function parseIsoDate(dateStr: string, year: number): string | null {
  const match = dateStr.trim().match(/^([A-Za-z]+)\s+(\d{1,2})/);
  if (!match) return null;
  const monthIdx = MONTH_NAMES.findIndex(m => m.toLowerCase() === match[1].toLowerCase());
  if (monthIdx === -1) return null;
  const day = match[2].padStart(2, '0');
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${day}`;
}

function toRawDate(isoDate: string): { rawDate: string; year: number; month: number; day: number } {
  const [y, m, d] = isoDate.split('-').map(Number);
  return { rawDate: `${MONTH_NAMES[m - 1]} ${d}`, year: y, month: m, day: d };
}

function sourceFiles(): string[] {
  if (!fs.existsSync(SOURCE_DIR)) return [];
  return fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json') && f !== 'TEMPLATE.json');
}

function readFile(file: string): any {
  return JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, file), 'utf8'));
}

function writeFile(file: string, data: any) {
  if (!fs.existsSync(SOURCE_DIR)) fs.mkdirSync(SOURCE_DIR, { recursive: true });
  fs.writeFileSync(path.join(SOURCE_DIR, file), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function emptyMonthFile(year: number) {
  return { year, united_states: [], europe: [], united_kingdom: [], africa: [], middle_east: [] } as Record<string, any>;
}

function validateInput(input: EventInput): string | null {
  if (!input.isoDate || isNaN(new Date(input.isoDate).getTime())) return `Invalid date: "${input.isoDate}"`;
  if (!input.region || !(CALENDAR_REGIONS as readonly string[]).includes(input.region)) return `Invalid region: "${input.region}"`;
  if (!input.event || !input.event.trim()) return 'Event name is required';
  if (input.featured && !input.slug) return 'Featured events require a slug (used for the /how-long-until-<slug> countdown page link)';
  return null;
}

function buildEntry(input: EventInput, rawDate: string): RawEntry {
  const entry: RawEntry = {
    date: rawDate,
    event: input.event,
    description: input.description ?? '',
  };
  if (input.featured) entry.featured = true;
  if (input.slug) entry.slug = input.slug;
  if (input.emoji) entry.emoji = input.emoji;
  if (input.color) entry.color = input.color;
  return entry;
}

function toAdminEvent(id: string, file: string, region: string, isoDate: string, rawDate: string, entry: RawEntry): CalendarAdminEvent {
  return {
    id, file, region, isoDate, rawDate,
    event: entry.event, description: entry.description ?? '',
    featured: !!entry.featured, slug: entry.slug, emoji: entry.emoji, color: entry.color,
  };
}

export function listCalendarAdminEvents(): CalendarAdminEvent[] {
  const out: CalendarAdminEvent[] = [];
  for (const file of sourceFiles()) {
    const raw = readFile(file);
    const year: number = raw.year ?? new Date().getFullYear();
    for (const region of Object.keys(raw)) {
      if (region === 'year') continue;
      const entries = (raw[region] ?? []) as RawEntry[];
      entries.forEach((entry, index) => {
        const isoDate = parseIsoDate(entry.date, year);
        if (!isoDate) return; // unparsable date (e.g. leftover template row) — skip
        out.push(toAdminEvent(`${file}::${region}::${index}`, file, region, isoDate, entry.date, entry));
      });
    }
  }
  return out;
}

export function createCalendarEvent(input: EventInput): CalendarAdminEvent {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const { rawDate, year, month } = toRawDate(input.isoDate);
  const file = `${year}-${String(month).padStart(2, '0')}-events.json`;

  const raw = fs.existsSync(path.join(SOURCE_DIR, file)) ? readFile(file) : emptyMonthFile(year);
  if (!Array.isArray(raw[input.region])) raw[input.region] = [];

  const entry = buildEntry(input, rawDate);
  raw[input.region].push(entry);
  writeFile(file, raw);

  const index = raw[input.region].length - 1;
  return toAdminEvent(`${file}::${input.region}::${index}`, file, input.region, input.isoDate, rawDate, entry);
}

export function updateCalendarEvent(id: string, input: EventInput): CalendarAdminEvent {
  const err = validateInput(input);
  if (err) throw new Error(err);

  const [oldFile, oldRegion, oldIndexStr] = id.split('::');
  const oldIndex = Number(oldIndexStr);
  if (!oldFile || !oldRegion || isNaN(oldIndex)) throw new Error(`Malformed id: "${id}"`);
  if (!fs.existsSync(path.join(SOURCE_DIR, oldFile))) throw new Error(`Source file not found: "${oldFile}"`);

  const oldRaw = readFile(oldFile);
  if (!Array.isArray(oldRaw[oldRegion]) || !oldRaw[oldRegion][oldIndex]) {
    throw new Error(`Event not found at "${id}" — it may have been edited or deleted elsewhere. Refresh and try again.`);
  }

  const { rawDate, year, month } = toRawDate(input.isoDate);
  const newFile = `${year}-${String(month).padStart(2, '0')}-events.json`;

  // Remove from its old location first.
  oldRaw[oldRegion].splice(oldIndex, 1);
  writeFile(oldFile, oldRaw);

  // Insert into the (possibly identical) target file/region.
  const sameFile = newFile === oldFile;
  const targetRaw = sameFile
    ? oldRaw
    : fs.existsSync(path.join(SOURCE_DIR, newFile)) ? readFile(newFile) : emptyMonthFile(year);
  if (!Array.isArray(targetRaw[input.region])) targetRaw[input.region] = [];

  const entry = buildEntry(input, rawDate);
  targetRaw[input.region].push(entry);
  writeFile(newFile, targetRaw);

  const index = targetRaw[input.region].length - 1;
  return toAdminEvent(`${newFile}::${input.region}::${index}`, newFile, input.region, input.isoDate, rawDate, entry);
}

export function deleteCalendarEvent(id: string): void {
  const [file, region, indexStr] = id.split('::');
  const index = Number(indexStr);
  if (!file || !region || isNaN(index)) throw new Error(`Malformed id: "${id}"`);
  if (!fs.existsSync(path.join(SOURCE_DIR, file))) throw new Error(`Source file not found: "${file}"`);

  const raw = readFile(file);
  if (!Array.isArray(raw[region]) || !raw[region][index]) {
    throw new Error(`Event not found at "${id}" — it may have already been deleted. Refresh and try again.`);
  }
  raw[region].splice(index, 1);
  writeFile(file, raw);
}

// Bulk import: matches an existing entry by (file + region + exact date + exact
// event name) to decide update vs. create, same "upsert by natural key" spirit
// as the /api/admin/events/import route (which upserts by slug).
export function importCalendarEvents(items: EventInput[]): { created: number; updated: number; failed: ImportResult[] } {
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
      const { rawDate, year, month } = toRawDate(item.isoDate);
      const file = `${year}-${String(month).padStart(2, '0')}-events.json`;

      const raw = fs.existsSync(path.join(SOURCE_DIR, file)) ? readFile(file) : emptyMonthFile(year);
      if (!Array.isArray(raw[item.region])) raw[item.region] = [];

      const existingIndex = raw[item.region].findIndex(
        (e: RawEntry) => e.date === rawDate && e.event === item.event
      );
      const entry = buildEntry(item, rawDate);

      if (existingIndex !== -1) {
        raw[item.region][existingIndex] = entry;
        updated++;
      } else {
        raw[item.region].push(entry);
        created++;
      }
      writeFile(file, raw);
    } catch (e) {
      failed.push({ event: item.event ?? '(unknown)', status: 'error', error: e instanceof Error ? e.message : 'Unknown error' });
    }
  }

  return { created, updated, failed };
}
