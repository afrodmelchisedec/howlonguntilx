// FILE: src/lib/dynamicTokens.ts
// Resolves {{...}} placeholder tokens embedded in authored content (body
// paragraphs, headings, heroFact, quickFacts, timeline, faqs) into live,
// always-current values computed from today's date. This lets a page like
// "how many days ago was 2020" or "how many days until Christmas 2026" stay
// numerically correct indefinitely instead of freezing whatever number
// happened to be true on publish day.
//
// Supported tokens (YYYY-MM-DD is always the fixed reference date, e.g. the
// event's target date or any other date mentioned in the prose):
//   {{daysSince:YYYY-MM-DD}}    -> "2,446"                 (comma-formatted day count, dateArg -> now)
//   {{weeksSince:YYYY-MM-DD}}   -> "349"                   (floor(days/7), matches QuickFacts' own math)
//   {{monthsSince:YYYY-MM-DD}}  -> "94"                    (floor(days/30), matches QuickFacts' own math)
//   {{humanSince:YYYY-MM-DD}}   -> "6 years, 8 months, 11 days"
//   {{daysUntil:YYYY-MM-DD}}    -> "131"                   (now -> dateArg; clamped to 0 once past)
//   {{weeksUntil:YYYY-MM-DD}}   -> "18"
//   {{monthsUntil:YYYY-MM-DD}}  -> "4"
//   {{humanUntil:YYYY-MM-DD}}   -> "4 months, 12 days"
//   {{today}}                   -> "September 12, 2026"
//   {{todayWeekday}}            -> "Monday"
//
// Second family, anchored to TODAY instead of a fixed date, taking a plain
// integer N instead of a YYYY-MM-DD arg. For content like "what was 90 days
// ago" or "what day is 45 days from now", where the OFFSET (90, 45) is fixed
// forever but the resulting calendar date shifts every single day:
//   {{dateNDaysAgo:N}}          -> "June 16, 2026"         (today minus N days)
//   {{weekdayNDaysAgo:N}}       -> "Tuesday"                (weekday of that date)
//   {{dateNDaysFromNow:N}}      -> "October 29, 2026"       (today plus N days)
//   {{weekdayNDaysFromNow:N}}   -> "Thursday"
//   {{dateNWeeksAgo:N}}         -> "June 16, 2026"           (today minus N*7 days)
//   {{dateNWeeksFromNow:N}}     -> "October 29, 2026"
//   {{dateNMonthsAgo:N}}        -> "June 14, 2026"           (calendar-month subtract, day-clamped)
//   {{dateNMonthsFromNow:N}}    -> "December 14, 2026"
//
// Note on "Until" tokens: once the reference date has passed, these clamp to
// 0 / "0 days" rather than going negative. That keeps the number from
// looking broken, but it does NOT rewrite the surrounding prose — an article
// written as "X days until <date>" will still read oddly once <date> is in
// the past (it'll just say "0 days until <date>" forever after). That's a
// content-lifecycle problem, not something a text-substitution token can
// fully solve; genuinely evergreen framing needs the prose itself to avoid
// assuming a fixed direction (or the article should be a "days ago" style
// piece instead, using the Since tokens).
//
// Usage: call resolveDynamicTokensDeep() on the parsed EventContent JSON
// (or resolveDynamicTokens() on a single string) at render time, per
// request, so the numbers are computed fresh on every page load rather
// than baked in once at import/publish time.

const TOKEN_RE = /\{\{\s*(daysSince|weeksSince|monthsSince|humanSince|daysUntil|weeksUntil|monthsUntil|humanUntil|today)(?::(\d{4}-\d{2}-\d{2}))?\s*\}\}/g;

function parseIsoUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

// Strips time-of-day, keeping only the UTC calendar date at midnight. Diffing
// two midnight-aligned dates always yields a whole number of days — diffing
// raw timestamps (including time-of-day) would make the day count silently
// shift by ±1 depending on what time of day the page happens to render.
function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

// Signed day count: positive when `to` is chronologically after `from`.
function daysBetweenUtc(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((toUtcMidnight(to).getTime() - toUtcMidnight(from).getTime()) / MS_PER_DAY);
}

// Calendar-accurate "N years, M months, D days" breakdown — mirrors how a
// human counts a duration (like an age calculator), not a naive days/365
// division, which drifts because of leap years and variable month lengths.
// Assumes `toRaw` is chronologically on/after `fromRaw`; callers needing the
// reverse direction should swap arguments, not negate the result.
function humanDuration(fromRaw: Date, toRaw: Date): string {
  const from = toUtcMidnight(fromRaw);
  const to = toUtcMidnight(toRaw);
  if (to.getTime() < from.getTime()) return '0 days'; // reference date hasn't arrived / already clamped elsewhere

  let years = to.getUTCFullYear() - from.getUTCFullYear();
  let months = to.getUTCMonth() - from.getUTCMonth();
  let days = to.getUTCDate() - from.getUTCDate();

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 0));
    days += prevMonthLastDay.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
  if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
  return parts.join(', ');
}

