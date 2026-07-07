// FILE: src/app/api/tools/money-milestones/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

function isProSession(session: any): boolean {
  return session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ config: null });

  const config = await prisma.moneyMilestonesConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? {
      startingBalance: config.startingBalance,
      monthlyContribution: config.monthlyContribution,
      growthRatePct: config.growthRatePct,
      horizonMonths: config.horizonMonths,
      milestones: config.milestones,
    } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (
    typeof body.startingBalance !== 'number' ||
    typeof body.monthlyContribution !== 'number' ||
    typeof body.growthRatePct !== 'number' ||
    typeof body.horizonMonths !== 'number' ||
    !Array.isArray(body.milestones)
  ) {
    return NextResponse.json({ error: 'startingBalance, monthlyContribution, growthRatePct, horizonMonths, and milestones are required' }, { status: 400 });
  }

  const config = await prisma.moneyMilestonesConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      startingBalance: body.startingBalance,
      monthlyContribution: body.monthlyContribution,
      growthRatePct: body.growthRatePct,
      horizonMonths: body.horizonMonths,
      milestones: body.milestones,
    },
    update: {
      startingBalance: body.startingBalance,
      monthlyContribution: body.monthlyContribution,
      growthRatePct: body.growthRatePct,
      horizonMonths: body.horizonMonths,
      milestones: body.milestones,
    },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
