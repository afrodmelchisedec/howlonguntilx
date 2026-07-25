// FILE: src/lib/toolHeroImages.ts
//
// One static featured image per category (not per-tool). Swap these placeholder
// paths for real assets in /public/images/categories/ — filenames match the
// category slug so no other code needs to change when you drop the real files in.

import type { CategorySlug } from './toolCategories';

export interface CategoryHeroImage {
  url: string;
  alt: string;
}

export const CATEGORY_HERO_IMAGES: Record<CategorySlug, CategoryHeroImage> = {
  leisure:      { url: '/images/categories/leisure.jpg',      alt: 'Leisure' },
  food:         { url: '/images/categories/food.jpg',         alt: 'Food' },
  travel:       { url: '/images/categories/travel.jpg',       alt: 'Travel' },
  tech:         { url: '/images/categories/tech.jpg',         alt: 'Tech' },
  finance:      { url: '/images/categories/finance.jpg',      alt: 'Finance' },
  scam:         { url: '/images/categories/scam.jpg',         alt: 'Scam' },
  productivity: { url: '/images/categories/productivity.jpg', alt: 'Productivity' },
};

export function heroImageForCategory(category: CategorySlug): CategoryHeroImage {
  return CATEGORY_HERO_IMAGES[category];
}
