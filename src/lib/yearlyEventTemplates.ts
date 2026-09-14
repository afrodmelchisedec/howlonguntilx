// FILE: src/lib/yearlyEventTemplates.ts
// One entry per recurring "major" entity. Static explanatory content is
// written once and reused everywhere; only the pieces that actually change
// get regenerated per call:
// - buildYearlyEventItem/Batch: near-term individual year pages (Event rows
//    like christmas-2027), via scripts/generate-yearly-event-batch.ts.
// - buildLongTailEventItem: ONE bare-slug reference page (e.g. "christmas")
//    covering the far-future years as an FAQ list, via
//    scripts/generate-longtail-event.ts. targetDate uses
//    resolveRecurrenceDate (next real occurrence), so its live countdown
//    widget is always correct for the year-less query - not a placeholder.
import { resolveDateForYear, resolveRecurrenceDate } from './dateResolvers';

interface YearlyTemplate {
  name: (year: number) => string;
  categorySlug: string;
  authorName?: string;
  // Required, not optional: the admin SEO scorer weighs custom hero image (15pts)
  // and matching alt text (5pts) - skipping these silently caps every generated
  // year at 80%. Making them required here forces that decision at template-
  // authoring time instead of discovering it later in the admin panel.
  heroImageUrl: string;
  heroImageAlt: string;
  // Required: 'fixed' entities (Christmas, Halloween) land on the same
  // calendar date every year but drift across weekdays - they get a
  // "day of the week" chart and "fixed-date holiday" phrasing.
  // 'moveable' entities (Easter, Thanksgiving, Mother's/Father's Day) are
  // the opposite: they always fall on the same weekday but their calendar
  // date shifts year to year - they get a "dates for the next 5 years"
  // chart and "moveable feast" phrasing instead. Getting this backwards
  // produces a page that's factually wrong about its own subject (e.g. a
  // weekday chart for Easter, which is always a Sunday and would show five
  // identical bars) - hence required, not defaulted.
  dateType: 'fixed' | 'moveable';
  staticBody: { type: 'heading' | 'paragraph'; text: string }[];
  // Rotating pool. For a BATCH of N years, callers must supply N distinct
  // pool entries (buildYearlyEventBatch enforces this) so no two pages in
  // the same near-term window repeat the same fact.
  heroFactPool: string[];
  staticFaqs: { q: string; a: string }[];
  sources: { label: string; url: string }[];
}

function weekdayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
}
function monthDay(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
// "Christmas 2032" -> "Christmas". Used anywhere we need the bare entity
// label but only have the year-parameterized name() function.
function entityLabelFor(template: YearlyTemplate, sampleYear: number): string {
  return template.name(sampleYear).replace(String(sampleYear), '').trim();
}

export const YEARLY_TEMPLATES: Record<string, YearlyTemplate> = {
  christmas: {
    name: (year) => `Christmas ${year}`,
    categorySlug: 'culture',
    dateType: 'fixed',
    heroImageUrl: '/images/questions/A glowing Christmas tree and wrapped presents in a dark room lit only by fairy lights and fireplace embers at night.jpeg',
    heroImageAlt: 'A decorated Christmas tree with wrapped presents and twinkling lights',
    heroFactPool: [
      'Christmas is a fixed-date holiday celebrated on December 25 by billions of people worldwide, marking the traditional birth of Jesus Christ.',
      'Jultomten, Sinterklaas, Santa Claus, and Père Noël are all regional variations of the same gift-giving figure, tracing back to the 4th-century Saint Nicholas of Myra.',
      'The tradition of the Christmas tree is usually traced to 16th-century Germany, and was popularized in English-speaking countries after Queen Victoria and Prince Albert displayed one in the 1840s.',
      "Christmas Island in the Indian Ocean and the Santa Claus Village in Rovaniemi, Finland both lean heavily into the holiday's name and imagery as part of their tourism identity.",
      "The Coca-Cola Company's mid-20th-century advertising is widely credited with cementing the modern image of Santa Claus as a red-suited, jolly figure in Western pop culture, though earlier depictions already existed.",
    ],
    staticBody: [
      { type: 'paragraph', text: "Christmas is the annual Christian festival celebrating the birth of Jesus Christ, observed on December 25 each year. It has grown into one of the most widely recognized holidays in the world, blending religious observance with cultural traditions of gift-giving, family gatherings, and festive decoration that span countries and faiths far beyond its Christian origins." },
      { type: 'heading', text: 'Why is Christmas always on December 25?' },
      { type: 'paragraph', text: "The date was formally established by the early Christian church in the 4th century, though the exact reasoning is debated among historians. Some scholars link it to the Roman winter solstice celebrations and the feast of Sol Invictus, while others point to early Christian calculations tying Jesus's conception to the spring equinox, placing his birth nine months later in late December." },
      { type: 'heading', text: 'How is Christmas celebrated around the world?' },
      { type: 'paragraph', text: "Christmas traditions vary enormously by culture. In the United States and United Kingdom, families decorate evergreen trees, hang stockings, and children await gifts from Santa Claus on Christmas morning. In Germany, the season begins with Advent calendars and Christmas markets selling mulled wine and roasted chestnuts. In parts of Latin America, Nochebuena on December 24 is the main event, with midnight feasts and church services. Japan, a largely non-Christian country, has adopted Christmas as a romantic and commercial holiday centered on illuminations and festive meals, most famously fried chicken." },
      { type: 'heading', text: 'The religious significance of Christmas' },
      { type: 'paragraph', text: "For Christians, Christmas marks the incarnation - the belief that God took human form as Jesus Christ, born to Mary in Bethlehem. The nativity story, recounted in the Gospels of Matthew and Luke, describes shepherds, angels, and wise men visiting the newborn, and it remains the basis for the manger scenes and carol services held in churches worldwide during Advent and on Christmas Eve." },
    ],
    staticFaqs: [
      { q: 'Why is Christmas always on December 25?', a: "The date was set by the early Christian church in the 4th century, likely tied to Roman winter solstice traditions and early theological calculations about Jesus's conception and birth." },
      { q: 'Is Christmas a public holiday everywhere?', a: 'Christmas is a public holiday in most Christian-majority countries and many secular ones too, though observance and traditions vary widely by region and culture.' },
    ],
    sources: [
      { label: 'Britannica - Christmas', url: 'https://www.britannica.com/topic/Christmas' },
      { label: 'History.com - History of Christmas', url: 'https://www.history.com/topics/christmas/history-of-christmas' },
    ],
  },
  easter: {
    name: (year) => `Easter ${year}`,
    categorySlug: 'culture',
    dateType: 'moveable',
    heroImageUrl: '/images/questions/easter-countdown.png',
    heroImageAlt: 'Colorful Easter eggs and a calendar showing the date',
    heroFactPool: [
      'Easter is the oldest and most important Christian festival, celebrating the resurrection of Jesus Christ.',
      "Easter can fall anywhere between March 22 and April 25 - the last time it landed on the earliest possible date, March 22, was in 1818, and the next time won't be until 2285.",
      "In Greece, midnight Easter church services are followed by fireworks and the exchanging of red-dyed eggs symbolizing Christ's blood.",
      'In Sweden, children dress as "Easter witches" and go door-to-door collecting candy, a tradition rooted in older folklore about witches flying off to meet the devil before Easter.',
      'Hot cross buns, traditionally eaten on Good Friday, are marked with a cross widely thought to represent the crucifixion, though spiced, marked buns predate Christianity in some form.',
    ],
    staticBody: [
      { type: 'paragraph', text: "Easter is the most significant holiday in the Christian calendar, celebrating the resurrection of Jesus Christ on the third day after his crucifixion. It marks the culmination of Holy Week and is preceded by Lent, a 40-day period of fasting and reflection." },
      { type: 'heading', text: 'Why does the Easter date change every year?' },
      { type: 'paragraph', text: "Unlike fixed-date holidays like Christmas, Easter is a moveable feast tied to the lunar cycle - specifically, it falls on the first Sunday after the first full moon following the spring equinox. This ecclesiastical rule means Easter can land anywhere between March 22 and April 25 depending on the year." },
      { type: 'heading', text: 'How is Easter celebrated around the world?' },
      { type: 'paragraph', text: "Easter traditions vary widely across cultures. In the United States and many Western countries, children take part in Easter egg hunts, and the Easter Bunny delivers baskets of candy and chocolate. In Greece, midnight church services feature fireworks and the exchanging of red-dyed eggs. In Sweden, children dress as Easter witches and go door-to-door collecting candy. Many cultures also have specific traditional foods, from hot cross buns to lamb and ham dishes." },
      { type: 'heading', text: 'The religious significance of Easter' },
      { type: 'paragraph', text: "For Christians, Easter celebrates the resurrection of Jesus Christ. According to the New Testament, Jesus was crucified on Good Friday and rose again on the third day, now marked as Easter Sunday - an event central to Christian faith, representing victory over death and the promise of eternal life." },
    ],
    staticFaqs: [
      { q: 'Why does Easter date change?', a: 'Easter falls on the first Sunday after the first full moon following the spring equinox, making it a moveable feast that can land anywhere between March 22 and April 25.' },
      { q: 'What is the significance of Easter?', a: "For Christians, Easter celebrates the resurrection of Jesus Christ. It's also widely observed as a cultural celebration of spring, renewal, and new life." },
    ],
    sources: [
      { label: 'NASA - Eclipses and the Easter Date', url: 'https://eclipse.gsfc.nasa.gov/SEhelp/calendar.html' },
      { label: 'Britannica - Easter', url: 'https://www.britannica.com/topic/Easter-holiday' },
    ],
  },
};

export function buildYearlyEventItem(baseSlug: string, year: number, factIndex?: number, relatedYears: number[] = [], longTailSlug?: string) {
  const template = YEARLY_TEMPLATES[baseSlug];
  if (!template) {
    throw new Error(`No yearly template registered for "${baseSlug}". Add one to YEARLY_TEMPLATES in yearlyEventTemplates.ts first.`);
  }

  const isoDate = resolveDateForYear(baseSlug, year);
  if (!isoDate) {
    throw new Error(`No date resolver registered for "${baseSlug}" in dateResolvers.ts (DATE_DEFS).`);
  }
  const date = new Date(isoDate);
  const weekday = weekdayName(date);
  const dateLabel = monthDay(date);
  const name = template.name(year);
  const entityLabel = entityLabelFor(template, year);

  const chartData = Array.from({ length: 5 }, (_, i) => {
    const y = year + i;
    const d = new Date(resolveDateForYear(baseSlug, y)!);
    if (template.dateType === 'moveable') {
      return { label: String(y), value: d.getUTCDate() };
    }
    const dow = d.getUTCDay();
    return { label: String(y), value: dow === 0 ? 7 : dow };
  });
  const chartTitle = template.dateType === 'moveable'
    ? `${entityLabel} dates for the next 5 years`
    : `Day of the week ${entityLabel} falls on, ${year}-${year + 4}`;

  const idx = factIndex ?? (year % template.heroFactPool.length);
  const heroFact = template.heroFactPool[idx % template.heroFactPool.length];

  const dateExplanation = template.dateType === 'moveable'
    ? `Unlike fixed-date holidays, this is a moveable feast - the calendar date shifts each year, though it always falls on a ${weekday}.`
    : `Unlike moveable feasts, this is a fixed-date holiday, so it lands on the same calendar date every year regardless of lunar cycles or astronomical events.`;

  const chartContext = template.dateType === 'moveable'
    ? `The chart above shows the exact date ${entityLabel} falls on each year in this window, since the calendar date itself shifts based on the lunar-linked calculation described above.`
    : `The chart above shows which day of the week ${entityLabel} falls on each year in this window - the calendar date itself never changes from year to year, only the weekday does.`;

  const planningNote = template.dateType === 'moveable'
    ? `Knowing the date this far in advance makes it easier to plan travel, family gatherings, or time off work well before ${entityLabel} itself arrives.`
    : `Because the date never moves, planning around ${entityLabel} is simple: once this year's weekday is known, the pattern for nearby years is easy to anticipate.`;

  const trackingNote = template.dateType === 'moveable'
    ? `Because ${entityLabel} shifts from year to year, it is worth bookmarking this page or checking back closer to the date, since the countdown above updates automatically as the calculated date approaches.`
    : `Since ${entityLabel} always lands on the same calendar date, you can rely on that date for planning years ahead - only the day of the week changes, which the chart above tracks for you.`;

  const dynamicBody = [
    { type: 'heading', text: `When is ${name}?` },
    { type: 'paragraph', text: `${name} falls on ${weekday}, ${dateLabel}, ${year}. ${dateExplanation}` },
    { type: 'paragraph', text: chartContext },
    { data: chartData, type: 'chart', title: chartTitle },
    { type: 'paragraph', text: planningNote },
    { type: 'paragraph', text: trackingNote },
  ];

  // Guard: the admin SEO scorer requires >=300 words of body content.
  // 350 (not 300) gives real margin - a prior attempt at 320 still failed
  // on Easter's shorter staticBody (319 words), so this threshold has more
  // headroom. Counts paragraph + heading text across BOTH the shared
  // staticBody and this year's dynamicBody, since that's the combined
  // content that actually renders on the live page.
  const combinedBodyForWordCount = [...template.staticBody, ...dynamicBody];
  const totalWords = combinedBodyForWordCount
    .filter((b: any) => b.type === 'paragraph' || b.type === 'heading')
    .reduce((sum: number, b: any) => sum + b.text.trim().split(/\s+/).filter(Boolean).length, 0);
  if (totalWords < 350) {
    throw new Error(`Yearly page for "${baseSlug}-${year}" has only ${totalWords} words of body content (paragraphs+headings) - the admin SEO scorer requires >=300, this guard uses 350 for margin. Add more to staticBody or the yearly dynamic paragraphs before generating.`);
  }

  const dynamicFaqs = [
    { q: `How long until ${name}?`, a: `${name} is on ${weekday}, ${dateLabel}, ${year} - see the live countdown above for the exact time remaining.` },
    { q: `When is ${name}?`, a: `${name} will be celebrated on ${weekday}, ${dateLabel}, ${year}.` },
  ];

  // Sibling years to cross-link from "OTHER YEARS" (see renderEventPage.tsx),
  // plus (optionally) the bare-slug long-tail reference page, so the link
  // is bidirectional once that page exists.
  const relatedSlugs = [
    ...relatedYears.filter((y) => y !== year).sort((a, b) => a - b).map((y) => `${baseSlug}-${y}`),
    ...(longTailSlug ? [longTailSlug] : []),
  ];

  return {
    slug: `${baseSlug}-${year}`,
    name,
    targetDate: isoDate,
    categorySlug: template.categorySlug,
    heroImageUrl: template.heroImageUrl,
    heroImageAlt: template.heroImageAlt,
    ...(template.authorName ? { authorName: template.authorName } : {}),
    content: {
      heroFact,
      body: [...template.staticBody, ...dynamicBody],
      faqs: [...dynamicFaqs, ...template.staticFaqs],
      sources: template.sources,
      ...(relatedSlugs.length > 0 ? { relatedSlugs } : {}),
    },
  };
}

// Generates `count` consecutive years starting at `startYear`, with
// sequential (non-repeating) factIndex assignment. Throws if the entity's
// heroFactPool is too small to cover the batch without a repeat - that's
// the enforcement point for "no duplicate content within a near-term window".
// `extraYears` are already-live years (e.g. [2026]) NOT regenerated here,
// but included in every generated item's relatedSlugs so the new batch
// cross-links back to what's already published. `longTailSlug`, if given,
// gets added to every item's relatedSlugs too (see buildYearlyEventItem).
export function buildYearlyEventBatch(baseSlug: string, startYear: number, count: number, extraYears: number[] = [], longTailSlug?: string) {
  const template = YEARLY_TEMPLATES[baseSlug];
  if (!template) {
    throw new Error(`No yearly template registered for "${baseSlug}". Add one to YEARLY_TEMPLATES in yearlyEventTemplates.ts first.`);
  }
  if (template.heroFactPool.length < count) {
    throw new Error(`"${baseSlug}" has only ${template.heroFactPool.length} heroFactPool entries but a batch of ${count} needs at least ${count} to guarantee no two years in this batch repeat the same fact. Add more entries to heroFactPool first.`);
  }
  const batchYears = Array.from({ length: count }, (_, i) => startYear + i);
  const allKnownYears = Array.from(new Set([...extraYears, ...batchYears])).sort((a, b) => a - b);
  return batchYears.map((year, i) => buildYearlyEventItem(baseSlug, year, i, allKnownYears, longTailSlug));
}

// The ONE bare-slug reference page per entity (e.g. slug "christmas", no
// year) covering years outside the near-term window as a single FAQ list - 
// this is what avoids publishing 44+ near-empty individual year pages.
// targetDate uses resolveRecurrenceDate (next REAL occurrence), so the
// live countdown widget on this page is always correct for the year-less
// query ("how long until Christmas") - recompute + re-import it once a
// year to keep that current; see scripts/generate-longtail-event.ts.
export function buildLongTailEventItem(baseSlug: string, startYear: number, endYear: number, nearTermYears: number[] = []) {
  const template = YEARLY_TEMPLATES[baseSlug];
  if (!template) {
    throw new Error(`No yearly template registered for "${baseSlug}". Add one to YEARLY_TEMPLATES in yearlyEventTemplates.ts first.`);
  }
  const targetDate = resolveRecurrenceDate(baseSlug);
  if (!targetDate) {
    throw new Error(`No recurrence resolver registered for "${baseSlug}" in dateResolvers.ts (DATE_DEFS) - the long-tail page's live countdown needs resolveRecurrenceDate, not just resolveDateForYear.`);
  }
  const entityLabel = entityLabelFor(template, startYear);
  const nextDate = new Date(targetDate);

  const longTailFaqs: { q: string; a: string }[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const iso = resolveDateForYear(baseSlug, year);
    if (!iso) continue;
    const d = new Date(iso);
    longTailFaqs.push({
      q: `When is ${entityLabel} ${year}?`,
      a: `${entityLabel} ${year} falls on ${weekdayName(d)}, ${monthDay(d)}, ${year}.`,
    });
  }
  if (longTailFaqs.length === 0) {
    throw new Error(`No years resolved between ${startYear} and ${endYear} for "${baseSlug}" - check the range or dateResolvers.ts.`);
  }

  const introParagraph = template.dateType === 'moveable'
    ? `${entityLabel} is a moveable feast - its calendar date shifts from year to year, though it always falls on a ${weekdayName(nextDate)}. The table below lists the exact date for each year from ${startYear} through ${endYear}.`
    : `${entityLabel} is a fixed-date holiday, so its exact day of the week each year can be worked out well in advance. The list below covers every year from ${startYear} through ${endYear}.`;

  const computationParagraph = template.dateType === 'moveable'
    ? `These far-future dates aren't estimates - they're calculated using the same ecclesiastical formula used to compute ${entityLabel} every year, based on the Gregorian calendar's fixed rules for the lunar cycle and the spring equinox. That means every date listed below is exact, however many decades out it falls, with no rounding or approximation involved.`
    : `Because ${entityLabel} always falls on the same calendar date, the only thing that changes from year to year is the day of the week - a simple, exact calculation based on the Gregorian calendar's leap-year cycle, with no ambiguity or estimation involved.`;

  const closingParagraph = `For the next few years with full detail, live countdowns, and additional trivia beyond just the date itself, see the dedicated year pages linked below.`;

  const body = [
    ...template.staticBody,
    { type: 'heading', text: `${entityLabel} in future years (${startYear}-${endYear})` },
    { type: 'paragraph', text: introParagraph },
    { type: 'paragraph', text: computationParagraph },
    { type: 'faq', items: longTailFaqs },
    { type: 'paragraph', text: closingParagraph },
  ];

  // Guard: the admin SEO scorer requires >=300 words of body content.
  // 320 (not 300) gives margin in case its word-splitting differs slightly
  // from this one. Counts paragraph + heading text only, matching what a
  // reader/crawler actually reads as prose (not FAQ items, which are a
  // separate scored check).
  const totalWords = body
    .filter((b: any) => b.type === 'paragraph' || b.type === 'heading')
    .reduce((sum: number, b: any) => sum + b.text.trim().split(/\s+/).filter(Boolean).length, 0);
  if (totalWords < 320) {
    throw new Error(`Long-tail page for "${baseSlug}" has only ${totalWords} words of body content (paragraphs+headings) - the admin SEO scorer requires >=300, this guard uses 320 for margin. Add more to staticBody or the long-tail intro/computation/closing paragraphs before generating.`);
  }

  const nearTermFaqs = [
    { q: `How long until ${entityLabel}?`, a: `See the live countdown above for the exact time remaining until the next ${entityLabel}.` },
    { q: `When is ${entityLabel} next?`, a: `${entityLabel} next falls on ${weekdayName(nextDate)}, ${monthDay(nextDate)}, ${nextDate.getUTCFullYear()}.` },
    ...template.staticFaqs,
  ];

  const relatedSlugs = nearTermYears.map((y) => `${baseSlug}-${y}`);

  return {
    slug: baseSlug,
    name: entityLabel,
    targetDate,
    categorySlug: template.categorySlug,
    heroImageUrl: template.heroImageUrl,
    heroImageAlt: template.heroImageAlt,
    ...(template.authorName ? { authorName: template.authorName } : {}),
    content: {
      heroFact: template.heroFactPool[0],
      body,
      faqs: nearTermFaqs,
      sources: template.sources,
      ...(relatedSlugs.length > 0 ? { relatedSlugs } : {}),
      lastReviewed: new Date().toISOString().slice(0, 10),
    },
  };
}
