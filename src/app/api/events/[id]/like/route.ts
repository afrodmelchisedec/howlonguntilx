// FILE: src/app/api/events/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    select: { likeCount: true },
  });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.like.findUnique({
      where: { userId_eventId: { userId: session.user.id, eventId: params.id } },
    });
    liked = Boolean(existing);
  }

  return NextResponse.json({ likeCount: event.likeCount, liked });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const userId = session.user.id;
  const eventId = params.id;

  const existing = await prisma.like.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.$transaction([
      prisma.like.delete({ where: { id: existing.id } }),
      prisma.event.update({ where: { id: eventId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    liked = false;
  } else {
    await prisma.$transaction([
      prisma.like.create({ data: { userId, eventId } }),
      prisma.event.update({ where: { id: eventId }, data: { likeCount: { increment: 1 } } }),
    ]);
    liked = true;
  }

  const updated = await prisma.event.findUnique({ where: { id: eventId }, select: { likeCount: true } });
  return NextResponse.json({ likeCount: updated?.likeCount ?? 0, liked });
}
