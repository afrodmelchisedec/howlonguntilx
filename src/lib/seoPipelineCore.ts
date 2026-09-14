// FILE: src/lib/seoPipelineCore.ts
//
// TypeScript port of scripts/seo-pipeline/seo_pipeline_v1.py's pure logic
// (discovery, scoring, trend, clustering, programmatic-template detection),
// so the admin dashboard can trigger a run without shelling out to Python
// (Netlify serverless can't reliably spawn a Python process).
//
// Deliberately does NOT replicate the Python script's on-disk cache — a
// dashboard-triggered run is manual/infrequent, and adding a cache layer
// here would need its own storage decision. If that becomes a cost problem,
// revisit before re-adding caching.
//
// COST / TIMEOUT NOTE: SERP calls are the expensive, slow DataForSEO
// endpoint. runDiscovery() hard-caps them (maxSerpCalls) to stay inside a
// typical serverless function's execution window. Raise the cap only if
// you've moved this to a background/queued job.

const DATAFORSEO_BASE = 'https://api.dataforseo.com/v3';

function authHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error('Missing DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD environment variables.');
  }
  return 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
}

async function dataForSeoPost(endpoint: string, payload: unknown[]): Promise<any> {
  const res = await fetch(`${DATAFORSEO_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DataForSEO ${endpoint} failed: ${res.status} ${text.slice(0, 300)}`);
  }
  return res.json();
}

export interface KeywordIdea {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  kd: number | null;
  monthlySearches: { search_volume?: number }[];
}

export async function getKeywordIdeas(
  seed: string,
  locationName: string,
  languageName: string,
  limit = 700
): Promise<KeywordIdea[]> {
  const data = await dataForSeoPost('dataforseo_labs/google/keyword_ideas/live', [
    {
      keywords: [seed],
      location_name: locationName,
      language_name: languageName,
      limit,
      include_serp_info: false,
    },
  ]);

  const items: KeywordIdea[] = [];
  for (const task of data.tasks ?? []) {
    for (const result of task.result ?? []) {
      for (const item of result.items ?? []) {
        const info = item.keyword_info ?? {};
        items.push({
          keyword: item.keyword ?? '',
          volume: info.search_volume ?? 0,
          cpc: info.cpc ?? 0,
          competition: info.competition ?? 0,
          kd: item.keyword_properties?.keyword_difficulty ?? null,
          monthlySearches: info.monthly_searches ?? [],
        });
      }
    }
  }
  return items;
}

export async function getSerpDomains(
  keyword: string,
  locationName: string,
  languageName: string,
  device: 'desktop' | 'mobile' = 'desktop'
): Promise<string[]> {
  const data = await dataForSeoPost('serp/google/organic/live/advanced', [
    {
      keyword,
      location_name: locationName,
      language_name: languageName,
      device,
      depth: 10,
    },
  ]);

  const domains: string[] = [];
  for (const task of data.tasks ?? []) {
    for (const result of task.result ?? []) {
      for (const item of result.items ?? []) {
        if (item.type === 'organic' && item.domain) domains.push(item.domain);
      }
    }
  }
  return domains.slice(0, 10);
}

export type Trend = 'up' | 'flat' | 'down' | '?';

export function trendDirection(monthlySearches: { search_volume?: number }[]): Trend {
  if (!monthlySearches || monthlySearches.length < 6) return '?';
  const vols = monthlySearches.map(m => m.search_volume ?? 0);
  const recent = vols.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const priorSlice = vols.slice(0, -3);
  const prior = priorSlice.length ? priorSlice.reduce((a, b) => a + b, 0) / priorSlice.length : 0;
  if (prior === 0) return '?';
  const change = (recent - prior) / prior;
  if (change > 0.15) return 'up';
  if (change < -0.15) return 'down';
  return 'flat';
}

