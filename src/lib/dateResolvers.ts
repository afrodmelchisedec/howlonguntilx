// FILE: src/lib/dateResolvers.ts
// Two related capabilities for recurring Gregorian(-ish) dates, both built on
// one shared set of pure per-year date functions (DATE_DEFS) so the Easter/
// nth-weekday math is written exactly once:
//
//  1. resolveRecurrenceDate(key, from?) — "next occurrence strictly after
//     `from`" (defaults to now). Used by the Article/hero_countdown evergreen
//     path (see extractHeroCountdown() in ArticleBlocks.tsx). Currently
//     shelved in practice — majors go through the Event pipeline instead —
//     but kept working in case that changes later.
//  2. resolveDateForYear(key, year) — the exact occurrence WITHIN a given
//     year, no roll-forward logic. Used by yearlyEventTemplates.ts /
//     scripts/generate-yearly-event.ts to compute next year's targetDate
//     when generating that year's Event row.

type YearFn = (year: number) => Date;

function utcDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month, day, hour, minute));
}

// Fixed month/day, non-moving. month is 0-indexed (0=Jan).
// NOTE: does not handle Feb 29-only entities (Date.UTC silently rolls a
// non-leap-year Feb 29 to Mar 1) — none of the seed set below needs that;
// if you add a leap-day entity later, special-case it rather than using this.
function fixedDateInYear(month: number, day: number, hour = 0, minute = 0): YearFn {
  return (year) => utcDate(year, month, day, hour, minute);
}

// Nth weekday-of-month (e.g. Thanksgiving = 4th Thursday of November).
// weekday: 0=Sunday..6=Saturday. n: 1-based occurrence within the month.
function nthWeekdayInYear(month: number, weekday: number, n: number): YearFn {
  return (year) => {
    const first = utcDate(year, month, 1);
    const firstWeekday = first.getUTCDay();
    const offset = (weekday - firstWeekday + 7) % 7;
    const day = 1 + offset + (n - 1) * 7;
    return utcDate(year, month, day);
  };
}

// Western (Gregorian) Easter via the standard Meeus/Jones/Butcher algorithm.
function easterInYear(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month - 1, day);
}

// Single source of truth: one YearFn per recurring entity key.
// Ramadan/Eid are lunar (Hijri calendar) and can't be computed with a
// Gregorian formula the way everything below can — add those separately
// as a small year->date lookup table you refresh annually, not a YearFn.
export const DATE_DEFS: Record<string, YearFn> = {
  'new-years-day': fixedDateInYear(0, 1),
  'valentines-day': fixedDateInYear(1, 14),
  easter: easterInYear,
  'mothers-day': nthWeekdayInYear(4, 0, 2), // 2nd Sunday of May (US)
  'fathers-day': nthWeekdayInYear(5, 0, 3), // 3rd Sunday of June (US)
  'independence-day': fixedDateInYear(6, 4),
  halloween: fixedDateInYear(9, 31),
  thanksgiving: nthWeekdayInYear(10, 4, 4), // 4th Thursday of November (US)
  christmas: fixedDateInYear(11, 25),
  'new-years-eve': fixedDateInYear(11, 31),
};

const MONTH_SLUGS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

// Fallback for a bare "<month>-<day>" slug (e.g. "september-14") that isn't
// hand-registered in DATE_DEFS above -- lets the SEO pipeline mint an
// evergreen fixed-date event for ANY day of the year without anyone editing
// this file per keyword. Does not cover moveable feasts or Feb 29 (see the
// fixedDateInYear note) -- those still need a real DATE_DEFS entry.
function parseGenericFixedDateSlug(key: string): YearFn | null {
  const match = key.match(/^([a-z]+)-(\d{1,2})$/i);
  if (!match) return null;
  const month = MONTH_SLUGS[match[1].toLowerCase()];
  const day = parseInt(match[2], 10);
  if (month === undefined || day < 1 || day > 31) return null;
  return fixedDateInYear(month, day);
}

function resolveYearFn(key: string): YearFn | null {
  return DATE_DEFS[key] ?? parseGenericFixedDateSlug(key);
}

export function resolveRecurrenceDate(key: string, from: Date = new Date()): string | null {
  const fn = resolveYearFn(key);
  if (!fn) return null;
  const year = from.getUTCFullYear();
  let target = fn(year);
  if (target.getTime() <= from.getTime()) target = fn(year + 1);
  return target.toISOString();
}

export function resolveDateForYear(key: string, year: number): string | null {
  const fn = resolveYearFn(key);
  return fn ? fn(year).toISOString() : null;
}
