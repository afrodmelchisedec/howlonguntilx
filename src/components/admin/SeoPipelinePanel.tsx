// FILE: src/components/admin/SeoPipelinePanel.tsx
'use client';

import { useEffect, useState } from 'react';

interface SeoOpportunity {
  id: string;
  keyword: string;
  volume: number;
  kd: number | null;
  trend: string | null;
  opportunityScore: number;
  template: string | null;
  entity: string | null;
  clusterKey: string | null;
  status: 'DISCOVERED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
  eventSlug: string | null;
  reviewNotes: string | null;
  updatedAt: string;
}

interface CategoryOption {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
}

interface SeoRun {
  id: string;
  seed: string;
  country: string;
  language: string;
  minVolume: number;
  maxKd: number;
  status: string;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
  opportunities: SeoOpportunity[];
}

const STATUS_COLORS: Record<string, string> = {
  DISCOVERED: '#94A3B8',
  REVIEWED: '#378ADD',
  APPROVED: '#1D9E75',
  REJECTED: '#D85A30',
  PUBLISHED: '#639922',
};

function scoreBadge(score: number) {
  const color = score >= 80 ? '#1D9E75' : score >= 60 ? '#BA7517' : '#94A3B8';
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: color + '22', color }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// "Marked done" caption for the calendar checkbox — reads off the existing
// updatedAt column, which the REVIEWED-status PATCH already bumps, so no new
// DB field is needed. Note: updatedAt also moves on Approve/Reject/Publish,
// so this reflects "last status change", not strictly "last time this box
// was checked" if those other actions happen afterward too.
function formatWorkedTimestamp(iso: string): string {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const rel = diffSec < 60 ? `${diffSec}s ago`
    : diffSec < 3600 ? `${Math.floor(diffSec / 60)}m ago`
    : diffSec < 86400 ? `${Math.floor(diffSec / 3600)}h ago`
    : `${Math.floor(diffSec / 86400)}d ago`;
  return `Marked done ${dateStr} (${rel})`;
}

// ---------------------------------------------------------------------------
// Content Calendar: turns the top-scoring keyword in each SERP cluster into
// a copy-pasteable content brief for an external Claude conversation to turn
// into the site's JSON content format. Two possible target schemas exist on
// this site:
//   - Event  (src/lib/seo.ts EventContent) — dated countdowns, e.g. "days
//     until christmas". Used when a programmatic date-pattern was detected.
//   - Article (the DURATION question_type shape: motherQuestion/shortAnswer/
//     blocks/heroData/faqs/sources) — informational/duration questions with
//     no fixed date, e.g. "how many days in a year".
// The heuristic below is a starting point, not a hard rule — the brief
// itself tells the person writing the article to confirm the call.
// ---------------------------------------------------------------------------

type ContentType = 'event' | 'article';

