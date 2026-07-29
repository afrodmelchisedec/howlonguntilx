// FILE: src/app/api/tools/life-expectancy-calculator/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Matches the same GET/POST config pattern as your other Pro tools
// (e.g. /api/tools/symptom-escalation-tracker) — this is what lets the
// countdown timer persist across visits/devices for Pro users instead of
// resetting on reload.

async function requireProSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const isPro = session.user.plan === 'PRO' || session.user.role === 'ADMIN';
  return isPro ? session : null;
}

export async function GET() {
  const session = await requireProSession();
  if (!session) return NextResponse.json({ config: null });

  const profile = await prisma.lifeExpectancyProfile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ config: profile });
}

export async function POST(req: NextRequest) {
  const session = await requireProSession();
  if (!session) return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { region, age, sex, factors, familyMembers, expectedAge, targetDate } = body;
  if (!region || !sex || !Number.isFinite(age) || !Number.isFinite(expectedAge) || !targetDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const saved = await prisma.lifeExpectancyProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        region, age, sex, factors: factors ?? {}, familyMembers: familyMembers ?? null,
        expectedAge, targetDate: new Date(targetDate),
      },
      update: {
        region, age, sex, factors: factors ?? {}, familyMembers: familyMembers ?? null,
        expectedAge, targetDate: new Date(targetDate),
      },
    });
    return NextResponse.json({ config: saved });
  } catch (err) {
    console.error('Life expectancy profile save error:', err);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}
