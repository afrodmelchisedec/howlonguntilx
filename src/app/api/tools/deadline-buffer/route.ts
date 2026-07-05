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

  const config = await prisma.deadlineBufferConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? { daysOut: config.daysOut, phases: config.phases, holidays: config.holidays } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (typeof body.daysOut !== 'number' || !Array.isArray(body.phases) || !Array.isArray(body.holidays)) {
    return NextResponse.json({ error: 'daysOut, phases, and holidays are required' }, { status: 400 });
  }

  const config = await prisma.deadlineBufferConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, daysOut: body.daysOut, phases: body.phases, holidays: body.holidays },
    update: { daysOut: body.daysOut, phases: body.phases, holidays: body.holidays },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
