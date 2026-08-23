// FILE: src/app/u/[username]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ProfileFollowStats } from '@/components/community/ProfileFollowStats';
import { CommunityFeedCard } from '@/components/community/CommunityFeedCard';

interface Props { params: { username: string } }

async function getProfile(username: string) {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true, username: true, name: true, image: true, createdAt: true,
      _count: { select: { followers: true, following: true } },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await getProfile(params.username);
  if (!user) return {};
  return { title: (user.name ?? user.username) + ' (@' + user.username + ') — HowLongUntilX' };
}

export default async function ProfilePage({ params }: Props) {
  const user = await getProfile(params.username);
  if (!user) notFound();

  // Blocked users' profiles stay fully visible (Phase 8.5 resolved
  // decision 2) — no special-casing here. Their PUBLIC UserEvents list
  // naturally comes back empty via the same author.blockedAt: null
  // filter already used everywhere else (feed, search, embed widget) —
  // nothing extra to do for that case.
  const rows = await prisma.userEvent.findMany({
    where: {
      authorId: user.id,
      visibility: 'PUBLIC',
      moderationStatus: 'APPROVED',
      author: { blockedAt: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 24,
    select: {
      id: true, slug: true, title: true, description: true, targetDate: true, images: true,
      likeCount: true, shareCount: true, commentCount: true, viewCount: true,
      author: { select: { id: true, name: true, username: true, image: true } },
      category: { select: { slug: true, name: true, emoji: true } },
    },
  });

  const events = rows.map(r => ({
    ...r,
    targetDate: r.targetDate.toISOString(),
    images: Array.isArray(r.images) ? (r.images as string[]) : null,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-4 mb-8">
        {user.image ? (
          <img src={user.image} alt={user.name ?? user.username ?? ''} className="w-16 h-16 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
            {(user.name ?? user.username ?? '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate" style={{ color: 'var(--text-primary)' }}>{user.name ?? user.username}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>@{user.username}</p>
          <ProfileFollowStats
            userId={user.id}
            initialFollowerCount={user._count.followers}
            initialFollowingCount={user._count.following}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Community events{events.length > 0 ? ' (' + events.length + ')' : ''}
      </h2>
      {events.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>No public events yet.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
          {events.map((item, i) => (
            <CommunityFeedCard key={item.id} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
