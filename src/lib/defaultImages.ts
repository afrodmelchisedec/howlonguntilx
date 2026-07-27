// FILE: src/lib/defaultImages.ts
// Shared category-pool fallback images, used by both ArticleLayout and Event
// detail pages so there's one source of truth instead of two copies drifting apart.

export const CATEGORY_DEFAULT_IMAGES: Record<string, string[]> = {
  health: ['/images/defaults/health/Health-1.jpg', '/images/defaults/health/Health-2.jpg', '/images/defaults/health/Health-3.jpg'],
  finance: ['/images/defaults/finance/Finance-1.jpg', '/images/defaults/finance/Finance-2.jpg', '/images/defaults/finance/Finance-3.jpg', '/images/defaults/finance/Finance-4.jpg', '/images/defaults/finance/Finance-5.jpg'],
  scam: ['/images/defaults/scam/Scam-1.jpg', '/images/defaults/scam/Scam-2.jpg', '/images/defaults/scam/Scam-3.jpg'],
  tech: ['/images/defaults/tech/Tech-1.jpg', '/images/defaults/tech/Tech-2.jpg', '/images/defaults/tech/Tech-3.jpg', '/images/defaults/tech/Tech-4.jpg', '/images/defaults/tech/Tech-5.jpg'],
  leisure: ['/images/defaults/leisure/Leisure-1.jpg', '/images/defaults/leisure/Leisure-2.jpg', '/images/defaults/leisure/Leisure-3.jpg', '/images/defaults/leisure/Leisure-4.jpg', '/images/defaults/leisure/Leisure-5.jpg'],
  food: ['/images/defaults/food/Food-1.jpg', '/images/defaults/food/Food-2.jpg', '/images/defaults/food/Food-3.jpg', '/images/defaults/food/Food-4.jpg', '/images/defaults/food/Food-5.jpg'],
  travel: ['/images/defaults/travel/Travel-1.jpg', '/images/defaults/travel/Travel-2.jpg', '/images/defaults/travel/Travel-3.jpg', '/images/defaults/travel/Travel-4.jpg'],
  productivity: ['/images/defaults/productivity/Productivity-1.jpg', '/images/defaults/productivity/Productivity-2.jpg', '/images/defaults/productivity/Productivity-3.jpg'],
};

export function pickDefaultImage(categorySlug: string | null | undefined, seed: string | null | undefined): string {
  const pool = CATEGORY_DEFAULT_IMAGES[categorySlug ? categorySlug.toLowerCase() : ''];
  const all = pool || Object.values(CATEGORY_DEFAULT_IMAGES).flat();
  if (all.length === 0) return '/images/default-article-hero.svg';
  let hash = 0;
  for (const ch of String(seed || '')) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return all[Math.abs(hash) % all.length];
}
