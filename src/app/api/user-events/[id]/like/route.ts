// FILE: src/app/api/user-events/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const event = await prisma.userEvent.findUnique({
    where: { id: params.id },
    select: { likeCount: true },
  });
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.userEventLike.findUnique({
      where: { userId_userEventId: { userId: session.user.id, userEventId: params.id } },
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
  const userEventId = params.id;

  const existing = await prisma.userEventLike.findUnique({
    where: { userId_userEventId: { userId, userEventId } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.$transaction([
      prisma.userEventLike.delete({ where: { id: existing.id } }),
      prisma.userEvent.update({ where: { id: userEventId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    liked = false;
  } else {
    await prisma.$transaction([
      prisma.userEventLike.create({ data: { userId, userEventId } }),
      prisma.userEvent.update({ where: { id: userEventId }, data: { likeCount: { increment: 1 } } }),
    ]);
    liked = true;
  }

  const updated = await prisma.userEvent.findUnique({ where: { id: userEventId }, select: { likeCount: true } });
  return NextResponse.json({ likeCount: updated?.likeCount ?? 0, liked });
}
