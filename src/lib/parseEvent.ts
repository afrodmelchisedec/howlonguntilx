import * as chrono from 'chrono-node';

const KNOWN: Record<string, () => Date> = {
  christmas: () => nextOccurrence(12, 25),
  'new year': () => new Date(`${new Date().getFullYear() + 1}-01-01`),
  halloween: () => nextOccurrence(10, 31),
  easter: () => getEaster(new Date().getFullYear()),
};

function nextOccurrence(month: number, day: number): Date {
  const now = new Date();
  const d = new Date(now.getFullYear(), month - 1, day);
  if (d <= now) d.setFullYear(d.getFullYear() + 1);
  return d;
}

function getEaster(year: number): Date {
  const f = Math.floor;
  const a = year % 19, b = f(year / 100), c = year % 100;
  const d = f(b / 4), e = b % 4, g = f((b + 8) / 25);
  const h = f((b - g + 1) / 3), i = (19 * a + b - d - h + 15) % 30;
  const k = f(c / 4), l = c % 4;
  const m = (32 + 2 * e + 2 * k - i - l) % 7;
  const n = f((a + 11 * i + 22 * m) / 451);
  const month = f((i + m - 7 * n + 114) / 31);
  const day = ((i + m - 7 * n + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function parseEventQuery(query: string): Date | null {
  const key = query.toLowerCase().trim();
  if (KNOWN[key]) return KNOWN[key]();
  const parsed = chrono.parseDate(query);
  return parsed ?? null;
}
