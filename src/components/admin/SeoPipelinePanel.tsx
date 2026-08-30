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
  const hasTargetYear = /\b(until|till|to|before)\s+\d{4}\b/i.test(kw);
  const hasExplicitCalendarDate = /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/.test(kw);

  return (hasMonthDay || hasNamedHoliday || hasTargetYear || hasExplicitCalendarDate) ? 'event' : 'article';
}

const EVENT_SCHEMA_BLOCK = [
  '[',
  '  {',
  '    "slug": "kebab-case-slug",',
  '    "name": "Display name of the event/date, e.g. \\"Christmas\\"",',
  '    "targetDate": "YYYY-MM-DD",',
  '    "categorySlug": "one of the site\'s existing category slugs (ask if unsure)",',
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
];

const IMAGE_PLAN_BLOCK = [
  '{',
  '  "imagePlan": [',
  '    {',
  '      "purpose": "hero",',
  '      "filename": "seo-optimized-hyphenated-descriptive-name.jpeg",',
  '      "altText": "descriptive alt text for accessibility and image SEO",',
  '      "googleFlowPrompt": "detailed visual prompt for Google Flow — describe scene, mood, style, lighting; no text/words rendered in the image"',
  '    },',
  '    { "purpose": "supporting", "filename": "...", "altText": "...", "googleFlowPrompt": "..." },',
  '    { "purpose": "explanatory", "filename": "...", "altText": "...", "googleFlowPrompt": "..." }',
  '  ]',
  '}',
].join('\n');

function buildContentBrief(
  primary: SeoOpportunity,
  related: SeoOpportunity[],
  dayNumber: number,
  voice: { name: string; systemPrompt: string } | null
): string {
  const contentType = classifyContentType(primary);
  const schema = contentType === 'event' ? EVENT_SCHEMA_BLOCK : ARTICLE_SCHEMA_BLOCK;
  const seoChecklist = contentType === 'event' ? EVENT_SEO_CHECKLIST : ARTICLE_SEO_CHECKLIST;
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
    `Recommended content type: ${contentType === 'event' ? 'Event (dated countdown)' : 'Article (duration/informational, no fixed date)'}`,
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
    'All 3 Google Flow prompts must explicitly call for a dark, moody color palette — deep charcoal or near-black backgrounds, warm low-key accent lighting, strong contrast — so the generated image reads well against this site\'s dark UI. Never call for bright white backgrounds, flat daylight, or high-key studio lighting.',
    '',
    'OUTPUT FORMAT',
    '-'.repeat(60),
    'Output the JSON ARRAY below (schema already wrapped in [ ] — the admin importer always expects',
    'an array of items, even for a single one; a bare { } object will be REJECTED with a "Payload',
    'must be an array" error), fully filled in for this specific topic, followed by the separate',
    'imagePlan JSON block. No commentary, no markdown code fences, no explanation.',
    `ONLY the array block above the imagePlan section pastes into the site's admin ${contentType === 'event' ? 'Events' : 'Articles'} JSON-paste field —`,
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
  const [view, setView] = useState<'discovery' | 'calendar'>('discovery');
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
  const [publishCategorySlug, setPublishCategorySlug] = useState('leisure');
  const [publishBlurb, setPublishBlurb] = useState('');
  const [publishFaq, setPublishFaq] = useState(''); // one "Question? || Answer" per line

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

  useEffect(() => {
    loadRuns();
    loadVoice();
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

  function openPublishForm(o: SeoOpportunity) {
    setPublishingId(o.id);
    setPublishSlug(o.entity ? o.entity.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
    setPublishName(o.entity ?? o.keyword);
    setPublishDate('');
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

  // One cluster per day for 7 days — skips anything already rejected or
  // published, since those don't need a brief written for them.
  const calendarDays = clusteredGroups
    .filter(g => g.items[0].status !== 'REJECTED' && g.items[0].status !== 'PUBLISHED')
    .slice(0, 30)
    .map((g, idx) => ({
      dayNumber: idx + 1,
      primary: g.items[0],
      related: g.items.slice(1),
    }));

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
        <button onClick={() => setView('calendar')}
          className={'px-3 py-1.5 rounded-lg text-sm font-medium ' + (
            view === 'calendar' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          30-Day Content Calendar
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

      {view === 'calendar' && (
        <div>
          {voiceLoaded && !voice && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm">
              No active writing voice found — briefs below are generated WITHOUT Layer 1 (personality).
              Run <code>node seed-content-voice.cjs</code> from the repo root, then reload this page.
            </div>
          )}
          {!selectedRun && <p className="text-sm text-gray-400">Select a run on the Discovery tab first.</p>}
          {selectedRun && calendarDays.length === 0 && (
            <p className="text-sm text-gray-400">No eligible keywords left in this run — everything is either rejected or published.</p>
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
                        const brief = buildContentBrief(primary, related, dayNumber, voice);
                        const contentType = classifyContentType(primary);
                        return (
                          <div key={primary.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Day {dayNumber}</p>
                                <p className="text-sm font-semibold">{primary.keyword}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Vol {primary.volume} · KD {primary.kd ?? '?'} · Score {primary.opportunityScore} ·{' '}
                                  {contentType === 'event' ? 'Event (dated)' : 'Article (duration/informational)'} ·{' '}
                                  {related.length} supporting keyword{related.length === 1 ? '' : 's'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
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
              <input value={publishCategorySlug} onChange={e => setPublishCategorySlug(e.target.value)} placeholder="categorySlug"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <textarea value={publishBlurb} onChange={e => setPublishBlurb(e.target.value)} placeholder="heroFact / blurb"
                rows={3} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
              <textarea value={publishFaq} onChange={e => setPublishFaq(e.target.value)}
                placeholder={'One FAQ per line: Question? || Answer text'}
                rows={4} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-transparent" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setPublishingId(null)} className="px-3 py-1.5 text-sm text-gray-500">Cancel</button>
              <button onClick={() => submitPublish(publishingId)}
                disabled={!publishSlug || !publishName || !publishDate}
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
