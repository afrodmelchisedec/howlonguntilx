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

// 1. dateResolvers.ts — generic fallback for any bare "<month>-<day>" slug
patch('src/lib/dateResolvers.ts', [[
`export function resolveRecurrenceDate(key: string, from: Date = new Date()): string | null {
  const fn = DATE_DEFS[key];
  if (!fn) return null;
  const year = from.getUTCFullYear();
  let target = fn(year);
  if (target.getTime() <= from.getTime()) target = fn(year + 1);
  return target.toISOString();
}

export function resolveDateForYear(key: string, year: number): string | null {
  const fn = DATE_DEFS[key];
  return fn ? fn(year).toISOString() : null;
}`,
`const MONTH_SLUGS: Record<string, number> = {
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
  const match = key.match(/^([a-z]+)-(\\d{1,2})$/i);
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
}`
]]);

// 2. seo.ts — new optional field on EventContent
patch('src/lib/seo.ts', [[
`export interface EventContent {
  body?: EventContentBodyBlock[];
  heroFact?: string;
  quickFacts?: { label: string; value: string }[];
  faqs?: { question: string; answer: string }[];
  timeline?: { label: string; offset: string; note?: string }[];
  relatedSlugs?: string[];
  provisional?: boolean;
  sources?: { label: string; url: string }[];
  lastReviewed?: string;
}`,
`export interface EventContent {
  body?: EventContentBodyBlock[];
  heroFact?: string;
  quickFacts?: { label: string; value: string }[];
  faqs?: { question: string; answer: string }[];
  timeline?: { label: string; offset: string; note?: string }[];
  relatedSlugs?: string[];
  provisional?: boolean;
  sources?: { label: string; url: string }[];
  lastReviewed?: string;
  // When set, this Event's targetDate is recomputed live on every request via
  // resolveRecurrenceDate(recurrenceKey) (see dateResolvers.ts + renderEventPage.tsx)
  // instead of trusting the stored targetDate column -- used for evergreen
  // bare-slug events (e.g. "september-14") that should never need an annual bump.
  recurrenceKey?: string;
}`
]]);

// 3. renderEventPage.tsx — live-recompute targetDate for evergreen events
patch('src/lib/renderEventPage.tsx', [
[
`import { resolveDynamicTokensDeep } from '@/lib/dynamicTokens';`,
`import { resolveDynamicTokensDeep } from '@/lib/dynamicTokens';
import { resolveRecurrenceDate } from '@/lib/dateResolvers';`
],
[
`export async function generateEventMetadata(rawSlug: string, canonicalPath: string): Promise<Metadata> {
  const event = await getEventBySlug(rawSlug);
  if (!event) return {};
  const { days_left, is_past, elapsed_days } = buildCountdownResponse(event.name, new Date(event.targetDate));`,
`export async function generateEventMetadata(rawSlug: string, canonicalPath: string): Promise<Metadata> {
  const event = await getEventBySlug(rawSlug);
  if (!event) return {};
  // Evergreen bare-slug events (recurrenceKey set) recompute their live target
  // date on every request instead of trusting the stored targetDate column —
  // see the matching override in EventPageContent below.
  const metaContent = (event.content ?? {}) as EventContent;
  const metaTargetDate = metaContent.recurrenceKey
    ? (resolveRecurrenceDate(metaContent.recurrenceKey) ?? event.targetDate)
    : event.targetDate;
  const { days_left, is_past, elapsed_days } = buildCountdownResponse(event.name, new Date(metaTargetDate));`
],
[
`  const countdown = buildCountdownResponse(event.name, new Date(event.targetDate));
  const weeks = Math.floor(countdown.days_left / 7);
  const months = Math.floor(countdown.days_left / 30);
  const hoursTotal = countdown.days_left * 24 + countdown.hours_left;
  const content = (event.content ?? {}) as EventContent;`,
`  const content = (event.content ?? {}) as EventContent;
  // Evergreen bare-slug events (recurrenceKey set) never store a "current"
  // targetDate to bump annually -- it's recomputed fresh on every request,
  // and a shallow clone carrying that live date is used everywhere below
  // (countdown widget, JSON-LD, FAQ schema, QuickFacts) so every consumer
  // sees the correct date without each one needing its own fix.
  const resolvedTargetDate = content.recurrenceKey
    ? (resolveRecurrenceDate(content.recurrenceKey) ?? event.targetDate)
    : event.targetDate;
  const liveEvent = resolvedTargetDate !== event.targetDate ? { ...event, targetDate: resolvedTargetDate } : event;

  const countdown = buildCountdownResponse(liveEvent.name, new Date(liveEvent.targetDate));
  const weeks = Math.floor(countdown.days_left / 7);
  const months = Math.floor(countdown.days_left / 30);
  const hoursTotal = countdown.days_left * 24 + countdown.hours_left;`
],
[
`<PageJsonLd event={event} countdown={countdown} />`,
`<PageJsonLd event={liveEvent} countdown={countdown} />`
],
[
`<CountdownDisplay event={event} glow={glow} provisional={(event.content as EventContent | null)?.provisional} />`,
`<CountdownDisplay event={liveEvent} glow={glow} provisional={(event.content as EventContent | null)?.provisional} />`
],
[
`<FaqSchema event={event} countdown={countdown} />`,
`<FaqSchema event={liveEvent} countdown={countdown} />`
],
[
`            eventName={event.name}
            targetDate={event.targetDate}
            extra={content.quickFacts}`,
`            eventName={liveEvent.name}
            targetDate={liveEvent.targetDate}
            extra={content.quickFacts}`
]
]);

