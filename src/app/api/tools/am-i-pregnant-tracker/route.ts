// FILE: src/app/api/tools/am-i-pregnant-tracker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireProSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const isPro = session.user.plan === 'PRO' || session.user.role === 'ADMIN';
  return isPro ? session : null;
}

export async function GET() {
  const session = await requireProSession();
  if (!session) return NextResponse.json({ config: null });

  const config = await prisma.amIPregnantTrackerConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ config });
}

export async function POST(req: NextRequest) {
  const session = await requireProSession();
  if (!session) return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { lastPeriod, cycleLength, history, notifyOnTestDay, shareLink } = body;
  if (!lastPeriod || !Number.isFinite(cycleLength) || !Array.isArray(history)) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const saved = await prisma.amIPregnantTrackerConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        lastPeriod: new Date(lastPeriod),
        cycleLength, history,
        notifyOnTestDay: !!notifyOnTestDay,
        shareLink: shareLink ?? null,
      },
      update: {
        lastPeriod: new Date(lastPeriod),
        cycleLength, history,
        notifyOnTestDay: !!notifyOnTestDay,
        shareLink: shareLink ?? null,
      },
    });
    return NextResponse.json({ config: saved });
  } catch (err) {
    console.error('Am I pregnant tracker config save error:', err);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}
