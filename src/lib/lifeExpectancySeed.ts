// FILE: src/lib/lifeExpectancySeed.ts
//
// ⚠️ PLACEHOLDER BASELINE DATA — read this before shipping.
//
// These are rounded, illustrative life-expectancy-AT-BIRTH figures per
// region/sex, sourced from general UN/WHO-range public knowledge. They are
// NOT official per-age actuarial tables and should NOT be presented to users
// as precise or as coming from CDC/UN directly — they exist so the calculator
// is fully functional on day one, using a mathematical curve (see
// lifeExpectancy.ts) to approximate remaining-years-by-age from this baseline.
//
// Replace this with real data as soon as possible via the admin CRUD import
// at /api/admin/life-expectancy — once real rows exist in LifeExpectancyTable
// for a given region+sex+age+year, the compute engine uses those instead of
// this fallback automatically. Official sources to import from:
//
//   United States (age-by-age, most precise):
//     CDC NCHS United States Life Tables — https://www.cdc.gov/nchs/products/life_tables.htm
//     SSA Actuarial Life Table          — https://www.ssa.gov/oact/STATS/table4c6.html
//     CDC USALEEP (state/county/tract)  — https://www.cdc.gov/nchs/nvss/usaleep/usaleep.html
//
//   Every other country/region (age-by-age, covers Europe/Africa/Middle East/
//   China/India and everywhere else):
//     UN World Population Prospects, abridged life tables
//       https://population.un.org/wpp/Download/Standard/Mortality/
//     WHO Global Health Observatory, life tables by country
//       https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates
//
// Both UN WPP and WHO GHO publish downloadable CSV/Excel life tables by
// country, sex, and age — exactly the shape LifeExpectancyTable expects.

export type Region = 'US' | 'EUROPE' | 'AFRICA' | 'MIDDLE_EAST' | 'CHINA' | 'INDIA';

export interface RegionInfo {
  id: Region;
  label: string;
  flag: string;
  lifeExpectancyAtBirth: { MALE: number; FEMALE: number };
}

export const REGIONS: RegionInfo[] = [
  { id: 'US',          label: 'United States',        flag: '🇺🇸', lifeExpectancyAtBirth: { MALE: 74.8, FEMALE: 80.2 } },
  { id: 'EUROPE',      label: 'Europe (EU average)',  flag: '🇪🇺', lifeExpectancyAtBirth: { MALE: 78.5, FEMALE: 84.0 } },
  { id: 'AFRICA',      label: 'Africa (average)',     flag: '🌍', lifeExpectancyAtBirth: { MALE: 62.0, FEMALE: 65.5 } },
  { id: 'MIDDLE_EAST', label: 'Middle East (average)',flag: '🌙', lifeExpectancyAtBirth: { MALE: 72.5, FEMALE: 76.5 } },
  { id: 'CHINA',       label: 'China',                flag: '🇨🇳', lifeExpectancyAtBirth: { MALE: 75.0, FEMALE: 80.5 } },
  { id: 'INDIA',       label: 'India',                flag: '🇮🇳', lifeExpectancyAtBirth: { MALE: 68.0, FEMALE: 71.0 } },
];

export function regionInfo(region: Region): RegionInfo {
  return REGIONS.find(r => r.id === region) ?? REGIONS[0];
}
