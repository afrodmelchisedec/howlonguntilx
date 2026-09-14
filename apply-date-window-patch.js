const fs = require('fs');

function patch(file, replacements) {
  const raw = fs.readFileSync(file, 'utf8');
  const hasCRLF = raw.includes('\r\n');
  let content = raw.replace(/\r\n/g, '\n');
  for (const [oldStr, newStr] of replacements) {
    if (!content.includes(oldStr)) throw new Error(`Pattern not found in ${file}:\n${oldStr.slice(0,80)}...`);
    content = content.replace(oldStr, newStr);
  }
  if (hasCRLF) content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync(file, content);
  console.log('Patched', file);
}

patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`  return (hasMonthDay || hasNamedHoliday || hasTargetYear || hasExplicitCalendarDate) ? 'event' : 'article';
}

// When the pipeline extracted a clean entity (e.g. "Christmas"), use it as-is`,
`  return (hasMonthDay || hasNamedHoliday || hasTargetYear || hasExplicitCalendarDate) ? 'event' : 'article';
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

// Only holidays with a FIXED calendar date each year -- Thanksgiving, Easter, Labor/Memorial
// Day, Election Day, Black Friday, Ramadan/Eid/Diwali/Hanukkah etc. are deliberately excluded
// because their date moves year to year and cannot be computed without a real calendar library;
// keywords for those fall through to a null return below and are excluded from the dated
// 30-40-day Event calendar window until someone adds a proper mover-holiday calculation.
const FIXED_HOLIDAYS: { regex: RegExp; month: number; day: number }[] = [
  { regex: /christmas/i, month: 12, day: 25 },
  { regex: /halloween/i, month: 10, day: 31 },
  { regex: /new\\s*year'?s?\\s*eve/i, month: 12, day: 31 },
  { regex: /new\\s*year'?s?(\\s*day)?/i, month: 1, day: 1 },
  { regex: /valentine'?s?\\s*day/i, month: 2, day: 14 },
  { regex: /st\\.?\\s*patrick'?s?\\s*day/i, month: 3, day: 17 },
  { regex: /independence\\s*day/i, month: 7, day: 4 },
];

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function daysBetweenUtc(from: Date, to: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / MS_PER_DAY);
}

function nextOccurrence(month: number, day: number, now: Date): Date {
  const year = now.getUTCFullYear();
  let d = new Date(Date.UTC(year, month - 1, day));
  if (d.getTime() < startOfUtcDay(now).getTime()) d = new Date(Date.UTC(year + 1, month - 1, day));
  return d;
}

// Best-effort: pulls an actual calendar date out of a keyword string so the Event calendar can
// be filtered to events happening in 30-40 days (Google's indexing lag means writing about an
// event closer than that rarely ranks in time). Returns null when no fixed date can be found --
// see the FIXED_HOLIDAYS comment above for why some event-shaped keywords still return null.
function estimateEventDate(keyword: string, now: Date = new Date()): Date | null {
  const kw = keyword.toLowerCase();

  const slash = kw.match(/\\b(\\d{1,2})\\/(\\d{1,2})(?:\\/(\\d{2,4}))?\\b/);
  if (slash) {
    const month = parseInt(slash[1], 10);
    const day = parseInt(slash[2], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      if (slash[3]) {
        let year = parseInt(slash[3], 10);
        if (year < 100) year += 2000;
        return new Date(Date.UTC(year, month - 1, day));
      }
      return nextOccurrence(month, day, now);
    }
  }

  const monthPattern = Object.keys(MONTH_NAMES).sort((a, b) => b.length - a.length).join('|');
  const md = kw.match(new RegExp('\\\\b(' + monthPattern + ')\\\\.?\\\\s+(\\\\d{1,2})(?:st|nd|rd|th)?(?:,?\\\\s*(\\\\d{4}))?\\\\b', 'i'));
  if (md) {
    const month = MONTH_NAMES[md[1].toLowerCase()];
    const day = parseInt(md[2], 10);
    if (md[3]) return new Date(Date.UTC(parseInt(md[3], 10), month - 1, day));
    return nextOccurrence(month, day, now);
  }
  const dm = kw.match(new RegExp('\\\\b(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s+(?:of\\\\s+)?(' + monthPattern + ')\\\\b', 'i'));
  if (dm) {
    const day = parseInt(dm[1], 10);
    const month = MONTH_NAMES[dm[2].toLowerCase()];
    return nextOccurrence(month, day, now);
  }

  for (const h of FIXED_HOLIDAYS) {
    if (h.regex.test(kw)) return nextOccurrence(h.month, h.day, now);
  }

  const yearOnly = kw.match(/\\b(?:until|till|to|before)\\s+(\\d{4})\\b/i);
  if (yearOnly) return new Date(Date.UTC(parseInt(yearOnly[1], 10), 0, 1));

  return null;
}

// When the pipeline extracted a clean entity (e.g. "Christmas"), use it as-is`
],
[
`  const eventCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'event')
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));`,
`  const eventCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'event')
    .filter(g => {
      const date = estimateEventDate(g.items[0].keyword);
      if (!date) return false;
      const days = daysBetweenUtc(startOfUtcDay(new Date()), date);
      return days >= 30 && days <= 40;
    })
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));`
],
[
`          {selectedRun && calendarDays.length === 0 && (
            <p className="text-sm text-gray-400">No eligible keywords left in this run — everything is either rejected or published.</p>
          )}`,
`          {selectedRun && calendarDays.length === 0 && (
            <p className="text-sm text-gray-400">
              {view === 'calendar-event'
                ? 'No event keywords currently fall in the 30-40 day indexing window (moving-date holidays like Thanksgiving or Easter cannot be auto-detected yet).'
                : 'No eligible keywords left in this run — everything is either rejected or published.'}
            </p>
          )}`
]
]);