export function opportunityScore(volume: number, kd: number | null, trend: Trend, hasSerp: boolean): number {
  const volScore = Math.min(100, Math.log10(Math.max(volume, 1) + 1) * 25);
  const kdVal = kd ?? 50;
  const kdScore = Math.max(0, 100 - kdVal);
  const trendScore = { up: 100, flat: 60, down: 20, '?': 50 }[trend];
  const serpConfidence = hasSerp ? 1.0 : 0.7;
  return Math.round((0.4 * volScore + 0.35 * kdScore + 0.25 * trendScore) * serpConfidence * 10) / 10;
}

export function clusterBySerpOverlap(
  keywordDomains: Record<string, string[]>,
  threshold = 0.3
): Record<string, number> {
  const keywords = Object.keys(keywordDomains);
  const clusterOf: Record<string, number> = {};
  let nextId = 0;
  for (let i = 0; i < keywords.length; i++) {
    const kwA = keywords[i];
    if (clusterOf[kwA] !== undefined) continue;
    clusterOf[kwA] = nextId;
    const setA = new Set(keywordDomains[kwA]);
    for (let j = i + 1; j < keywords.length; j++) {
      const kwB = keywords[j];
      if (clusterOf[kwB] !== undefined || setA.size === 0) continue;
      const setB = new Set(keywordDomains[kwB]);
      if (setB.size === 0) continue;
      const union = new Set([...setA, ...setB]);
      let intersectionSize = 0;
      for (const d of setA) if (setB.has(d)) intersectionSize++;
      const overlap = intersectionSize / union.size;
      if (overlap >= threshold) clusterOf[kwB] = nextId;
    }
    nextId++;
  }
  return clusterOf;
}

const PROGRAMMATIC_TEMPLATES: { regex: RegExp; label: string }[] = [
  { regex: /^how many days (?:until|till) (.+)$/i, label: 'how-many-days-until' },
  { regex: /^how many weeks (?:until|till) (.+)$/i, label: 'how-many-weeks-until' },
  { regex: /^how many months (?:until|till) (.+)$/i, label: 'how-many-months-until' },
  { regex: /^how long (?:until|till) (.+)$/i, label: 'how-long-until' },
  { regex: /^days (?:until|till) (.+)$/i, label: 'days-until' },
  { regex: /^weeks (?:until|till) (.+)$/i, label: 'weeks-until' },
  { regex: /^months (?:until|till) (.+)$/i, label: 'months-until' },
  { regex: /^(.+) countdown$/i, label: 'countdown' },
];

export function detectProgrammatic(keyword: string): { template: string | null; entity: string | null } {
  const trimmed = keyword.trim();
  for (const { regex, label } of PROGRAMMATIC_TEMPLATES) {
    const match = trimmed.match(regex);
    if (match) return { template: label, entity: match[1].trim() };
  }
  return { template: null, entity: null };
}

export interface DiscoveryRow {
  keyword: string;
  volume: number;
  kd: number | null;
  cpc: number;
  competition: number;
  trend: Trend;
  clusterKey: string;
  opportunityScore: number;
  template: string | null;
  entity: string | null;
  hadSerp: boolean;
}

export interface DiscoveryConfig {
  seed: string;
  country: string;
  language: string;
  minVolume: number;
  maxKd: number;
  maxSerpCalls: number;
}

const MONTH_ABBREVIATIONS: Record<string, string> = {
  jan: 'january', feb: 'february', mar: 'march', apr: 'april', jun: 'june',
  jul: 'july', aug: 'august', sep: 'september', sept: 'september',
  oct: 'october', nov: 'november', dec: 'december',
};