function classifyContentType(o: SeoOpportunity): ContentType {
  const dateLikeTemplates = ['days-until', 'weeks-until', 'months-until', 'countdown',
    'how-many-days-until', 'how-many-weeks-until', 'how-many-months-until', 'how-long-until'];
  if (o.template && dateLikeTemplates.includes(o.template)) return 'event';

  // Fallback: the backend template tag is often too coarse (or missing) for keywords tied
  // to one fixed, real calendar date — e.g. "how many days till september 1st" or "how many
  // days till 2026" — which were previously mis-tagged as Article. Inspect the raw keyword
  // for month+day, named holidays, explicit target years, or MM/DD dates instead.
  const kw = (o.keyword || '').toLowerCase();
  const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const hasMonthDay = new RegExp(`\\b${MONTH}\\s+\\d{1,2}(st|nd|rd|th)?\\b`, 'i').test(kw)
    || new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(of\\s+)?${MONTH}\\b`, 'i').test(kw);
  const hasNamedHoliday = /\b(christmas|easter|halloween|thanksgiving|new\s*year'?s?(\s*(day|eve))?|valentine'?s?\s*day|hanukkah|chanukah|diwali|ramadan|eid(\s*al[-\s]?(fitr|adha))?|st\.?\s*patrick'?s?\s*day|independence\s*day|labor\s*day|memorial\s*day|mother'?s?\s*day|father'?s?\s*day|black\s*friday|cyber\s*monday|super\s*bowl|election\s*day)\b/i.test(kw);
  const hasTargetYear = /\b(until|till|to|before)\s+\d{4}\b/i.test(kw)
    || /\b(ago\s+was|was|since)\s+\d{4}\b/i.test(kw); // catches "ago was 2020", "since 2020" -- date-anchored, needs live daysSince tokens, not a static Article
  const hasExplicitCalendarDate = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(kw);

  return (hasMonthDay || hasNamedHoliday || hasTargetYear || hasExplicitCalendarDate) ? 'event' : 'article';
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
  { regex: /new\s*year'?s?\s*eve/i, month: 12, day: 31 },
  { regex: /new\s*year'?s?(\s*day)?/i, month: 1, day: 1 },
  { regex: /valentine'?s?\s*day/i, month: 2, day: 14 },
  { regex: /st\.?\s*patrick'?s?\s*day/i, month: 3, day: 17 },
  { regex: /independence\s*day/i, month: 7, day: 4 },
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

  const slash = kw.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
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
  const md = kw.match(new RegExp('\\b(' + monthPattern + ')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?\\b', 'i'));
  if (md) {
    const month = MONTH_NAMES[md[1].toLowerCase()];
    const day = parseInt(md[2], 10);
    if (md[3]) return new Date(Date.UTC(parseInt(md[3], 10), month - 1, day));
    return nextOccurrence(month, day, now);
  }
  const dm = kw.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(' + monthPattern + ')\\b', 'i'));
  if (dm) {
    const day = parseInt(dm[1], 10);
    const month = MONTH_NAMES[dm[2].toLowerCase()];
    return nextOccurrence(month, day, now);
  }

  for (const h of FIXED_HOLIDAYS) {
    if (h.regex.test(kw)) {
      const explicitYear = kw.match(/\b(20\d{2})\b/);
      if (explicitYear) return new Date(Date.UTC(parseInt(explicitYear[1], 10), h.month - 1, h.day));
      return nextOccurrence(h.month, h.day, now);
    }
  }

  const yearOnly = kw.match(/\b(?:until|till|to|before)\s+(\d{4})\b/i);
  if (yearOnly) return new Date(Date.UTC(parseInt(yearOnly[1], 10), 0, 1));

  return null;
}

// When the pipeline extracted a clean entity (e.g. "Christmas"), use it as-is
// — buildFaqList (src/lib/seo.ts) wraps plain entity names in its own
// "How long until X?" / "How many days ago was X?" templates. But plenty of
// keywords have NO discrete entity to extract because the keyword itself
// already *is* the natural-language question (e.g. "how many days ago was
// 2020"). Passing that through unchanged used to publish it as the event's
// literal name, which buildFaqList would then wrap AGAIN into things like
// "How long ago was how many days ago was 2020?" — doubled, and prior to the
// tense fix, also stuck in future-tense "until" phrasing regardless of the
// target date. Formatting it as a real, capitalized, question-mark-terminated
// question instead lets buildFaqList's alreadyPhrased branch treat the name
// AS the question, matching what was actually searched for.
function defaultEventName(o: SeoOpportunity): string {
  if (o.entity) return o.entity;
  const raw = o.keyword.trim();
  if (!raw) return raw;
  const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
  return /[?!.]$/.test(capitalized) ? capitalized : `${capitalized}?`;
}

const EVENT_SCHEMA_BLOCK = [
  '[',
  '  {',
  '    "slug": "kebab-case-slug",',
  '    "name": "Display name of the event/date, e.g. \\"Christmas\\"",',
  '    "targetDate": "YYYY-MM-DD",',
  '    "categorySlug": "must exactly match one slug from the VALID CATEGORY SLUGS list above",',
  '    "description": "1-2 sentence meta description",',
  '    "heroImageUrl": "/images/questions/descriptive-filename.jpeg",',
  '    "heroImageAlt": "descriptive alt text",',
  '    "content": {',
  '      "heroFact": "one punchy, quotable sentence — this is what AI Overviews / featured snippets will lift verbatim, so it must fully answer the primary question on its own",',
  '      "quickFacts": [{ "label": "...", "value": "..." }],',
  '      "body": [{ "type": "paragraph" | "heading", "text": "..." }],',
  '      "timeline": [{ "offset": "...", "label": "...", "note": "optional" }],',
  '      "faqs": [{ "question": "...", "answer": "..." }],',
  '      "sources": [{ "label": "...", "url": "..." }],',
  '      "lastReviewed": "YYYY-MM-DD"',
  '    }',
  '  }',
  ']',
].join('\n');

const EVENT_EVERGREEN_SCHEMA_BLOCK = [
  '[',
  '  {',
  '    "slug": "<recurrenceKey, e.g. \\"september-14\\" — bare, no year, PERMANENT>",',
  '    "name": "Display name, e.g. \\"September 14\\"",',
  '    "targetDate": "YYYY-MM-DD (the NEXT upcoming occurrence from today — a safe initial value only; recurrenceKey below overrides this on every render forever, so it never needs manual bumping)",',
  '    "categorySlug": "must exactly match one slug from the VALID CATEGORY SLUGS list above",',
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
].join('\n');

const MONTH_SLUG_NAMES = ['january','february','march','april','may','june','july','august','september','october','november','december'];

// Generalizes the curated DATE_DEFS/YEARLY_TEMPLATES system (dateResolvers.ts,
// yearlyEventTemplates.ts) to ANY plain month/day keyword the pipeline finds,
// without hand-registering it there. Deliberately excludes keywords naming an
// explicit year (those become an ordinary one-off dated Event instead) and
// moving-date holidays (no generic month/day resolver exists for those).
function evergreenRecurrenceKey(keyword: string): { recurrenceKey: string; entityLabel: string } | null {
  const kw = keyword.toLowerCase();
  if (/\b(19|20)\d{2}\b/.test(kw)) return null;
  const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
  const monthFirst = kw.match(new RegExp(`\\b${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
  const dayFirst = !monthFirst ? kw.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH}\\b`, 'i')) : null;
  const match = monthFirst ?? dayFirst;
  if (!match) return null;
  const monthWord = monthFirst ? match[1] : match[2];
  const dayNum = monthFirst ? match[2] : match[1];
  const monthFull = MONTH_SLUG_NAMES.find(m => m.startsWith(monthWord.toLowerCase()));
  const day = parseInt(dayNum, 10);
  if (!monthFull || day < 1 || day > 31) return null;
  return {
    recurrenceKey: `${monthFull}-${day}`,
    entityLabel: `${monthFull.charAt(0).toUpperCase()}${monthFull.slice(1)} ${day}`,
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
    `This keyword has no fixed year attached (${entityLabel} happens every year), so this must be`,
    'published as a PERMANENT bare-slug Event, not a one-off dated page. Set "recurrenceKey" inside',
    `content to EXACTLY "${recurrenceKey}" — matching the top-level "slug" — so the live countdown`,
    `recomputes to the next occurrence of ${entityLabel} on every page load, forever, automatically.`,
    '',
    'Add extra-year FAQ entries using self-updating date tokens (see DYNAMIC DATE TOKENS below)',
    'instead of a number you compute yourself — these never go stale either:',
    ...years.map(y => `  { "question": "How long until ${entityLabel} ${y}?", "answer": "There are {{daysUntil:${y}-${monthNum}-${day}}} days until ${entityLabel} ${y}." }`),
  ];
}

const ARTICLE_SCHEMA_BLOCK = [
  '[',
  '  {',
  '    "slug": "kebab-case-slug",',
  '    "motherQuestion": "The primary question, phrased naturally, e.g. \\"How long until X?\\"",',
  '    "shortAnswer": "One self-contained sentence that fully answers the question on its own — this is what AI Overviews, Perplexity, and voice assistants will quote directly, so it cannot depend on the rest of the article for context",',
  '    "blocks": [',
  '      { "type": "paragraph", "text": "..." },',
  '      { "type": "heading", "text": "..." },',
  '      { "type": "chart", "title": "...", "data": [{ "label": "...", "value": 0 }] }',
  '    ],',
  '    "faqs": [{ "q": "...", "a": "..." }],',
  '    "sources": [{ "label": "...", "url": "..." }],',
  '    "questionType": "DURATION",',
  '    "heroImageUrl": "/images/questions/descriptive-filename.jpeg",',
  '    "heroImageAlt": "descriptive alt text",',
  '    "heroData": { "min": 0, "max": 0, "typical": 0, "unit": "days", "label": "...", "severity": "low|medium|high" }',
  '  }',
  ']',
].join('\n');


const EVENT_SEO_CHECKLIST = [
  "SEO SCORE CHECKLIST (mirrors the admin panel's scorer exactly \u2014 hit all 6 for a 100% score)",
  '-'.repeat(60),
  '\u2610 heroImageUrl set (15%) \u2014 use the imagePlan "hero" entry\'s filename, e.g. "/images/questions/<filename>".',
  '\u2610 heroImageAlt set (5%) \u2014 must be present TOGETHER with heroImageUrl or this check fails entirely.',
  '\u2610 categorySlug set to a real, existing category slug (20%) \u2014 subcategory is assigned in the admin UI after import; categorySlug alone unlocks this check.',
  '\u2610 content.body totals at least 300 words across paragraph/heading text combined (30%) \u2014 the single heaviest-weighted check here, don\'t skimp.',
  '\u2610 content.faqs has at least 3 entries (15%).',
  '\u2610 content.sources has at least 1 entry (15%).',
  'Skipping heroImageUrl/heroImageAlt alone caps this Event at 80% before a single word is written \u2014 always fill both.',
];

const ARTICLE_SEO_CHECKLIST = [
  "SEO SCORE CHECKLIST (mirrors the admin panel's scorer exactly \u2014 hit all of these for a 100% score)",
  '-'.repeat(60),
  '\u2610 shortAnswer is 40\u2013400 characters long (10%) \u2014 it doubles as the meta description; too short or too long both fail this check.',
  '\u2610 heroImageUrl set (5%) \u2014 use the imagePlan "hero" entry\'s filename, e.g. "/images/questions/<filename>".',
  '\u2610 heroImageAlt set (5%) \u2014 must be present together with heroImageUrl.',
  '\u2610 (Category + subcategory assigned in the admin UI after import \u2014 not JSON-controllable, worth 10% there, not blocked by this brief.)',
  '\u2610 At least 3 FAQs (10%), AND every faqs[].q must start with a question word (How/What/Why/When/Do/Does/Can/Will/Is/Are) and end in "?" (5% more) \u2014 count and phrasing are scored separately.',
  '\u2610 At least 2 sources (10%), each url a specific deep link to the actual source page, never a bare homepage like "https://example.com" \u2014 one homepage-only link fails this check for ALL sources.',
  '\u2610 At least one { "type": "chart", ... } block among "blocks" (5%).',
  '\u2610 Body word count across paragraph/heading blocks is at least 600 words (10%).',
  '\u2610 questionType "DURATION" must be paired with a filled-in "heroData" object \u2014 one without the other fails this check (5%).',
  '\u2610 motherQuestion itself reads as a genuine question: starts with How/What/Why/When/Do/Does/Can/Will/Is/Are and ends in "?" (5%).',
  '\u2610 One of the FIRST 4 entries in "blocks" is a heading whose text contains a digit, e.g. "How Long Until X? (18\u201324 Weeks)" \u2014 surfaces the numeric answer near the top for featured snippets (10%).',
  '\u2610 At least one internal link inside a paragraph block\'s text, markdown-style, pointing to a relative path on this site, e.g. "[Medications & Metabolism](/medications-metabolism)" \u2014 an external https:// link does NOT count (10%).',
  '\u2610 If this is a date-relative keyword ("X days ago/from now"), every calendar date and weekday in the content uses a {{dateN...}}/{{weekdayN...}} token \u2014 zero hardcoded dates.',
];

const IMAGE_PLAN_BLOCK = [
  '{',
  '  "imagePlan": [',
  '    {',
  '      "purpose": "hero",',
  '      "filename": "seo-optimized-hyphenated-descriptive-name.jpeg",',
  '      "altText": "descriptive alt text for accessibility and image SEO",',
  '      "googleFlowPrompt": "detailed visual prompt for Google Flow — ultra-realistic photo of a real scene with people/gadgets/context where relevant, vibrant saturated colors, specific lighting and setting; no text/words rendered in the image"',
  '    },',
  '    { "purpose": "supporting", "filename": "...", "altText": "...", "googleFlowPrompt": "..." },',
  '    { "purpose": "explanatory", "filename": "...", "altText": "...", "googleFlowPrompt": "..." }',
  '  ]',
  '}',
].join('\n');

const EVENT_DYNAMIC_TOKENS_BLOCK = [
  'DYNAMIC DATE TOKENS (resolved live at render time — src/lib/dynamicTokens.ts)',
  '-'.repeat(60),
  'This keyword involves a day-count that changes daily — do NOT hardcode a number that will',
  'go stale. Write the token text itself; resolveDynamicTokensDeep() substitutes the live value',
  'on every page load. Tokens work inside heroFact, quickFacts, body (paragraph/heading text),',
  'timeline, and faqs — anywhere inside the "content" object.',
  '',
  '  {{daysSince:YYYY-MM-DD}}    e.g. "2,446"   (days from that date to today)',
  '  {{weeksSince:YYYY-MM-DD}}   e.g. "349"',
  '  {{monthsSince:YYYY-MM-DD}}  e.g. "94"',
  '  {{humanSince:YYYY-MM-DD}}   e.g. "6 years, 8 months, 11 days"',
  '  {{daysUntil:YYYY-MM-DD}}    e.g. "131"     (days from today to that date; clamps to 0 once past)',
  '  {{weeksUntil:YYYY-MM-DD}}   e.g. "18"',
  '  {{monthsUntil:YYYY-MM-DD}}  e.g. "4"',
  '  {{humanUntil:YYYY-MM-DD}}   e.g. "4 months, 12 days"',
  '  {{today}}                   e.g. "September 12, 2026"',
  '',
  'Use "Since" tokens when targetDate is in the past, "Until" tokens when it\'s in the future.',
  'YYYY-MM-DD is always a fixed reference date (this event\'s targetDate, or another specific',
  'date named in the prose) — write the literal token text, never a number you computed yourself.',
  'Example for "how many days ago was 2020": heroFact could read "It has been',
  '{{daysSince:2020-01-01}} days since January 1, 2020."',
];

type DateOffsetUnit = 'day' | 'week' | 'month';
type DateOffsetInfo = { amount: number; unit: DateOffsetUnit; direction: 'ago' | 'fromNow' };

function normalizeOffsetUnit(u: string): DateOffsetUnit {
  if (u.startsWith('week')) return 'week';
  if (u.startsWith('month')) return 'month';
  return 'day';
}

// Detects keywords whose ANSWER is a calendar date that shifts every day — "what
// was 90 days ago", "what day is 45 days from now", "in 3 weeks" — as opposed to
// a static duration/conversion fact like "how many days is 72 hours" (always
// true, never shifts). This is the deciding factor for whether the brief
// demands dynamic tokens.
function parseDateOffsetKeyword(keyword: string): DateOffsetInfo | null {
  const kw = keyword.toLowerCase();
  const UNIT = '(day|days|week|weeks|month|months)';

  const ago = kw.match(new RegExp(`\\b(\\d+)\\s*${UNIT}\\s+ago\\b`, 'i'));
  if (ago) return { amount: parseInt(ago[1], 10), unit: normalizeOffsetUnit(ago[2]), direction: 'ago' };

  const fromNow = kw.match(new RegExp(`\\b(\\d+)\\s*${UNIT}\\s+(from\\s+now|from\\s+today|hence)\\b`, 'i'));
  if (fromNow) return { amount: parseInt(fromNow[1], 10), unit: normalizeOffsetUnit(fromNow[2]), direction: 'fromNow' };

  const inX = kw.match(new RegExp(`\\bin\\s+(\\d+)\\s*${UNIT}\\b`, 'i'));
  if (inX) return { amount: parseInt(inX[1], 10), unit: normalizeOffsetUnit(inX[2]), direction: 'fromNow' };

  return null;
}

const OFFSET_UNIT_LABEL: Record<DateOffsetUnit, string> = { day: 'Days', week: 'Weeks', month: 'Months' };

function offsetTokenName(kind: 'date' | 'weekday', info: DateOffsetInfo): string {
  const dir = info.direction === 'ago' ? 'Ago' : 'FromNow';
  return `${kind}N${OFFSET_UNIT_LABEL[info.unit]}${dir}`;
}

// The brief block for date-relative Articles — parallel to EVENT_DYNAMIC_TOKENS_BLOCK,
// but tailored to the SPECIFIC offset in this keyword so the exact token name/amount
// is spelled out, not left for whoever writes the article to assemble themselves.
// NOTE: this assumes src/lib/dynamicTokens.ts has been extended with the matching
// dateNDaysAgo/weekdayNDaysAgo/etc. resolvers and that the Article render path calls
// resolveDynamicTokensDeep on shortAnswer/blocks/faqs — see the two companion patch
// files. If either isn't done yet, tokens in the generated JSON will render as literal
// unresolved text on the page.
function buildArticleDateOffsetTokensBlock(info: DateOffsetInfo): string[] {
  const dateTok = `{{${offsetTokenName('date', info)}:${info.amount}}}`;
  const weekdayTok = info.unit === 'day' ? `{{${offsetTokenName('weekday', info)}:${info.amount}}}` : null;
  const dirWord = info.direction === 'ago' ? 'ago' : 'from today';
  const plural = info.amount === 1 ? '' : 's';

  return [
    'DYNAMIC DATE TOKENS (resolved live at render time — src/lib/dynamicTokens.ts)',
    '-'.repeat(60),
    `This keyword's answer is a calendar date that shifts every single day — it always means`,
    `"today ${info.amount} ${info.unit}${plural} ${dirWord}". Never hardcode a specific date or`,
    'weekday anywhere in this content. Use the tokens below instead — resolveDynamicTokensDeep()',
    'substitutes the live value on every page load, forever, with zero manual updates required.',
    'Tokens work inside shortAnswer, every block\'s "text", and every faqs[].a.',
    '',
    `  ${dateTok}`,
    `      e.g. "June 16, 2026" — today ${dirWord}, as a full formatted date.`,
    ...(weekdayTok
      ? [`  ${weekdayTok}`, `      e.g. "Tuesday" — weekday name only, for "...was a Tuesday" phrasing.`]
      : []),
    '  {{today}}',
    '      e.g. "September 14, 2026" — today\'s own date, for the anchor sentence.',
    '  {{todayWeekday}}',
    '      e.g. "Monday" — today\'s weekday name alone.',
    '',
    `Anchor-sentence pattern for shortAnswer: "As of {{today}}, ${info.amount} ${info.unit}${plural} ${dirWord} was ${dateTok}."`,
    'Reuse the SAME tokens everywhere else the date or weekday comes up (the "what day of the',
    'week" section, any FAQ answer, the conclusion) — never re-type the date as plain text once',
    'it has already been introduced. Inconsistent tokens vs. hardcoded text is worse than no',
    'tokens at all, because the two will silently disagree with each other after enough days pass.',
  ];
}

