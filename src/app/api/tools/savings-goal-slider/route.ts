// FILE: src/app/api/tools/savings-goal-slider/route.ts
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

  const config = await prisma.savingsGoalConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? { monthlyTotal: config.monthlyTotal, goals: config.goals } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (typeof body.monthlyTotal !== 'number' || !Array.isArray(body.goals)) {
    return NextResponse.json({ error: 'monthlyTotal and goals are required' }, { status: 400 });
  }

  const config = await prisma.savingsGoalConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, monthlyTotal: body.monthlyTotal, goals: body.goals },
    update: { monthlyTotal: body.monthlyTotal, goals: body.goals },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
