// FILE: src/app/api/tools/upcoming-events/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getToolEvents } from '@/lib/toolEvents';

export async function GET() {
  const events = await getToolEvents('tech');
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ watchlist: [], events });
  const config = await prisma.techEventsConfig.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ watchlist: config?.watchlist ?? [], events });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const isPro = Boolean((session.user as any).isPro);
  if (!isPro) return NextResponse.json({ error: 'Pro required to save a watchlist' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.watchlist)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const config = await prisma.techEventsConfig.upsert({
    where: { userId: session.user.id },
    update: { watchlist: body.watchlist },
    create: { userId: session.user.id, watchlist: body.watchlist },
  });
  return NextResponse.json({ watchlist: config.watchlist });
}