// For genuinely static Articles (unit conversions, typical-value ranges) where the fact
// itself never changes — replaces the old blanket "don't use tokens yet" caveat now that
// tokens ARE supported for the keywords that actually need them.
const ARTICLE_STATIC_NO_DATE_NOTE = [
  'DYNAMIC DATE TOKENS — NOT NEEDED FOR THIS TOPIC',
  '-'.repeat(60),
  'This keyword\'s answer is a fixed conversion or typical-value fact that does NOT change day',
  'to day (e.g. "72 hours is 3 days" is true forever). Write real, permanent numbers — no',
  '{{...}} token required anywhere in this content.',
];

// Formats the SAME categoryOptions state the Publish modal's dropdown already
// uses, so the brief always lists whatever is actually in the categories
// table right now -- no separate hardcoded list to fall out of sync with it.
function formatCategoryOptionsList(categoryOptions: { slug: string; label: string }[]): string {
  if (!categoryOptions || categoryOptions.length === 0) {
    return '(category list failed to load in the admin panel -- retry loading it there before publishing; do not guess a slug)';
  }
  return categoryOptions
    .map(c => c.slug + '  --  ' + c.label)
    .join('\n');
}

function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null,
  categoryOptions: { slug: string; label: string }[]
): string {
  const contentType = classifyContentType(primary);
  const evergreen = contentType === 'event' ? evergreenRecurrenceKey(primary.keyword) : null;
  // Only meaningful for Articles — Events always get EVENT_DYNAMIC_TOKENS_BLOCK below
  // regardless, since every Event already anchors to a fixed targetDate.
  const dateOffset = contentType === 'article' ? parseDateOffsetKeyword(primary.keyword) : null;
  const schema = contentType === 'event' ? (evergreen ? EVENT_EVERGREEN_SCHEMA_BLOCK : EVENT_SCHEMA_BLOCK) : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;
  // Replaces the old single ternary against ARTICLE_DYNAMIC_TOKENS_CAVEAT — now branches
  // three ways instead of two, since Articles split into date-relative vs. static.
  const dynamicTokensBlock =
    contentType === 'event'
      ? EVENT_DYNAMIC_TOKENS_BLOCK
      : dateOffset
        ? buildArticleDateOffsetTokensBlock(dateOffset)
        : ARTICLE_STATIC_NO_DATE_NOTE;
  const categorySlugList = formatCategoryOptionsList(categoryOptions);
  const relatedList = related.length
    ? related.map(r => `- "${r.keyword}" (vol ${r.volume}, KD ${r.kd ?? '?'}) — cover as a supporting section or FAQ, not a separate page`).join('\n')
    : '- (none detected in this cluster — this keyword stood alone in the SERP-overlap analysis)';

  const layer1 = voice
    ? [
        `LAYER 1 — VOICE & PERSONALITY ("${voice.name}", stored in ContentVoice — apply verbatim, do not alter)`,
        '='.repeat(60),
        '',
        voice.systemPrompt,
        '',
      ]
    : [
        'LAYER 1 — VOICE & PERSONALITY',
        '='.repeat(60),
        '',
        '⚠ No active ContentVoice found in the database. Run seed-content-voice.cjs from the repo',
        'root, then reload this page — this brief was generated WITHOUT a defined voice/tone.',
        '',
      ];

  const layer2 = [
    `LAYER 2 — SEO INTELLIGENCE FOR THIS PAGE (Day ${dayNumber})`,
    '='.repeat(60),
    '',
    `PRIMARY TARGET KEYWORD: "${primary.keyword}"`,
    `Search volume: ${primary.volume}/mo   Keyword difficulty: ${primary.kd ?? 'unknown'}   Trend: ${primary.trend}   Opportunity score: ${primary.opportunityScore}`,
    `Recommended content type: ${
      contentType === 'event'
        ? (evergreen ? 'Event (evergreen bare-slug — resets automatically every year)' : 'Event (dated countdown)')
        : dateOffset
          ? 'Article (date-relative — MUST use dynamic tokens, see below)'
          : 'Article (static duration/informational, no date dependency)'
    }`,
    '  — Confirm this fits before writing: Event needs a real, specific calendar date;',
    '    Article suits a question with a range/typical-value answer instead of one date.',
    '',
    'SUPPORTING KEYWORDS FROM THE SAME CLUSTER (weave these in, do not spin off separate pages):',
    relatedList,
    '',
    'CONTENT REQUIREMENTS',
    '-'.repeat(60),
    '1. Lead with a single, fully self-contained answer sentence (the heroFact/shortAnswer field).',
    '   It must make sense with zero surrounding context — this is the exact sentence that gets',
    '   quoted verbatim by Google AI Overviews, ChatGPT, Perplexity, and voice assistants (AEO/GEO).',
    '2. Cover every supporting keyword above as its own heading or FAQ — these are the exact',
    '   sub-questions people ask right after the primary one; leaving them out means the article',
    '   quietly loses that search traffic to a competitor page.',
    '3. Anticipate 2-3 natural FOLLOW-UP questions a person might ask a chatbot next, even if they',
    '   are not in the keyword list above — generative engines increasingly reward content that',
    '   answers the next question before it is asked, not just the literal query.',
    '4. Cite 3-6 credible sources (prefer .gov, .edu, major medical/professional bodies, or the',
    '   authoritative primary source for the topic) — required for both E-E-A-T and for AdSense',
    '   content-quality review. No source, no unverifiable claim.',
    '5. Where the topic has genuine risk/urgency (health, money, legal, safety), include an explicit',
    '   "when to seek professional help" or equivalent section — do not omit for the sake of brevity.',
    '6. Set lastReviewed (Event) — omit for Article, it does not use that field — to today\'s date.',
    '   (Tone, humor, length, and structure for THIS content come from Layer 1 above, not from here —',
    '   these two layers are deliberately kept separate so SEO strategy can change without touching voice.)',
    '',
    'VALID CATEGORY SLUGS (categorySlug must be EXACTLY one of these -- anything else is rejected on import)',
    '-'.repeat(60),
    categorySlugList,
    '',
    ...dynamicTokensBlock,
    '',
    ...(evergreen ? buildEvergreenInstructions(evergreen.recurrenceKey, evergreen.entityLabel) : []),
    '',
    ...seoChecklist,
    '',
    'IMAGERY (Google Flow — 3 images per article)',
    '-'.repeat(60),
    'Also generate exactly 3 image entries as a SEPARATE "imagePlan" JSON block (shown below, after',
    'the main article JSON) — one hero, one supporting, one explanatory. Each needs an SEO-optimized',
    'hyphenated filename, descriptive alt text, and a detailed Google Flow generation prompt. Use the',
    'hero entry\'s filename/altText for this article\'s heroImageUrl/heroImageAlt fields above once the',
    'This site now renders inline "type": "image" blocks directly inside "blocks" (Article) or',
    '"body" (Event) — use the "supporting" and "explanatory" imagePlan entries as actual blocks at',
    'natural points in the content, not just filler for the imagePlan JSON. Each inline image block',
    'needs { "type": "image", "src": "/images/questions/<filename>", "alt": "...", "caption": "..." }.',
    'Only the "hero" entry goes in heroImageUrl/heroImageAlt — the other 2 MUST appear as inline',
    'image blocks in the article/event body itself, or the images will never be visible on the page.',
    'Style for all 3 prompts: ultra-realistic photography, not abstract/illustrated/CG-render tech',
    'art (no floating circuit boards, glowing particle clouds, or generic "digital network" visuals',
    'unless the topic is literally about circuitry or networks). Each image should feel like a real',
    'photo of a real moment — a person actually doing the thing the article is about, using a real',
    'gadget, in a real, lived-in place. Populate scenes with people, objects, gadgets, and context;',
    'avoid empty/lifeless compositions. Colors should be bold and vibrant/saturated (rich color',
    'grading, punchy contrast) rather than desaturated or flat.',
    'Contrast against this site\'s dark UI should come from the image\'s natural content and lighting',
    '— shoot during golden hour, blue hour, neon-lit interiors/exteriors, or moody dramatic lighting',
    'where the environment itself skews darker while the subject and accent colors still pop — not',
    'from forcing every image into a literal near-black studio background. A vibrant sunset street',
    'scene or a warmly lit indoor shot both work fine. Only actively avoid: flat, shadowless daylight',
    'against a plain bright-white studio backdrop, since that\'s the one look that visually clashes',
    'with the dark UI.',
    '',
    'OUTPUT FORMAT',
    '-'.repeat(60),
    'Output the JSON ARRAY below (schema already wrapped in [ ] — the admin importer always expects',
    'an array of items, even for a single one; a bare { } object will be REJECTED with a "Payload',
    'must be an array" error), fully filled in for this specific topic.',
    '',
    'Formatting: output it as a SINGLE fenced code block using ```json ... ``` — valid, parseable',
    'JSON only inside the fence, no comments, no trailing commas, no truncation. Then output the',
    'separate imagePlan object (below) as its OWN fenced ```json ... ``` block straight after it.',
    'No commentary, prose, or explanation before, between, or after the two fenced blocks.',
    `ONLY the contents of the FIRST fenced block (the article array) paste into the site's admin ${contentType === 'event' ? 'Events' : 'Articles'} JSON-paste field —`,
    'the imagePlan block is for your own image-generation workflow only and must NEVER be pasted',
    'into the admin Events/Articles importer, or the payload will be rejected.',
    '',
    schema,
    '',
    IMAGE_PLAN_BLOCK,
  ];

  return [...layer1, ...layer2].join('\n');
}

