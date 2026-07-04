// FILE: src/lib/seo.ts

export interface EventContent {
  heroFact?: string;
  quickFacts?: { label: string; value: string }[];
  faqs?: { question: string; answer: string }[];
  timeline?: { label: string; offset: string; note?: string }[];
  relatedSlugs?: string[];
  sources?: { label: string; url: string }[];
  lastReviewed?: string;
}

const GLOW_MAP: Record<string, string> = {
  leisure: 'personal',
  tech: 'tech',
  food: 'nature',
  travel: 'travel',
  scam: 'work',
  finance: 'finance',
  'sports-games': 'sports',
  entertainment: 'entertainment',
  'holidays-celebrations': 'holidays',
  'shopping-deals': 'shopping',
  'tech-events': 'tech',
  'food-festivals': 'nature',
  'restaurant-launches': 'nature',
  'harvest-seasons': 'nature',
  'nature-space-sky': 'space',
  'cyber-scams': 'work',
  'financial-fraud': 'finance',
  'phishing-identity': 'work',
  'money-milestones': 'finance',
  'tax-budget-deadlines': 'finance',
  'salary-payroll': 'finance',
  'health-wellness': 'health',
};

export function getCategoryGlow(categorySlug: string): string {
  return GLOW_MAP[categorySlug] ?? 'brand';
}

export function prettifySlug(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface FaqPair { q: string; a: string }

export function buildFaqList(
  event: { name: string; targetDate: Date | string; type?: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE' },
  countdown: { days_left: number; hours_left: number },
  custom?: EventContent['faqs']
): FaqPair[] {
  const dateStr = new Date(event.targetDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const name = event.name.trim();
  const alreadyPhrased = name.endsWith('?');
  const isElapsed = event.type === 'ELAPSED';
  const days = Math.abs(countdown.days_left);
  const hours = Math.abs(countdown.hours_left);
  const weeks = Math.floor(days / 7);

  const base: FaqPair[] = alreadyPhrased
    ? [
        {
          q: name,
          a: `${days.toLocaleString()} days and ${hours} hours ${isElapsed ? 'have passed since' : 'remain until'} ${dateStr}.`,
        },
        {
          q: `How many days ${isElapsed ? 'has it been since' : 'until'} ${dateStr}?`,
          a: `${isElapsed ? 'It has been' : 'There are'} exactly ${days.toLocaleString()} days.`,
        },
        {
          q: `How many weeks ${isElapsed ? 'has it been since' : 'until'} ${dateStr}?`,
          a: `Approximately ${weeks.toLocaleString()} weeks.`,
        },
      ]
    : [
        { q: `How long until ${name}?`, a: `There are ${days} days and ${hours} hours until ${name} on ${dateStr}.` },
        { q: `How many days until ${name}?`, a: `Exactly ${days} days until ${name}.` },
        { q: `When is ${name}?`, a: `${name} is on ${dateStr}.` },
        { q: `How many weeks until ${name}?`, a: `There are approximately ${weeks} weeks until ${name}.` },
      ];

  const extra: FaqPair[] = (custom ?? []).map(f => ({ q: f.question, a: f.answer }));

  const seen = new Set<string>();
  const merged: FaqPair[] = [];
  for (const pair of [...base, ...extra]) {
    const key = pair.q.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(pair);
  }
  return merged;
}

export type ToolKey = 'finance' | 'scam' | 'hype';

const TOOL_MAP: Record<string, ToolKey> = {
  finance: 'finance',
  'money-milestones': 'finance',
  'tax-budget-deadlines': 'finance',
  'salary-payroll': 'finance',
  scam: 'scam',
  'cyber-scams': 'scam',
  'financial-fraud': 'scam',
  'phishing-identity': 'scam',
};

export function getToolForCategory(categorySlug: string): ToolKey {
  return TOOL_MAP[categorySlug] ?? 'hype';
}
