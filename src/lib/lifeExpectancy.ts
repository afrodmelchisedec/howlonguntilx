// FILE: src/lib/lifeExpectancy.ts
//
// Core estimation engine for the Life Expectancy Calculator. Prefers real
// imported actuarial data (LifeExpectancyTable, via Prisma) and falls back
// to a mathematical approximation seeded from lifeExpectancySeed.ts when no
// real row exists yet for a given region/sex/age. See lifeExpectancySeed.ts
// for why the fallback exists and how to replace it with official data.

import { REGIONS, regionInfo, type Region } from './lifeExpectancySeed';

export type Sex = 'MALE' | 'FEMALE';

export interface Factors {
  smoking: boolean;        // current regular smoker
  heavyAlcohol: boolean;   // regular heavy drinking
  regularExercise: boolean;// 150+ min/week moderate activity
  obesity: boolean;        // BMI 30+
  diabetes: boolean;       // diagnosed, not well-controlled
  highBloodPressure: boolean; // diagnosed, untreated/uncontrolled
  familyLongevity: boolean;   // both parents/grandparents lived past 90
  higherEducation: boolean;   // bachelor's degree or above
}

export const DEFAULT_FACTORS: Factors = {
  smoking: false,
  heavyAlcohol: false,
  regularExercise: false,
  obesity: false,
  diabetes: false,
  highBloodPressure: false,
  familyLongevity: false,
  higherEducation: false,
};

// Each adjustment is a commonly-cited ROUGH average effect size from public
// health literature, deliberately conservative and rounded. These are NOT
// individualized clinical predictions — shown to users with that framing.
export const FACTOR_INFO: Record<
  keyof Factors,
  { label: string; emoji: string; years: number; note: string }
> = {
  smoking:            { label: 'Current smoker',            emoji: '🚬', years: -10, note: 'Long-term smokers lose ~10 years on average (US Surgeon General).' },
  heavyAlcohol:        { label: 'Heavy regular alcohol use',  emoji: '🍺', years: -5,  note: 'Sustained heavy drinking is linked to several fewer years on average.' },
  regularExercise:      { label: '150+ min/week exercise',    emoji: '🏃', years: 3,   note: 'Regular moderate activity adds a few years on average across studies.' },
  obesity:             { label: 'BMI 30+ (obesity)',          emoji: '⚖️', years: -4,  note: 'Obesity is linked to increased mortality risk in most cohort studies.' },
  diabetes:            { label: 'Diabetes (uncontrolled)',    emoji: '🩸', years: -6,  note: 'Poorly controlled diabetes meaningfully raises long-term mortality risk.' },
  highBloodPressure:   { label: 'High blood pressure',        emoji: '❤️‍🩹', years: -3,  note: 'Untreated hypertension is a major cardiovascular risk factor.' },
  familyLongevity:     { label: 'Family longevity',           emoji: '🧬', years: 2,   note: 'Parents/grandparents living past 90 is a modest positive signal.' },
  higherEducation:     { label: "Bachelor's degree+",         emoji: '🎓', years: 2,   note: 'Higher education correlates with longer average lifespan (SES gradient).' },
};

// Free users may activate exactly one factor at a time; this is enforced
// client-side for UX and re-validated server-side in the compute route.
export const FREE_FACTOR_LIMIT = 1;

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const ADULT_SPREAD_YEARS = 11; // approx std-dev of age-at-death for adults, used for the survival curve

/**
 * Approximate remaining-years-at-age curve calibrated to hit the region's
 * life-expectancy-at-birth. This is a smooth, monotonically-plausible curve,
 * not a real actuarial table — real per-age data from LifeExpectancyTable
 * always takes priority over this when present (see computeBaseline()).
 */
