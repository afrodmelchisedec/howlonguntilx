// FILE: src/lib/toolCategories.ts
//
// Single source of truth for which of the 7 categories each tool belongs to.
// Used to (a) vary which tools/widgets surface on an article detail page,
// and (b) resolve the static per-category featured image at article-import time.

export type CategorySlug = 'leisure' | 'food' | 'travel' | 'tech' | 'finance' | 'scam' | 'productivity';

export interface CategoryMeta {
  slug: CategorySlug;
  label: string;
  emoji: string;
  color: string; // "r, g, b" — matches the --glow-* custom property format used elsewhere
}

export const CATEGORIES: CategoryMeta[] = [
  { slug: 'leisure',      label: 'Leisure',      emoji: '⚽', color: '48, 219, 91' },
  { slug: 'food',         label: 'Food',         emoji: '🍽️', color: '88, 214, 113' },
  { slug: 'travel',       label: 'Travel',       emoji: '✈️', color: '100, 240, 235' },
  { slug: 'tech',         label: 'Tech',         emoji: '💻', color: '64, 156, 255' },
  { slug: 'finance',      label: 'Finance',      emoji: '💰', color: '255, 159, 10' },
  { slug: 'scam',         label: 'Scam',         emoji: '🔐', color: '255, 75, 110' },
  { slug: 'productivity', label: 'Productivity', emoji: '🗂️', color: '218, 143, 255' },
];

export const TOOL_CATEGORY_MAP: Record<string, CategorySlug> = {
  // Tech
  'tech-events': 'tech',

  // Leisure
  'dark-sky-explorer': 'leisure',
  'energy-rhythm-mapper': 'leisure',
  'entertainment-watchlist': 'leisure',
  'sports-games-tracker': 'leisure',

  // Food
  'food-festival-passport': 'food',
  'harvest-seasons': 'food',
  'recipe-batch-dial': 'food',
  'restaurant-launches': 'food',

  // Travel
  'jetlag-adjustment-dragger': 'travel',

  // Scam
  'fraud-response-clock': 'scam',
  'phishing-identity-watch': 'scam',
  'password-rotation-board': 'scam',

  // Finance
  'payroll-runway': 'finance',
  'savings-goal-slider': 'finance',
  'tax-budget-deadlines': 'finance',
  'runway-lab': 'finance',
  'subscription-density': 'finance',
  'shopping-deals-radar': 'finance',

  // Productivity
  'meeting-overlap': 'productivity',
  'deadline-buffer-slider': 'productivity',
  'focus-block-builder': 'productivity',
};

export function categoryForTool(toolSlug: string): CategorySlug | null {
  return TOOL_CATEGORY_MAP[toolSlug] ?? null;
}

export function toolsInCategory(category: CategorySlug): string[] {
  return Object.entries(TOOL_CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([tool]) => tool);
}

export function categoryMeta(category: CategorySlug): CategoryMeta | undefined {
  return CATEGORIES.find(c => c.slug === category);
}

// --- Round-robin tool assignment ---------------------------------------
// When bulk-importing several articles under the same category, we don't
// want them all landing on the same toolSlug. This cycles through that
// category's tools in a stable order so consecutive imports fan out evenly.
// In-memory only — call resetToolRotation() at the start of each import
// batch so rotation is deterministic per-run rather than drifting across
// server restarts/redeploys.
const categoryToolCursor: Partial<Record<CategorySlug, number>> = {};

export function nextToolForCategory(category: CategorySlug): string | null {
  const tools = toolsInCategory(category);
  if (tools.length === 0) return null;
  const cursor = categoryToolCursor[category] ?? 0;
  const tool = tools[cursor % tools.length];
  categoryToolCursor[category] = cursor + 1;
  return tool;
}

export function resetToolRotation() {
  (Object.keys(categoryToolCursor) as CategorySlug[]).forEach(k => {
    delete categoryToolCursor[k];
  });
}
