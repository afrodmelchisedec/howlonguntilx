// FILE: src/lib/eggHatchSpecies.ts
// Incubation data for common backyard poultry (INCUBATOR mode — turning/
// lockdown/gauge apply) and wild nesting species (WILD_NEST mode — parent
// bird incubates; humans should not intervene with wild eggs).

export type EggMode = 'INCUBATOR' | 'WILD_NEST';
export type IncubatorType = 'STILL_AIR' | 'FORCED_AIR';

export interface EggSpecies {
  id: string;
  emoji: string;
  label: string;
  mode: EggMode;
  incubationDays: number;       // point estimate used for countdown/ring
  rangeDays: [number, number];
  lockdownDays?: number;        // incubator-mode only — final no-turn days before hatch
  tempStillAirF?: number;
  tempForcedAirF?: number;
  humidityIncubation?: number;  // % — incubator-mode only
  humidityLockdown?: number;    // % — incubator-mode only
  blurb: string;
}

export const EGG_SPECIES: EggSpecies[] = [
  { id: 'CHICKEN', emoji: '🐔', label: 'Chicken', mode: 'INCUBATOR', incubationDays: 21, rangeDays: [20, 21],
    lockdownDays: 3, tempStillAirF: 101.5, tempForcedAirF: 99.5, humidityIncubation: 45, humidityLockdown: 65,
    blurb: 'The classic backyard incubation project — 21 days start to finish.' },
  { id: 'DUCK', emoji: '🦆', label: 'Duck', mode: 'INCUBATOR', incubationDays: 28, rangeDays: [27, 28],
    lockdownDays: 3, tempStillAirF: 101.5, tempForcedAirF: 99.5, humidityIncubation: 55, humidityLockdown: 70,
    blurb: 'Common breeds (not Muscovy, which run closer to 35 days) hatch around 28 days.' },
  { id: 'GOOSE', emoji: '🪿', label: 'Goose', mode: 'INCUBATOR', incubationDays: 29, rangeDays: [28, 30],
    lockdownDays: 3, tempStillAirF: 101.5, tempForcedAirF: 99.5, humidityIncubation: 55, humidityLockdown: 75,
    blurb: 'Geese need higher lockdown humidity than chickens or ducks — their eggs are more prone to drying out.' },
  { id: 'BLUEBIRD', emoji: '🐦', label: 'Bluebird', mode: 'WILD_NEST', incubationDays: 13, rangeDays: [12, 14],
    blurb: 'The female alone incubates, starting once the full clutch is laid, so all eggs hatch within a day of each other.' },
  { id: 'DOVE', emoji: '🕊️', label: 'Dove', mode: 'WILD_NEST', incubationDays: 14, rangeDays: [13, 15],
    blurb: 'Both parents share incubation duty in shifts — male by day, female overnight.' },
  { id: 'EAGLE', emoji: '🦅', label: 'Eagle', mode: 'WILD_NEST', incubationDays: 35, rangeDays: [34, 38],
    blurb: 'Bald eagles take the longest of any species here — both parents incubate in shifts for about 5 weeks.' },
  { id: 'HOUSE_FINCH', emoji: '🐤', label: 'House Finch', mode: 'WILD_NEST', incubationDays: 13, rangeDays: [12, 14],
    blurb: 'Common backyard nesters — the female incubates almost exclusively while the male feeds her.' },
  { id: 'GENERIC_BIRD', emoji: '🥚', label: 'Bird (general / unsure of species)', mode: 'WILD_NEST', incubationDays: 13, rangeDays: [11, 16],
    blurb: 'Most small songbirds fall in the 11–16 day range — pick a specific species above if you know it for a tighter estimate.' },
];

export function turningPlan(species: EggSpecies) {
  if (species.mode !== 'INCUBATOR' || !species.lockdownDays) return null;
  const turnUntilDay = species.incubationDays - species.lockdownDays;
  return { turnUntilDay, lockdownStartsDay: turnUntilDay + 1, hatchDay: species.incubationDays };
}
