// FILE: src/app/api/tools/tech-events/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // TODO: adjust to your actual NextAuth options export path
import { prisma } from '@/lib/prisma'; // TODO: adjust to your actual Prisma client singleton path

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ watchlist: [] });

  const config = await prisma.techEventsConfig.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ watchlist: config?.watchlist ?? [] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // TODO: adjust to your actual Pro-status check (session field, DB lookup, etc.)
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
