// FILE: src/lib/userFollow.ts
import { prisma } from '@/lib/db';

/**
 * Auto-follows the site's designated default-follow account for a
 * newly created user, if one has been configured. Called from every
 * signup path (Credentials direct call, OAuth/Email via events.createUser)
 * so no path can silently skip it.
 *
 * Safe to call even if no DefaultFollowConfig row exists yet (no-op),
 * and safe against the very rare race where this runs twice for the
 * same user (unique constraint on [followerId, followingId] absorbs it).
 */
export async function autoFollowDefaultForNewUser(newUserId: string): Promise<void> {
  const config = await prisma.defaultFollowConfig.findFirst({
    select: { userId: true },
  });

  if (!config || config.userId === newUserId) {
    // No default set yet, OR the new user IS the default account itself
    // (shouldn't self-follow).
    return;
  }

  try {
    await prisma.userFollow.create({
      data: { followerId: newUserId, followingId: config.userId },
    });
  } catch (err: any) {
    // P2002 = unique constraint violation (already following) — safe no-op.
    if (err?.code !== 'P2002') throw err;
  }
}

/**
 * Returns the current default-follow target's userId, or null if unset.
 * Used by the follow/unfollow API to block unfollowing that specific account.
 */
export async function getDefaultFollowTargetId(): Promise<string | null> {
  const config = await prisma.defaultFollowConfig.findFirst({
    select: { userId: true },
  });
  return config?.userId ?? null;
}

export interface FollowListUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

/**
 * Followers of targetId (people who follow them), or people targetId
 * follows — same shape either way, direction controlled by `mode`.
 * Public data: no viewer-permission check here, callers decide.
 */
export async function getFollowList(targetId: string, mode: 'followers' | 'following'): Promise<FollowListUser[]> {
  const rows = mode === 'followers'
    ? await prisma.userFollow.findMany({
        where: { followingId: targetId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { follower: { select: { id: true, name: true, username: true, image: true } } },
      })
    : await prisma.userFollow.findMany({
        where: { followerId: targetId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { following: { select: { id: true, name: true, username: true, image: true } } },
      });

  return mode === 'followers'
    ? (rows as any[]).map(r => r.follower)
    : (rows as any[]).map(r => r.following);
}
