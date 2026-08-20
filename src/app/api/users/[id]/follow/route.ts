// FILE: src/app/api/users/[id]/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDefaultFollowTargetId } from '@/lib/userFollow';

// POST — follow the target user (params.id). Idempotent.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const targetId = params.id;
  if (targetId === session.user.id) {
    return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    await prisma.userFollow.create({
      data: { followerId: session.user.id, followingId: targetId },
    });
  } catch (err: any) {
    if (err?.code !== 'P2002') throw err; // already following — fine, idempotent
  }

  const followerCount = await prisma.userFollow.count({ where: { followingId: targetId } });
  return NextResponse.json({ following: true, followerCount });
}

// DELETE — unfollow the target user. Blocked for the permanent default-follow account.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const targetId = params.id;

  const defaultTargetId = await getDefaultFollowTargetId();
  if (defaultTargetId && defaultTargetId === targetId) {
    return NextResponse.json(
      { error: "This account can't be unfollowed." },
      { status: 403 }
    );
  }

  await prisma.userFollow.deleteMany({
    where: { followerId: session.user.id, followingId: targetId },
  });

  const followerCount = await prisma.userFollow.count({ where: { followingId: targetId } });
  return NextResponse.json({ following: false, followerCount });
}

// GET — follow state + counts for the target user, from the current viewer's perspective.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const targetId = params.id;

  const [followerCount, followingCount, viewerFollow] = await Promise.all([
    prisma.userFollow.count({ where: { followingId: targetId } }),
    prisma.userFollow.count({ where: { followerId: targetId } }),
    session?.user?.id
      ? prisma.userFollow.findUnique({
          where: { followerId_followingId: { followerId: session.user.id, followingId: targetId } },
          select: { id: true },
        })
      : null,
  ]);

  const defaultTargetId = await getDefaultFollowTargetId();

  return NextResponse.json({
    followerCount,
    followingCount,
    following: !!viewerFollow,
    isImmutable: defaultTargetId === targetId,
  });
}