// 4. SeoPipelinePanel.tsx — evergreen classification + brief generation
patch('src/components/admin/SeoPipelinePanel.tsx', [
[
`  '  }',
  ']',
].join('\\n');

const ARTICLE_SCHEMA_BLOCK = [`,
`  '  }',
  ']',
].join('\\n');

const EVENT_EVERGREEN_SCHEMA_BLOCK = [
  '[',
  '  {',
  '    "slug": "<recurrenceKey, e.g. \\\\"september-14\\\\" — bare, no year, PERMANENT>",',
  '    "name": "Display name, e.g. \\\\"September 14\\\\"",',
  '    "targetDate": "YYYY-MM-DD (the NEXT upcoming occurrence from today — a safe initial value only; recurrenceKey below overrides this on every render forever, so it never needs manual bumping)",',
  '    "categorySlug": "one of the site\\'s existing category slugs (ask if unsure)",',
  '    "description": "1-2 sentence meta description",',
  '    "heroImageUrl": "/images/questions/descriptive-filename.jpeg",',
  '    "heroImageAlt": "descriptive alt text",',
  '    "content": {',
  '      "recurrenceKey": "<MUST exactly equal the slug above>",',
  '      "heroFact": "one punchy, quotable sentence — this is what AI Overviews / featured snippets will lift verbatim, so it must fully answer the primary question on its own",',
  '      "quickFacts": [{ "label": "...", "value": "..." }],',
  '      "body": [{ "type": "paragraph" | "heading", "text": "..." }],',
  '      "faqs": [{ "question": "...", "answer": "..." }],',
  '      "sources": [{ "label": "...", "url": "..." }],',
  '      "lastReviewed": "YYYY-MM-DD"',
  '    }',
  '  }',
  ']',
].join('\\n');

const MONTH_SLUG_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];

// Generalizes the curated DATE_DEFS/YEARLY_TEMPLATES system (dateResolvers.ts,
// yearlyEventTemplates.ts) to ANY plain month/day keyword the pipeline finds,
// without hand-registering it there. Deliberately excludes keywords naming an
// explicit year (those become an ordinary one-off dated Event instead) and
// moving-date holidays (no generic month/day resolver exists for those).
function evergreenRecurrenceKey(keyword: string): { recurrenceKey: string; entityLabel: string } | null {
  const kw = keyword.toLowerCase();
  if (/\\b(19|20)\\d{2}\\b/.test(kw)) return null;
  const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const monthFirst = kw.match(new RegExp(\`\\\\b\${MONTH}\\\\s+(\\\\d{1,2})(?:st|nd|rd|th)?\\\\b\`, 'i'));
  const dayFirst = !monthFirst ? kw.match(new RegExp(\`\\\\b(\\\\d{1,2})(?:st|nd|rd|th)?\\\\s+(?:of\\\\s+)?\${MONTH}\\\\b\`, 'i')) : null;
  const match = monthFirst ?? dayFirst;
  if (!match) return null;
  const monthWord = monthFirst ? match[1] : match[2];
  const dayNum = monthFirst ? match[2] : match[1];
  const monthFull = MONTH_SLUG_NAMES.find(m => m.startsWith(monthWord.toLowerCase()));
  const day = parseInt(dayNum, 10);
  if (!monthFull || day < 1 || day > 31) return null;
  return {
    recurrenceKey: \`\${monthFull}-\${day}\`,
    entityLabel: \`\${monthFull.charAt(0).toUpperCase()}\${monthFull.slice(1)} \${day}\`,
  };
}

function buildEvergreenInstructions(recurrenceKey: string, entityLabel: string): string[] {
  const [monthSlug, dayStr] = recurrenceKey.split('-');
  const day = dayStr.padStart(2, '0');
  const monthNum = (MONTH_SLUG_NAMES.indexOf(monthSlug) + 1).toString().padStart(2, '0');
  const thisYear = new Date().getUTCFullYear();
  const years = [thisYear + 1, thisYear + 2, thisYear + 3];
  return [
    'EVERGREEN BARE-SLUG EVENT (recurrenceKey — resets automatically every year, no manual upkeep)',
    '-'.repeat(60),
    \`This keyword has no fixed year attached (\${entityLabel} happens every year), so this must be\`,
    'published as a PERMANENT bare-slug Event, not a one-off dated page. Set "recurrenceKey" inside',
    \`content to EXACTLY "\${recurrenceKey}" — matching the top-level "slug" — so the live countdown\`,
    \`recomputes to the next occurrence of \${entityLabel} on every page load, forever, automatically.\`,
    '',
    'Add extra-year FAQ entries using self-updating date tokens (see DYNAMIC DATE TOKENS below)',
    'instead of a number you compute yourself — these never go stale either:',
    ...years.map(y => \`  { "question": "How long until \${entityLabel} \${y}?", "answer": "There are {{daysUntil:\${y}-\${monthNum}-\${day}}} days until \${entityLabel} \${y}." }\`),
  ];
}

const ARTICLE_SCHEMA_BLOCK = [`
],
[
`function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null
): string {
  const contentType = classifyContentType(primary);
  const schema = contentType === 'event' ? EVENT_SCHEMA_BLOCK : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;`,
`function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null
): string {
  const contentType = classifyContentType(primary);
  const evergreen = contentType === 'event' ? evergreenRecurrenceKey(primary.keyword) : null;
  const schema = contentType === 'event' ? (evergreen ? EVENT_EVERGREEN_SCHEMA_BLOCK : EVENT_SCHEMA_BLOCK) : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;`
],
[
`    \`Recommended content type: \${contentType === 'event' ? 'Event (dated countdown)' : 'Article (duration/informational, no fixed date)'}\`,`,
`    \`Recommended content type: \${contentType === 'event' ? (evergreen ? 'Event (evergreen bare-slug — resets automatically every year)' : 'Event (dated countdown)') : 'Article (duration/informational, no fixed date)'}\`,`
],
[
`    ...(contentType === 'event' ? EVENT_DYNAMIC_TOKENS_BLOCK : ARTICLE_DYNAMIC_TOKENS_CAVEAT),
    '',
    ...seoChecklist,`,
`    ...(contentType === 'event' ? EVENT_DYNAMIC_TOKENS_BLOCK : ARTICLE_DYNAMIC_TOKENS_CAVEAT),
    '',
    ...(evergreen ? buildEvergreenInstructions(evergreen.recurrenceKey, evergreen.entityLabel) : []),
    '',
    ...seoChecklist,`
]
]);
