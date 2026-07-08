// FILE: src/lib/dealsPresets.ts
export interface Deal {
  id: string;
  name: string;
  emoji: string;
  category: string;
  originalPrice: number;
  dealPrice: number;
  discountPercent: number;
  expiresIso: string;
  color: string;
}

export const DEALS_PRESETS: Deal[] = [
  { id: 'earbuds',   name: 'Wireless Earbuds Pro',      emoji: '🎧', category: 'Electronics', originalPrice: 129.99, dealPrice: 79.99, discountPercent: 38, expiresIso: '2026-07-08T18:00:00.000Z', color: '100, 200, 255' },
  { id: 'weekender',  name: 'Leather Weekender Bag',     emoji: '👜', category: 'Fashion',     originalPrice: 220,    dealPrice: 149,   discountPercent: 32, expiresIso: '2026-07-10T00:00:00.000Z', color: '196, 132, 252' },
  { id: 'skillet',    name: 'Cast Iron Skillet Set',     emoji: '🍳', category: 'Home',        originalPrice: 89.99,  dealPrice: 54.99, discountPercent: 39, expiresIso: '2026-07-13T00:00:00.000Z', color: '255, 159, 10' },
  { id: 'serum',      name: 'Vitamin C Serum Duo',       emoji: '✨', category: 'Beauty',      originalPrice: 58,     dealPrice: 32,    discountPercent: 45, expiresIso: '2026-07-09T00:00:00.000Z', color: '255, 122, 165' },
  { id: 'getaway',    name: 'Weekend City Getaway',      emoji: '🏙️', category: 'Travel',      originalPrice: 499,    dealPrice: 349,   discountPercent: 30, expiresIso: '2026-07-18T00:00:00.000Z', color: '52, 199, 89' },
  { id: 'coffee',     name: 'Artisan Coffee Subscription', emoji: '☕', category: 'Food',      originalPrice: 45,     dealPrice: 29,    discountPercent: 36, expiresIso: '2026-07-11T00:00:00.000Z', color: '196, 132, 90' },
  { id: 'tv',         name: '4K Smart TV 55"',           emoji: '📺', category: 'Electronics', originalPrice: 649,    dealPrice: 429,   discountPercent: 34, expiresIso: '2026-07-08T12:00:00.000Z', color: '100, 200, 255' },
  { id: 'shoes',      name: 'Running Shoes',             emoji: '👟', category: 'Fashion',     originalPrice: 140,    dealPrice: 89,    discountPercent: 36, expiresIso: '2026-07-15T00:00:00.000Z', color: '196, 132, 252' },
  { id: 'diffuser',   name: 'Aromatherapy Diffuser',     emoji: '🕯️', category: 'Home',        originalPrice: 39.99,  dealPrice: 24.99, discountPercent: 38, expiresIso: '2026-07-12T00:00:00.000Z', color: '255, 159, 10' },
];
