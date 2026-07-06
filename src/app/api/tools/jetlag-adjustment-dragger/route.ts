// FILE: src/app/api/tools/jetlag-adjustment-dragger/route.ts
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

  const config = await prisma.jetlagConfig.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json({
    config: config ? { homeBedtime: config.homeBedtime, destBedtime: config.destBedtime, prepDays: config.prepDays } : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isProSession(session)) return NextResponse.json({ error: 'Pro required' }, { status: 403 });

  const body = await req.json();
  if (typeof body.homeBedtime !== 'number' || typeof body.destBedtime !== 'number' || typeof body.prepDays !== 'number') {
    return NextResponse.json({ error: 'homeBedtime, destBedtime, and prepDays are required' }, { status: 400 });
  }

  const config = await prisma.jetlagConfig.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, homeBedtime: body.homeBedtime, destBedtime: body.destBedtime, prepDays: body.prepDays },
    update: { homeBedtime: body.homeBedtime, destBedtime: body.destBedtime, prepDays: body.prepDays },
  });

  return NextResponse.json({ ok: true, updatedAt: config.updatedAt });
}
