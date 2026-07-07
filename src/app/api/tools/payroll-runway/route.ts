// FILE: src/app/api/tools/payroll-runway/route.ts
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

  const config = await prisma.payrollConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? {
      frequency: config.frequency,
      lastPayDate: config.lastPayDate,
      grossPerPeriod: config.grossPerPeriod,
      startingBalance: config.startingBalance,
      deductions: config.deductions,
      bills: config.bills,
    } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (typeof body.frequency !== 'string' || typeof body.grossPerPeriod !== 'number' || !Array.isArray(body.bills)) {
    return NextResponse.json({ error: 'frequency, grossPerPeriod, and bills are required' }, { status: 400 });
  }

  const config = await prisma.payrollConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      frequency: body.frequency,
      lastPayDate: new Date(body.lastPayDate),
      grossPerPeriod: body.grossPerPeriod,
      startingBalance: body.startingBalance ?? 0,
      deductions: body.deductions,
      bills: body.bills,
    },
    update: {
      frequency: body.frequency,
      lastPayDate: new Date(body.lastPayDate),
      grossPerPeriod: body.grossPerPeriod,
      startingBalance: body.startingBalance ?? 0,
      deductions: body.deductions,
      bills: body.bills,
    },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
