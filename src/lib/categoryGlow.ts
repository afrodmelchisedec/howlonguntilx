// FILE: src/lib/categoryGlow.ts
// Single source of truth for category theme colors (RGB triplets, e.g. "48, 219, 91")
// across the 8-category taxonomy (biology, family, finance, food, culture, health,
// science, time). Used by Article and Event detail pages to theme hero/timer/FAQ
// colors off the content's actual category — do not duplicate this map elsewhere.
//
// Not to be confused with the legacy getCategoryGlow() in lib/seo.ts, which returns
// CSS-var-suffix strings (e.g. "personal") for the old pre-migration category slugs
// and is still used by CategoryBadge/PopularGrid — that one is untouched by this file.

const CATEGORY_GLOW_MAP: Record<string, string> = {
  biology: '48, 219, 91',
  family:  '255, 105, 180',
  finance: '255, 159, 10',
  food:    '88, 214, 113',
  culture: '175, 82, 222',
  health:  '255, 69, 58',
  science: '100, 240, 235',
  time:    '64, 156, 255',
};

const DEFAULT_GLOW = '83, 74, 217'; // brand indigo fallback

export function getCategoryGlowRGB(categorySlug: string | null | undefined): string {
  if (!categorySlug) return DEFAULT_GLOW;
  return CATEGORY_GLOW_MAP[categorySlug] ?? DEFAULT_GLOW;
}

// WCAG-AA-safe variant of the same category color, for use as TEXT color
// specifically (captions, stat numbers). The raw glow color above is tuned
// for decorative use (strips, progress bars, borders/shadows) and several
// categories fail 4.5:1 contrast as text against a card background — see
// the --cat-text-* custom properties in globals.css for the verified
// values (dark-theme in :root, light-theme override in .light). Returns a
// CSS var() reference, not a raw triplet, so the correct shade resolves
// automatically per theme via the cascade — no JS theme detection needed.
const CATEGORY_TEXT_VAR: Record<string, string> = {
  biology: 'var(--cat-text-biology)',
  family:  'var(--cat-text-family)',
  finance: 'var(--cat-text-finance)',
  food:    'var(--cat-text-food)',
  culture: 'var(--cat-text-culture)',
  health:  'var(--cat-text-health)',
  science: 'var(--cat-text-science)',
  time:    'var(--cat-text-time)',
};
const DEFAULT_TEXT_VAR = 'var(--cat-text-default)';

export function getCategoryTextRGB(categorySlug: string | null | undefined): string {
  if (!categorySlug) return DEFAULT_TEXT_VAR;
  return CATEGORY_TEXT_VAR[categorySlug] ?? DEFAULT_TEXT_VAR;
}
