// FILE: src/app/api/tools/life-expectancy/compute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  computeBaseline, applyFactors, chanceOfReaching, targetDateFromNow,
  percentOfLifeLived, DEFAULT_FACTORS, FREE_FACTOR_LIMIT, type Factors, type Sex,
} from '@/lib/lifeExpectancy';
import type { Region } from '@/lib/lifeExpectancySeed';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const VALID_REGIONS: Region[] = ['US', 'EUROPE', 'AFRICA', 'MIDDLE_EAST', 'CHINA', 'INDIA'];

async function lookupRealTable(region: Region, sex: Sex, age: number) {
  // Real per-age data always wins over the approximate seed model. Pulls the
  // most recent sourceYear available for this region+sex+age, interpolating
  // from the nearest ages on either side if the exact age isn't in the table
  // (useful right after a partial CRUD import that doesn't cover every age yet).
  const exact = await prisma.lifeExpectancyTable.findFirst({
    where: { region, sex, age },
    orderBy: { sourceYear: 'desc' },
  });
  if (exact) return { remainingYears: exact.remainingYears, source: exact.source, sourceYear: exact.sourceYear };

  const [below, above] = await Promise.all([
    prisma.lifeExpectancyTable.findFirst({ where: { region, sex, age: { lt: age } }, orderBy: [{ age: 'desc' }, { sourceYear: 'desc' }] }),
    prisma.lifeExpectancyTable.findFirst({ where: { region, sex, age: { gt: age } }, orderBy: [{ age: 'asc' }, { sourceYear: 'desc' }] }),
  ]);
  if (below && above) {
    const span = above.age - below.age;
    const t = span === 0 ? 0 : (age - below.age) / span;
    const remainingYears = below.remainingYears + (above.remainingYears - below.remainingYears) * t;
    return { remainingYears: Math.round(remainingYears * 10) / 10, source: below.source, sourceYear: below.sourceYear };
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const region = body.region as Region;
  const sex = body.sex as Sex;
  const age = Number(body.age);
  const requestedFactors: Partial<Factors> = body.factors ?? {};

  if (!VALID_REGIONS.includes(region)) {
    return NextResponse.json({ error: `region must be one of ${VALID_REGIONS.join(', ')}` }, { status: 400 });
  }
  if (sex !== 'MALE' && sex !== 'FEMALE') {
    return NextResponse.json({ error: 'sex must be MALE or FEMALE' }, { status: 400 });
  }
  if (!Number.isFinite(age) || age < 0 || age > 110) {
    return NextResponse.json({ error: 'age must be between 0 and 110' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  // Server-side re-validation of the free-tier factor limit — the client
  // enforces this for UX, but a direct API call shouldn't be able to bypass it.
  const activeKeys = (Object.keys(requestedFactors) as (keyof Factors)[]).filter(k => requestedFactors[k]);
  const factors: Partial<Factors> = { ...DEFAULT_FACTORS };
  if (isPro) {
    activeKeys.forEach(k => { factors[k] = true; });
  } else {
    activeKeys.slice(0, FREE_FACTOR_LIMIT).forEach(k => { factors[k] = true; });
  }

  try {
    const baseline = await computeBaseline(region, sex, age, lookupRealTable);
    const { adjustedExpectedAge, totalAdjustment, breakdown } = applyFactors(baseline.expectedAge, factors);
    const remainingYears = Math.max(0.1, adjustedExpectedAge - age);
    const targetDate = targetDateFromNow(remainingYears);

    return NextResponse.json({
      baseline,
      adjustedExpectedAge,
      totalAdjustment,
      breakdown,
      remainingYears: Math.round(remainingYears * 10) / 10,
      targetDate: targetDate.toISOString(),
      percentLifeLived: percentOfLifeLived(age, adjustedExpectedAge),
      chance90: Math.round(chanceOfReaching(90, adjustedExpectedAge, age) * 100),
      chance100: Math.round(chanceOfReaching(100, adjustedExpectedAge, age) * 100),
      appliedFactors: activeKeys,
      wasFactorLimited: !isPro && activeKeys.length > FREE_FACTOR_LIMIT,
    });
  } catch (err) {
    console.error('Life expectancy compute error:', err);
    return NextResponse.json({ error: 'Could not compute estimate' }, { status: 500 });
  }
}
