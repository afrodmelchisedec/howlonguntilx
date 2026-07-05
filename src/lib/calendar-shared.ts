// FILE: src/lib/calendar-shared.ts
// Client-safe types/constants only — no fs/path here.
// Anything imported by a 'use client' component must live in this file,
// not calendar.ts (which reads from disk and can only run server-side).

export interface CalendarEvent {
  region: string;
  event: string;
  description: string;
}

export const CALENDAR_REGIONS = ['united_states', 'europe', 'united_kingdom', 'africa', 'middle_east'] as const;

const REGION_LABELS: Record<string, string> = {
  united_states: 'United States',
  europe: 'Europe',
  united_kingdom: 'United Kingdom',
  africa: 'Africa',
  middle_east: 'Middle East',
};

const REGION_GLOW: Record<string, string> = {
  united_states: 'brand',
  europe: 'travel',
  united_kingdom: 'entertainment',
  africa: 'nature',
  middle_east: 'space',
};

export function prettifyRegion(region: string): string {
  return REGION_LABELS[region] ?? region;
}

export function getRegionGlow(region: string): string {
  return REGION_GLOW[region] ?? 'brand';
}
