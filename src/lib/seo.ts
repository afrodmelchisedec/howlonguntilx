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

// Maps your real category/subcategory slugs onto the glow buckets
// already defined in globals.css (.gc-* / --glow-*).
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
  event: { name: string; targetDate: Date | string },
  countdown: { days_left: number; hours_left: number },
  custom?: EventContent['faqs']
): FaqPair[] {
  const dateStr = new Date(event.targetDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const base: FaqPair[] = [
    { q: `How long until ${event.name}?`, a: `There are ${countdown.days_left} days and ${countdown.hours_left} hours until ${event.name} on ${dateStr}.` },
    { q: `How many days until ${event.name}?`, a: `Exactly ${countdown.days_left} days until ${event.name}.` },
    { q: `When is ${event.name}?`, a: `${event.name} is on ${dateStr}.` },
    { q: `How many weeks until ${event.name}?`, a: `There are approximately ${Math.floor(countdown.days_left / 7)} weeks until ${event.name}.` },
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
