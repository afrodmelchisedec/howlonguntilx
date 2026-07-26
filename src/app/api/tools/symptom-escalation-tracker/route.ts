// FILE: src/app/api/tools/symptom-escalation-tracker/route.ts
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

  const config = await prisma.symptomTrackerConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? { history: config.history } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (!Array.isArray(body.history)) {
    return NextResponse.json({ error: 'history is required' }, { status: 400 });
  }

  const config = await prisma.symptomTrackerConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, history: body.history },
    update: { history: body.history },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
