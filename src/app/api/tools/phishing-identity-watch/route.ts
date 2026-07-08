// FILE: src/app/api/tools/phishing-identity-watch/route.ts
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

  const config = await prisma.phishingIdentityConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? { watchCategories: config.watchCategories, flagWeightOverrides: config.flagWeightOverrides, quizStats: config.quizStats } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (!Array.isArray(body.watchCategories)) {
    return NextResponse.json({ error: 'watchCategories must be an array' }, { status: 400 });
  }

  const config = await prisma.phishingIdentityConfig.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      watchCategories: body.watchCategories,
      flagWeightOverrides: body.flagWeightOverrides ?? {},
      quizStats: body.quizStats ?? {},
    },
    update: {
      watchCategories: body.watchCategories,
      flagWeightOverrides: body.flagWeightOverrides ?? {},
      quizStats: body.quizStats ?? {},
    },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