function formatToday(date: Date): string {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWeekday(date: Date): string {
  return WEEKDAY_NAMES[toUtcMidnight(date).getUTCDay()];
}

function addDaysUtc(date: Date, days: number): Date {
  const d = toUtcMidnight(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// Calendar-aware month add/subtract (not a flat *30 days). Clamps to the last
// valid day of the target month — e.g. Aug 31 minus 1 month -> Jul 31, not an
// overflow into August or a silent Jul 1. "N months ago" is a calendar-month
// question, not a fixed-duration one, so this has to track real month lengths.
function addMonthsUtc(date: Date, months: number): Date {
  const d = toUtcMidnight(date);
  const targetDay = d.getUTCDate();
  d.setUTCDate(1); // avoid rollover surprises before changing the month
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInTargetMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(targetDay, daysInTargetMonth));
  return d;
}

// Second token family — see the module doc comment above. Anchored to `now`
// (today) rather than a fixed authored date, and takes a plain non-negative
// integer instead of a YYYY-MM-DD arg. Only day-based offsets get a weekday
// variant: "which weekday was it 90 DAYS ago" is a real, commonly-asked
// question; "which weekday was it 3 MONTHS ago" isn't, so it's omitted
// rather than implemented speculatively.
const RELATIVE_OFFSET_RESOLVERS: Record<string, (now: Date, n: number) => string> = {
  dateNDaysAgo: (now, n) => formatToday(addDaysUtc(now, -n)),
  weekdayNDaysAgo: (now, n) => formatWeekday(addDaysUtc(now, -n)),
  dateNDaysFromNow: (now, n) => formatToday(addDaysUtc(now, n)),
  weekdayNDaysFromNow: (now, n) => formatWeekday(addDaysUtc(now, n)),
  dateNWeeksAgo: (now, n) => formatToday(addDaysUtc(now, -n * 7)),
  dateNWeeksFromNow: (now, n) => formatToday(addDaysUtc(now, n * 7)),
  dateNMonthsAgo: (now, n) => formatToday(addMonthsUtc(now, -n)),
  dateNMonthsFromNow: (now, n) => formatToday(addMonthsUtc(now, n)),
};

const RELATIVE_OFFSET_RE = new RegExp(
  `\\{\\{\\s*(${Object.keys(RELATIVE_OFFSET_RESOLVERS).join('|')}):(\\d+)\\s*\\}\\}`,
  'g'
);

/**
 * Replace every {{token}} in `text` with its live value, computed against
 * `now` (defaults to the current moment). Unknown, malformed, or missing-arg
 * tokens are left untouched rather than silently stripped, so a typo in the
 * authored content is visibly wrong instead of quietly disappearing.
 */
export function resolveDynamicTokens(text: string, now: Date = new Date()): string {
  if (!text || text.indexOf('{{') === -1) return text;

  let out = text.replace(TOKEN_RE, (match, kind: string, dateArg?: string) => {
    if (kind === 'today') return formatToday(now);
    if (!dateArg) return match; // every other token requires a date arg
    const target = parseIsoUtc(dateArg);
    if (isNaN(target.getTime())) return match;

    switch (kind) {
      case 'daysSince': return Math.max(0, daysBetweenUtc(target, now)).toLocaleString('en-US');
      case 'weeksSince': return Math.max(0, Math.floor(daysBetweenUtc(target, now) / 7)).toLocaleString('en-US');
      case 'monthsSince': return Math.max(0, Math.floor(daysBetweenUtc(target, now) / 30)).toLocaleString('en-US');
      case 'humanSince': return humanDuration(target, now);
      case 'daysUntil': return Math.max(0, daysBetweenUtc(now, target)).toLocaleString('en-US');
      case 'weeksUntil': return Math.max(0, Math.floor(daysBetweenUtc(now, target) / 7)).toLocaleString('en-US');
      case 'monthsUntil': return Math.max(0, Math.floor(daysBetweenUtc(now, target) / 30)).toLocaleString('en-US');
      case 'humanUntil': return humanDuration(now, target);
      default: return match;
    }
  });

  // {{todayWeekday}} — simple standalone replace, no args to parse.
  out = out.replace(/\{\{\s*todayWeekday\s*\}\}/g, formatWeekday(now));

  // Second family: {{dateNDaysAgo:90}}-style tokens anchored to `now` with an
  // integer arg, resolved in the same pass so both families work anywhere in
  // the same string.
  if (out.indexOf('{{') !== -1) {
    out = out.replace(RELATIVE_OFFSET_RE, (match, tokenName: string, amountStr: string) => {
      const resolver = RELATIVE_OFFSET_RESOLVERS[tokenName];
      if (!resolver) return match;
      const n = parseInt(amountStr, 10);
      if (isNaN(n)) return match;
      return resolver(now, n);
    });
  }

  return out;
}

/**
 * Recursively walks any JSON-shaped value (objects, arrays, strings) and
 * resolves tokens in every string it finds. Non-string values pass through
 * unchanged. Safe to call on an entire EventContent object.
 */
export function resolveDynamicTokensDeep<T>(value: T, now: Date = new Date()): T {
  if (typeof value === 'string') return resolveDynamicTokens(value, now) as unknown as T;
  if (Array.isArray(value)) return value.map(v => resolveDynamicTokensDeep(v, now)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = resolveDynamicTokensDeep(v, now);
    return out as T;
  }
  return value;
}