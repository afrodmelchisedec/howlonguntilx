// FILE: src/app/api/tools/entertainment-watchlist/route.ts
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

  const config = await prisma.entertainmentConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({ config: config ? { items: config.items } : null });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items must be an array' }, { status: 400 });
  }

  const config = await prisma.entertainmentConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, items: body.items },
    update: { items: body.items },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
