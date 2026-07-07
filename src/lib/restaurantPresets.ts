// FILE: src/lib/restaurantPresets.ts
// Client-safe seed data for the Restaurant Launches tracker.

export interface RestaurantLaunch {
  id: string;
  name: string;
  emoji: string;
  cuisine: string;
  city: string;
  openDateIso: string;
  color: string;
  blurb: string;
  hype: number;
}

export const CUISINES = ['BBQ', 'Japanese', 'Italian', 'Indian', 'American', 'Mexican', 'Chinese', 'Steakhouse', 'Cafe'];

export const RESTAURANT_PRESETS: RestaurantLaunch[] = [
  { id: 'blaze-barrel',   name: 'Blaze & Barrel BBQ',   emoji: '🍖', cuisine: 'BBQ',        city: 'Austin, TX',        openDateIso: '2026-07-10T00:00:00.000Z', color: '255, 122, 60',  blurb: 'Slow-smoked brisket and a whiskey-barrel-aged sauce that took two years to perfect.', hype: 62 },
  { id: 'petal-bean',     name: 'Petal & Bean Cafe',    emoji: '☕', cuisine: 'Cafe',       city: 'Portland, OR',      openDateIso: '2026-07-09T00:00:00.000Z', color: '196, 132, 252', blurb: 'A flower-shop-meets-coffee-bar concept with single-origin pour-overs.', hype: 48 },
  { id: 'golden-wok',     name: 'Golden Wok',           emoji: '🥡', cuisine: 'Chinese',    city: 'San Francisco, CA', openDateIso: '2026-07-14T00:00:00.000Z', color: '255, 204, 0',   blurb: 'Wok-hei-forward street food from a chef trained in Chengdu.', hype: 71 },
  { id: 'mochi-cloud',    name: 'Mochi Cloud',          emoji: '🍡', cuisine: 'Japanese',   city: 'Seattle, WA',       openDateIso: '2026-07-25T00:00:00.000Z', color: '255, 122, 165', blurb: 'A dessert-forward izakaya known online for its viral mochi donuts.', hype: 85 },
  { id: 'nonnas-table',   name: "Nonna's Table",        emoji: '🍝', cuisine: 'Italian',    city: 'Boston, MA',        openDateIso: '2026-08-15T00:00:00.000Z', color: '88, 214, 113',  blurb: 'Handmade pasta, family recipes, and a wood-fired oven imported from Naples.', hype: 55 },
  { id: 'spice-route',    name: 'Spice Route Kitchen',  emoji: '🍛', cuisine: 'Indian',     city: 'Chicago, IL',       openDateIso: '2026-09-01T00:00:00.000Z', color: '255, 159, 10',  blurb: 'Regional Indian tasting menus that rotate every season.', hype: 39 },
  { id: 'copper-skillet', name: 'The Copper Skillet',   emoji: '🥘', cuisine: 'American',   city: 'Denver, CO',        openDateIso: '2026-10-03T00:00:00.000Z', color: '100, 200, 255', blurb: 'Elevated comfort food from a former line cook turned James Beard nominee.', hype: 33 },
  { id: 'brimstone-grill', name: 'Brimstone Grill',     emoji: '🥩', cuisine: 'Steakhouse', city: 'Miami, FL',         openDateIso: '2026-11-20T00:00:00.000Z', color: '255, 69, 58',   blurb: 'Dry-aged cuts finished over an open charcoal pit.', hype: 27 },
  { id: 'verde-taco',     name: 'Verde Taco Co.',       emoji: '🌮', cuisine: 'Mexican',    city: 'Phoenix, AZ',       openDateIso: '2026-06-20T00:00:00.000Z', color: '120, 220, 200', blurb: 'Already open! Hand-pressed tortillas and a rotating salsa bar.', hype: 91 },
];