// Collapses near-duplicate phrasings of the same underlying question (e.g.
// "how many days till jan 1", "how many days till january 1st", "days until
// january 1") down to one canonical string, so the merge step below can force
// them into the same cluster even when their SERP results happen to differ
// enough to miss clusterBySerpOverlap's overlap threshold. Deliberately only
// strips the handful of interchangeable question-lead-in phrases actually
// seen in this pipeline's keyword shapes -- it is NOT a general paraphrase
// detector, so genuinely different question types (e.g. "what day was it 90
// days ago" vs "how many days ago was") are correctly left unmerged.
function normalizeKeyword(keyword: string): string {
  let kw = keyword.trim().toLowerCase();
  kw = kw.replace(/^(how many (days|weeks|months|years)\s+(until|till|to|ago\s+was)\s*)/, '');
  kw = kw.replace(/^(how long\s+(until|till|ago\s+was|ago)\s*)/, '');
  kw = kw.replace(/^((days|weeks|months|years)\s+(until|till)\s*)/, '');
  kw = kw.replace(/\b(\d{1,2})(st|nd|rd|th)\b/g, '$1');
  kw = kw.split(/\s+/).map(word => MONTH_ABBREVIATIONS[word] ?? word).join(' ');
  return kw.replace(/\s+/g, ' ').trim();
}

export async function runDiscovery(config: DiscoveryConfig): Promise<DiscoveryRow[]> {
  const ideas = await getKeywordIdeas(config.seed, config.country, config.language);

  const survivors = ideas
    .filter(i => i.volume >= config.minVolume && (i.kd === null || i.kd <= config.maxKd))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 100); // hard cap: discovery results never exceed 100 keywords/run

  const serpBatch = survivors.slice(0, config.maxSerpCalls);
  const keywordDomains: Record<string, string[]> = {};
  for (const item of serpBatch) {
    try {
      keywordDomains[item.keyword] = await getSerpDomains(item.keyword, config.country, config.language);
    } catch {
      // one bad SERP call shouldn't kill the whole run — treat as "no SERP data"
      keywordDomains[item.keyword] = [];
    }
  }

  const clusters = clusterBySerpOverlap(keywordDomains);

  // Two-signal clustering over EVERY survivor, not just the cost-capped
  // handful clusterBySerpOverlap actually analyzed (SERP calls are expensive,
  // so only the top maxSerpCalls highest-volume keywords ever get a SERP-based
  // cluster id -- everything below that cap previously fell through as its
  // own solo "cluster" even when it was an obvious duplicate of something
  // higher up, e.g. "jan 1" / "january 1" / "january 1st" all landing past
  // the SERP-analysis cutoff). Union-find over two signals: (a) identical
  // normalized text -- always available, no SERP cost; (b) shared SERP
  // cluster id -- catches genuinely different phrasings whose search results
  // happen to overlap, still useful as a secondary signal where it exists.
  const uf: Record<string, string> = {};
  function find(x: string): string {
    if (uf[x] === undefined) uf[x] = x;
    return uf[x] === x ? x : (uf[x] = find(uf[x]));
  }
  function union(a: string, b: string) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) uf[ra] = rb;
  }

  const serpClusterToNorms: Record<number, Set<string>> = {};
  for (const item of survivors) {
    const norm = normalizeKeyword(item.keyword);
    find(norm); // seed every normalized group, even ones with no SERP data
    const cid = clusters[item.keyword];
    if (cid === undefined) continue;
    (serpClusterToNorms[cid] ??= new Set()).add(norm);
  }
  for (const cid in serpClusterToNorms) {
    const norms = Array.from(serpClusterToNorms[cid]);
    for (let i = 1; i < norms.length; i++) union(norms[0], norms[i]);
  }

  const finalClusterKeyOf: Record<string, string> = {};
  for (const item of survivors) {
    const norm = normalizeKeyword(item.keyword);
    finalClusterKeyOf[item.keyword] = 'g' + find(norm).replace(/[^a-z0-9]+/g, '-');
  }

  return survivors.map(item => {
    const trend = trendDirection(item.monthlySearches);
    const hadSerp = item.keyword in keywordDomains;
    const score = opportunityScore(item.volume, item.kd, trend, hadSerp);
    const { template, entity } = detectProgrammatic(item.keyword);
    return {
      keyword: item.keyword,
      volume: item.volume,
      kd: item.kd,
      cpc: item.cpc,
      competition: item.competition,
      trend,
      clusterKey: finalClusterKeyOf[item.keyword] || '',
      opportunityScore: score,
      template,
      entity,
      hadSerp,
    };
  });
}
