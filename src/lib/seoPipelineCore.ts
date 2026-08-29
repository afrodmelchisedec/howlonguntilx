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

export async function runDiscovery(config: DiscoveryConfig): Promise<DiscoveryRow[]> {
  const ideas = await getKeywordIdeas(config.seed, config.country, config.language);

  const survivors = ideas
    .filter(i => i.volume >= config.minVolume && (i.kd === null || i.kd <= config.maxKd))
    .sort((a, b) => b.volume - a.volume);

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
      clusterKey: clusters[item.keyword] !== undefined ? `c${clusters[item.keyword]}` : '',
      opportunityScore: score,
      template,
      entity,
      hadSerp,
    };
  });
}
