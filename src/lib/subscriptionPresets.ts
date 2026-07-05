// FILE: src/lib/subscriptionPresets.ts
export interface SubscriptionPreset {
  name: string;
  emoji: string;
  amount: number;
  color: string; // "r, g, b"
}

export const SUBSCRIPTION_PRESETS: SubscriptionPreset[] = [
  { name: 'Netflix',       emoji: '🎬', amount: 15.99, color: '255, 69, 58' },
  { name: 'Spotify',       emoji: '🎧', amount: 10.99, color: '88, 214, 113' },
  { name: 'Disney+',       emoji: '🏰', amount: 13.99, color: '100, 200, 255' },
  { name: 'Amazon Prime',  emoji: '📦', amount: 14.99, color: '255, 180, 100' },
  { name: 'Gym',           emoji: '💪', amount: 29.99, color: '196, 132, 252' },
  { name: 'Cloud Storage', emoji: '☁️', amount: 9.99,  color: '134, 168, 255' },
  { name: 'Adobe CC',      emoji: '🎨', amount: 54.99, color: '255, 122, 165' },
  { name: 'YouTube Premium', emoji: '▶️', amount: 13.99, color: '255, 90, 90' },
  { name: 'iCloud+',       emoji: '📱', amount: 2.99,  color: '120, 220, 200' },
  { name: 'Custom',        emoji: '💳', amount: 9.99,  color: '250, 128, 114' },
];
