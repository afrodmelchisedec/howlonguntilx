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
`].join('\\n');

function buildContentBrief(`,
`].join('\\n');

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
  'Use "Since" tokens when targetDate is in the past, "Until" tokens when it\\'s in the future.',
  'YYYY-MM-DD is always a fixed reference date (this event\\'s targetDate, or another specific',
  'date named in the prose) — write the literal token text, never a number you computed yourself.',
  'Example for "how many days ago was 2020": heroFact could read "It has been',
  '{{daysSince:2020-01-01}} days since January 1, 2020."',
];

const ARTICLE_DYNAMIC_TOKENS_CAVEAT = [
  'DYNAMIC DATE TOKENS — DO NOT USE HERE YET',
  '-'.repeat(60),
  'src/lib/dynamicTokens.ts is only confirmed wired into the Event pipeline',
  '(resolveDynamicTokensDeep runs on parsed EventContent JSON). Article rendering has not been',
  'confirmed to call the same resolver, so a {{daysSince:...}} / {{daysUntil:...}} token left in',
  'Article content may render as literal, unresolved text on the page. If this topic needs a',
  'live day-count, write a real hardcoded number for now (flag it for manual updates) instead',
  'of a token, until Article-side token support is confirmed.',
];

function buildContentBrief(`
],
[
`    '6. Set lastReviewed (Event) — omit for Article, it does not use that field — to today\\'s date.',
    '   (Tone, humor, length, and structure for THIS content come from Layer 1 above, not from here —',
    '   these two layers are deliberately kept separate so SEO strategy can change without touching voice.)',
    '',
    ...seoChecklist,`,
`    '6. Set lastReviewed (Event) — omit for Article, it does not use that field — to today\\'s date.',
    '   (Tone, humor, length, and structure for THIS content come from Layer 1 above, not from here —',
    '   these two layers are deliberately kept separate so SEO strategy can change without touching voice.)',
    '',
    ...(contentType === 'event' ? EVENT_DYNAMIC_TOKENS_BLOCK : ARTICLE_DYNAMIC_TOKENS_CAVEAT),
    '',
    ...seoChecklist,`
]
]);
