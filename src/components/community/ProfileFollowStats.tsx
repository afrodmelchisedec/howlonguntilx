'use client';
import { useState } from 'react';
import { FollowButton } from './FollowButton';
import { FollowListModal } from './FollowListModal';

export function ProfileFollowStats({
  userId, initialFollowerCount, initialFollowingCount,
}: { userId: string; initialFollowerCount: number; initialFollowingCount: number }) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [modalMode, setModalMode] = useState<'followers' | 'following' | null>(null);

  return (
    <>
      <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
        <button onClick={() => setModalMode('followers')} className="hover:underline" style={{ cursor: 'pointer' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{followerCount}</strong> followers
        </button>
        <button onClick={() => setModalMode('following')} className="hover:underline" style={{ cursor: 'pointer' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{initialFollowingCount}</strong> following
        </button>
      </div>
      <FollowButton userId={userId} onChange={s => setFollowerCount(s.followerCount)} />
      {modalMode && (
        <FollowListModal userId={userId} initialMode={modalMode} onClose={() => setModalMode(null)} />
      )}
    </>
  );
}
