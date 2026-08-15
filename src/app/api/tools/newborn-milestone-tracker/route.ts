// FILE: src/app/api/tools/newborn-milestone-tracker/route.ts
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
  const config = await prisma.newbornMilestoneTrackerConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ config });
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

  const { birthDate, weightEntries, lengthEntries, milestoneNotes, notifyOnMilestone, shareLink } = body;

  try {
    const saved = await prisma.newbornMilestoneTrackerConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        birthDate: birthDate ? new Date(birthDate) : null,
        weightEntries: weightEntries ?? [],
        lengthEntries: lengthEntries ?? [],
        milestoneNotes: milestoneNotes ?? [],
        notifyOnMilestone: !!notifyOnMilestone,
        shareLink: shareLink ?? null,
      },
      update: {
        birthDate: birthDate ? new Date(birthDate) : null,
        weightEntries: weightEntries ?? [],
        lengthEntries: lengthEntries ?? [],
        milestoneNotes: milestoneNotes ?? [],
        notifyOnMilestone: !!notifyOnMilestone,
        shareLink: shareLink ?? null,
      },
    });
    return NextResponse.json({ config: saved });
  } catch (err) {
    console.error('Newborn milestone tracker config save error:', err);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}
