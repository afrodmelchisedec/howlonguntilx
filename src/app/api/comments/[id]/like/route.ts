// FILE: src/app/api/comments/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const comment = await prisma.comment.findUnique({
    where: { id: params.id },
    select: { likeCount: true },
  });
  if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: session.user.id, commentId: params.id } },
    });
    liked = Boolean(existing);
  }
  return NextResponse.json({ likeCount: comment.likeCount, liked });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }
  const userId = session.user.id;
  const commentId = params.id;
  const existing = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  let liked: boolean;
  if (existing) {
    await prisma.$transaction([
      prisma.commentLike.delete({ where: { id: existing.id } }),
      prisma.comment.update({ where: { id: commentId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    liked = false;
  } else {
    await prisma.$transaction([
      prisma.commentLike.create({ data: { userId, commentId } }),
      prisma.comment.update({ where: { id: commentId }, data: { likeCount: { increment: 1 } } }),
    ]);
    liked = true;
  }
  const updated = await prisma.comment.findUnique({ where: { id: commentId }, select: { likeCount: true } });
  return NextResponse.json({ likeCount: updated?.likeCount ?? 0, liked });
}