function approximateRemainingYears(le0: number, age: number): number {
  const naive = le0 - age;
  // Older survivors have already outlived those who died young, so their
  // remaining years decay a bit slower than a straight-line subtraction —
  // this correction grows with age to reflect that survivorship effect.
  const survivorshipBoost = 1 + Math.min(0.35, (age / 100) * 0.35);
  const remaining = Math.max(0.5, naive * survivorshipBoost * 0.82 + naive * 0.18);
  return Math.round(remaining * 10) / 10;
}

export interface BaselineResult {
  remainingYears: number;
  expectedAge: number;
  source: string;
  sourceYear: number;
  isRealData: boolean;
}

/**
 * `lookupRealTable` is an injected function (backed by Prisma in the API
 * route) so this module stays free of any DB dependency and can be unit
 * tested / reused client-side for instant preview calculations.
 */
export async function computeBaseline(
  region: Region,
  sex: Sex,
  age: number,
  lookupRealTable?: (region: Region, sex: Sex, age: number) => Promise<{ remainingYears: number; source: string; sourceYear: number } | null>
): Promise<BaselineResult> {
  if (lookupRealTable) {
    const real = await lookupRealTable(region, sex, age);
    if (real) {
      return {
        remainingYears: real.remainingYears,
        expectedAge: Math.round((age + real.remainingYears) * 10) / 10,
        source: real.source,
        sourceYear: real.sourceYear,
        isRealData: true,
      };
    }
  }
  const info = regionInfo(region);
  const le0 = info.lifeExpectancyAtBirth[sex];
  const remainingYears = approximateRemainingYears(le0, age);
  return {
    remainingYears,
    expectedAge: Math.round((age + remainingYears) * 10) / 10,
    source: `Approximate model calibrated to ${info.label} averages`,
    sourceYear: new Date().getFullYear(),
    isRealData: false,
  };
}

export function applyFactors(baselineExpectedAge: number, active: Partial<Factors>): {
  adjustedExpectedAge: number;
  totalAdjustment: number;
  breakdown: { key: keyof Factors; years: number }[];
} {
  const breakdown: { key: keyof Factors; years: number }[] = [];
  let total = 0;
  (Object.keys(FACTOR_INFO) as (keyof Factors)[]).forEach(key => {
    if (active[key]) {
      const years = FACTOR_INFO[key].years;
      total += years;
      breakdown.push({ key, years });
    }
  });
  // Clamp so lifestyle adjustments can't produce absurd results.
  const clamped = Math.max(-25, Math.min(10, total));
  const adjustedExpectedAge = Math.round((baselineExpectedAge + clamped) * 10) / 10;
  return { adjustedExpectedAge, totalAdjustment: clamped, breakdown };
}

// Standard normal CDF via Abramowitz-Stegun erf approximation — no external
// stats library needed for the "chance of living to age X" figures.
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

export function chanceOfReaching(targetAge: number, expectedAge: number, currentAge: number): number {
  if (targetAge <= currentAge) return 1;
  const z = (targetAge - expectedAge) / ADULT_SPREAD_YEARS;
  const p = 1 - normalCdf(z);
  return Math.max(0, Math.min(1, p));
}

export function targetDateFromNow(remainingYears: number): Date {
  return new Date(Date.now() + remainingYears * MS_PER_YEAR);
}

export function percentOfLifeLived(currentAge: number, expectedAge: number): number {
  if (expectedAge <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentAge / expectedAge) * 1000) / 10));
}

export interface RemainingBreakdown { years: number; months: number; weeks: number; days: number; hours: number; }
export function remainingBreakdown(targetDate: Date): RemainingBreakdown {
  const msLeft = Math.max(0, targetDate.getTime() - Date.now());
  return {
    years: Math.floor(msLeft / MS_PER_YEAR),
    months: Math.floor(msLeft / (MS_PER_YEAR / 12)),
    weeks: Math.floor(msLeft / (7 * 24 * 60 * 60 * 1000)),
    days: Math.floor(msLeft / (24 * 60 * 60 * 1000)),
    hours: Math.floor(msLeft / (60 * 60 * 1000)),
  };
}
