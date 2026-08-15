// FILE: src/app/api/tools/labor-onset-predictor/route.ts
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
  const config = await prisma.laborOnsetPredictorConfig.findUnique({
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

  const {
    mucusPlugDate, babyDropped, babyDroppedDate,
    waterBroke, waterBrokeDate, contractionLog,
    notifyOnThreshold, shareLink,
  } = body;

  try {
    const saved = await prisma.laborOnsetPredictorConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        mucusPlugDate: mucusPlugDate ? new Date(mucusPlugDate) : null,
        babyDropped: !!babyDropped,
        babyDroppedDate: babyDroppedDate ? new Date(babyDroppedDate) : null,
        waterBroke: !!waterBroke,
        waterBrokeDate: waterBrokeDate ? new Date(waterBrokeDate) : null,
        contractionLog: contractionLog ?? [],
        notifyOnThreshold: !!notifyOnThreshold,
        shareLink: shareLink ?? null,
      },
      update: {
        mucusPlugDate: mucusPlugDate ? new Date(mucusPlugDate) : null,
        babyDropped: !!babyDropped,
        babyDroppedDate: babyDroppedDate ? new Date(babyDroppedDate) : null,
        waterBroke: !!waterBroke,
        waterBrokeDate: waterBrokeDate ? new Date(waterBrokeDate) : null,
        contractionLog: contractionLog ?? [],
        notifyOnThreshold: !!notifyOnThreshold,
        shareLink: shareLink ?? null,
      },
    });
    return NextResponse.json({ config: saved });
  } catch (err) {
    console.error('Labor onset predictor config save error:', err);
    return NextResponse.json({ error: 'Could not save profile' }, { status: 500 });
  }
}