export function SeoPipelinePanel() {
  const [runs, setRuns] = useState<SeoRun[]>([]);
  const [voice, setVoice] = useState<{ name: string; systemPrompt: string } | null>(null);
  const [voiceLoaded, setVoiceLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [view, setView] = useState<'discovery' | 'calendar-event' | 'calendar-article'>('discovery');
  const [copiedDay, setCopiedDay] = useState<number | null>(null);

  const [seed, setSeed] = useState('');
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('English');
  const [minVolume, setMinVolume] = useState(300);
  const [maxKd, setMaxKd] = useState(30);
  const [maxSerpCalls, setMaxSerpCalls] = useState(15);

  // Publish-flow state for whichever opportunity is currently being published
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishSlug, setPublishSlug] = useState('');
  const [publishName, setPublishName] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [publishCategorySlug, setPublishCategorySlug] = useState('');
  const [publishBlurb, setPublishBlurb] = useState('');
  const [publishFaq, setPublishFaq] = useState(''); // one "Question? || Answer" per line

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  async function loadRuns() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo/runs');
      if (!res.ok) throw new Error(`Failed to load runs (${res.status})`);
      const data = await res.json();
      setRuns(data.runs ?? []);
      if (!selectedRunId && data.runs?.length) setSelectedRunId(data.runs[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  }

  async function loadVoice() {
    try {
      const res = await fetch('/api/admin/seo/voice');
      if (!res.ok) throw new Error(`Failed to load content voice (${res.status})`);
      const data = await res.json();
      setVoice(data.voice ?? null);
    } catch {
      setVoice(null); // briefs fall back to a visible warning rather than failing silently
    } finally {
      setVoiceLoaded(true);
    }
  }

  async function loadCategories() {
    setCategoriesError(null);
    try {
      const res = await fetch('/api/admin/categories?includeEmpty=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Failed to load categories (${res.status})`);
      setCategories(data.categories ?? []);
    } catch (e) {
      setCategoriesError(e instanceof Error ? e.message : 'Failed to load categories');
    }
  }

  useEffect(() => {
    loadRuns();
    loadVoice();
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function triggerRun() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/seo/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, country, language, minVolume, maxKd, maxSerpCalls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Run failed (${res.status})`);
      await loadRuns();
      setSelectedRunId(data.run.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Run failed');
    } finally {
      setRunning(false);
    }
  }

  async function updateStatus(opportunityId: string, status: SeoOpportunity['status']) {
    const res = await fetch(`/api/admin/seo/opportunities/${opportunityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadRuns();
  }

  // Calendar "worked on" checkbox — persists via the existing REVIEWED status
  // rather than a new DB column. Toggles the WHOLE cluster (primary + every
  // supporting keyword merged under it), since "done" means the one article
  // covering all of them is done, not just the primary keyword's own row.
  async function toggleWorked(primary: SeoOpportunity, related: SeoOpportunity[]) {
    const nextStatus: SeoOpportunity['status'] = primary.status === 'REVIEWED' ? 'DISCOVERED' : 'REVIEWED';
    const ids = [primary.id, ...related.map(r => r.id)];
    await Promise.all(ids.map(id =>
      fetch(`/api/admin/seo/opportunities/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
    ));
    await loadRuns();
  }

  function openPublishForm(o: SeoOpportunity) {
    setPublishingId(o.id);
    setPublishSlug(o.entity ? o.entity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
    setPublishName(defaultEventName(o));
    setPublishDate('');
    setPublishCategorySlug('');
    setPublishBlurb('');
    setPublishFaq('');
  }

  async function submitPublish(opportunityId: string) {
    const faq = publishFaq
      .split('\n')
      .map(line => line.split('||').map(s => s.trim()))
      .filter(parts => parts.length === 2 && parts[0] && parts[1])
      .map(([question, answer]) => ({ question, answer }));

    const res = await fetch(`/api/admin/seo/opportunities/${opportunityId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'PUBLISHED',
        publish: {
          slug: publishSlug,
          name: publishName,
          targetDate: publishDate,
          categorySlug: publishCategorySlug,
          content: {
            heroFact: publishBlurb || undefined,
            faqs: faq.length ? faq : undefined,
          },
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Publish failed');
      return;
    }
    setPublishingId(null);
    await loadRuns();
  }

  const selectedRun = runs.find(r => r.id === selectedRunId) ?? null;

  // Flatten the category tree into an ordered, indented option list —
  // top-level categories first, each immediately followed by its own
  // subcategories, so the <select> below reads like the tree in
  // CategoriesManager without needing a nested <optgroup> per parent.
  const categoryOptions = (() => {
    const byParent = new Map<number | null, CategoryOption[]>();
    for (const c of categories) {
      const key = c.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    }
    const ordered: { slug: string; label: string }[] = [];
    const walk = (parentId: number | null, depth: number) => {
      for (const c of byParent.get(parentId) ?? []) {
        ordered.push({ slug: c.slug, label: `${'— '.repeat(depth)}${c.name}` });
        walk(c.id, depth + 1);
      }
    };
    walk(null, 0);
    return ordered;
  })();

  // Group by SERP-overlap cluster so related keywords sit together — the
  // highest-scoring keyword in each cluster is the one to actually write
  // an article for; the rest are candidate FAQ/H2 topics for that SAME
  // article, not separate pages (see clusterBySerpOverlap in
  // seoPipelineCore.ts for how clusters are formed).
  const clusteredGroups = (() => {
    if (!selectedRun) return [];
    const byCluster = new Map<string, SeoOpportunity[]>();
    for (const o of selectedRun.opportunities) {
      const key = o.clusterKey || `__none__${o.id}`;
      if (!byCluster.has(key)) byCluster.set(key, []);
      byCluster.get(key)!.push(o);
    }
    const groups = [...byCluster.entries()].map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => b.opportunityScore - a.opportunityScore),
    }));
    groups.sort((a, b) => b.items[0].opportunityScore - a.items[0].opportunityScore);
    return groups;
  })();

  // Eligible clusters (not rejected/published), split by content type so the
  // Event and Article calendars are independent 30-day sequences.
  const eligibleGroups = clusteredGroups
    .filter(g => g.items[0].status !== 'REJECTED' && g.items[0].status !== 'PUBLISHED');

  const eventCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'event')
    .filter(g => {
      const date = estimateEventDate(g.items[0].keyword);
      if (!date) return false;
      const days = daysBetweenUtc(startOfUtcDay(new Date()), date);
      return days >= 30; // no upper bound — anything 30+ days out qualifies
    })
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));

  const articleCalendarDays = eligibleGroups
    .filter(g => classifyContentType(g.items[0]) === 'article')
    .slice(0, 30)
    .map((g, idx) => ({ dayNumber: idx + 1, primary: g.items[0], related: g.items.slice(1) }));

  const calendarDays = view === 'calendar-article' ? articleCalendarDays : eventCalendarDays;

  async function copyBrief(dayNumber: number, brief: string) {
    try {
      await navigator.clipboard.writeText(brief);
      setCopiedDay(dayNumber);
      setTimeout(() => setCopiedDay(d => (d === dayNumber ? null : d)), 2000);
    } catch {
      setError('Could not copy to clipboard — select and copy the text manually.');
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">SEO Pipeline</h2>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView('discovery')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'discovery' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          Discovery
        </button>
        <button onClick={() => setView('calendar-event')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar-event' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar (Events)
        </button>
        <button onClick={() => setView('calendar-article')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar-article' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar (Article)
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {view === 'discovery' && (
        <>
      {/* Run form */}
      <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Seed keyword or phrase</label>
            <input value={seed} onChange={e => setSeed(e.target.value)}
              placeholder="e.g. how long until, when is, days until"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Target country</label>
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Language</label>
            <input value={language} onChange={e => setLanguage(e.target.value)} placeholder="Language"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Min. monthly searches</label>
            <input type="number" value={minVolume} onChange={e => setMinVolume(Number(e.target.value))} placeholder="Min volume"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max. keyword difficulty</label>
            <input type="number" value={maxKd} onChange={e => setMaxKd(Number(e.target.value))} placeholder="Max KD"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max SERP calls (cost control)</label>
            <input type="number" value={maxSerpCalls} onChange={e => setMaxSerpCalls(Number(e.target.value))}
              className="w-20 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-transparent" />
          </div>
          <button onClick={triggerRun} disabled={running || !seed.trim()}
            className="ml-auto px-4 py-1.5 rounded-lg bg-amber-600 text-white text-sm font-medium disabled:opacity-50">
            {running ? 'Running…' : 'Run Discovery'}
          </button>
        </div>
      </div>

      {/* Run history */}
      <div className="flex gap-4">
        <div className="w-56 flex-shrink-0">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Recent Runs</p>
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {!loading && runs.length === 0 && <p className="text-sm text-gray-400">No runs yet.</p>}
          {runs.map(r => (
            <button key={r.id} onClick={() => setSelectedRunId(r.id)}
              className={'w-full text-left px-2 py-2 rounded-lg mb-1 text-xs ' + (
                selectedRunId === r.id ? 'bg-amber-50 dark:bg-amber-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              <div className="font-medium truncate">{r.seed}</div>
              <div className="text-gray-400">{r.status} · {r.opportunities.length} keywords</div>
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {!selectedRun && <p className="text-sm text-gray-400">Select a run to see its opportunities.</p>}
          {selectedRun && (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">
                  Grouped by SERP overlap — the top row in each group is the keyword to write an
                  article for; the rows under it (↳) are candidate FAQ/H2 topics for that SAME article.
                </p>
                <a
                  href={`/api/admin/seo/runs/${selectedRun.id}/export`}
                  className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Export to Excel
                </a>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 pr-2">Keyword</th>
                    <th className="py-2 pr-2">Vol</th>
                    <th className="py-2 pr-2">KD</th>
                    <th className="py-2 pr-2">Trend</th>
                    <th className="py-2 pr-2">Score</th>
                    <th className="py-2 pr-2">Template</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clusteredGroups.map(group => (
                    <>
                      {group.items.map((o, idx) => (
                        <tr key={o.id} className="border-b border-gray-50 dark:border-gray-900">
                          <td className="py-2 pr-2">
                            {idx > 0 && <span className="text-gray-400 mr-1">↳</span>}
                            {o.keyword}
                          </td>
                          <td className="py-2 pr-2">{o.volume}</td>
                          <td className="py-2 pr-2">{o.kd ?? '?'}</td>
                          <td className="py-2 pr-2">{o.trend}</td>
                          <td className="py-2 pr-2">{scoreBadge(o.opportunityScore)}</td>
                          <td className="py-2 pr-2">{o.template ?? '—'}</td>
                          <td className="py-2 pr-2">
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ background: STATUS_COLORS[o.status] + '22', color: STATUS_COLORS[o.status] }}>
                              {o.status}
                            </span>
                            {o.eventSlug && <span className="ml-1 text-gray-400">→ /{o.eventSlug}</span>}
                          </td>
                          <td className="py-2 pr-2 whitespace-nowrap">
                            {o.status !== 'PUBLISHED' && (
                              <>
                                <button onClick={() => updateStatus(o.id, 'APPROVED')} className="text-emerald-600 mr-2">Approve</button>
                                <button onClick={() => updateStatus(o.id, 'REJECTED')} className="text-red-500 mr-2">Reject</button>
                                <button onClick={() => openPublishForm(o)} className="text-amber-600">Publish…</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
        </>
      )}

      {(view === 'calendar-event' || view === 'calendar-article') && (
        <div>
          {voiceLoaded && !voice && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
              No active writing voice found — briefs below are generated WITHOUT Layer 1 (personality).
              Run <code>node seed-content-voice.cjs</code> from the repo root, then reload this page.
            </div>
          )}
          {!selectedRun && <p className="text-sm text-gray-400">Select a run on the Discovery tab first.</p>}
          {selectedRun && calendarDays.length === 0 && (
            <p className="text-sm text-gray-400">
              {view === 'calendar-event'
                ? 'No event keywords are 30+ days out yet (moving-date holidays like Thanksgiving or Easter cannot be auto-detected yet).'
                : 'No eligible keywords left in this run — everything is either rejected or published.'}
            </p>
          )}
          {selectedRun && calendarDays.length > 0 && (
            <div className="space-y-6">
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }, (_, weekIdx) => {
                const weekDays = calendarDays.slice(weekIdx * 7, weekIdx * 7 + 7);
                return (
                  <div key={weekIdx}>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Week {weekIdx + 1} (Days {weekIdx * 7 + 1}–{weekIdx * 7 + weekDays.length})
                    </p>
                    <div className="space-y-4">
                      {weekDays.map(({ dayNumber, primary, related }) => {
                        const brief = buildContentBrief(primary, related, dayNumber, voice, categoryOptions);
                        const contentType = classifyContentType(primary);
                        const dateOffsetBadge = contentType === 'article' ? parseDateOffsetKeyword(primary.keyword) : null;
                        return (
                          <div key={primary.id} className={`p-4 rounded-xl border bg-white dark:bg-gray-900 ${primary.status === 'REVIEWED' ? 'border-emerald-400 dark:border-emerald-600' : 'border-gray-200 dark:border-gray-800'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Day {dayNumber}</p>
                                <p className="text-sm font-semibold">{primary.keyword}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Vol {primary.volume} · KD {primary.kd ?? '?'} · Score {primary.opportunityScore} ·{' '}
                                  {contentType === 'event' ? 'Event (dated)' : dateOffsetBadge ? 'Article (dynamic \ud83d\udd04)' : 'Article (static)'} ·{' '}
                                  {related.length} supporting keyword{related.length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {primary.status === 'REVIEWED' && primary.updatedAt && (
                                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                    {formatWorkedTimestamp(primary.updatedAt)}
                                  </span>
                                )}
                                <button
                                  onClick={() => toggleWorked(primary, related)}
                                  title={primary.status === 'REVIEWED' ? 'Mark as not worked on' : 'Mark as worked on'}
                                  className={`w-6 h-6 flex items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                                    primary.status === 'REVIEWED'
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'border-gray-300 dark:border-gray-600 text-transparent hover:border-emerald-400'
                                  }`}
                                >
                                  ✓
                                </button>
                                <span
                                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                    contentType === 'event'
                                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                  }`}
                                  title={contentType === 'event' ? 'Import into Events' : 'Import into Articles'}
                                >
                                  {contentType === 'event' ? 'Event' : 'Article'}
                                </span>
                                <button onClick={() => copyBrief(dayNumber, brief)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium">
                                  {copiedDay === dayNumber ? 'Copied!' : 'Copy Prompt'}
                                </button>
                              </div>
                            </div>
                            <details>
                              <summary className="text-xs text-gray-400 cursor-pointer">Preview brief</summary>
                              <pre className="mt-2 text-[11px] leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 rounded-lg p-3 overflow-x-auto">
                                {brief}
                              </pre>
                            </details>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Publish modal-ish inline form */}
      {publishingId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setPublishingId(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Publish as Event</h3>
            <div className="space-y-2 text-sm">
              <input value={publishSlug} onChange={e => setPublishSlug(e.target.value)} placeholder="slug"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <input value={publishName} onChange={e => setPublishName(e.target.value)} placeholder="Event name"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <select value={publishCategorySlug} onChange={e => setPublishCategorySlug(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                <option value="" disabled className="text-gray-400">Select a category…</option>
                {categoryOptions.map(opt => (
                  <option key={opt.slug} value={opt.slug} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">{opt.label}</option>
                ))}
              </select>
              {categoriesError && (
                <p className="text-xs text-red-500">{categoriesError} — <button type="button" onClick={loadCategories} className="underline">retry</button></p>
              )}
              <textarea value={publishBlurb} onChange={e => setPublishBlurb(e.target.value)} placeholder="heroFact / blurb"
                rows={3} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <textarea value={publishFaq} onChange={e => setPublishFaq(e.target.value)}
                placeholder={'One FAQ per line: Question? || Answer text'}
                rows={4} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPublishingId(null)} className="px-3 py-1.5 text-sm text-gray-500">Cancel</button>
              <button onClick={() => submitPublish(publishingId)}
                disabled={!publishSlug || !publishName || !publishDate || !publishCategorySlug}
                className="px-3 py-1.5 text-sm rounded-lg bg-amber-600 text-white disabled:opacity-50">
                Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}