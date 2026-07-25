// FILE: src/app/api/articles/[id]/like/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    select: { likeCount: true },
  });
  if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  let liked = false;
  if (session?.user?.id) {
    const existing = await prisma.articleLike.findUnique({
      where: { userId_articleId: { userId: session.user.id, articleId: params.id } },
    });
    liked = Boolean(existing);
  }

  return NextResponse.json({ likeCount: article.likeCount, liked });
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const userId = session.user.id;
  const articleId = params.id;

  const existing = await prisma.articleLike.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  let liked: boolean;
  if (existing) {
    await prisma.$transaction([
      prisma.articleLike.delete({ where: { id: existing.id } }),
      prisma.article.update({ where: { id: articleId }, data: { likeCount: { decrement: 1 } } }),
    ]);
    liked = false;
  } else {
    await prisma.$transaction([
      prisma.articleLike.create({ data: { userId, articleId } }),
      prisma.article.update({ where: { id: articleId }, data: { likeCount: { increment: 1 } } }),
    ]);
    liked = true;
  }

  const updated = await prisma.article.findUnique({ where: { id: articleId }, select: { likeCount: true } });
  return NextResponse.json({ likeCount: updated?.likeCount ?? 0, liked });
}
