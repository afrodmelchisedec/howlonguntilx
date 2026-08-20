'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FollowButton } from './FollowButton';

interface ListUser {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

export function FollowListModal({
  userId, initialMode, onClose,
}: { userId: string; initialMode: 'followers' | 'following'; onClose: () => void }) {
  const [mode, setMode] = useState<'followers' | 'following'>(initialMode);
  const [users, setUsers] = useState<ListUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/users/' + userId + '/follow-list?mode=' + mode)
      .then(res => res.json())
      .then(data => { if (!cancelled) setUsers(data.users || []); })
      .catch(() => { if (!cancelled) setUsers([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId, mode]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-scrim"
      onClick={onClose}
    >
      <div
        className="ios-card anim-scale-in flex flex-col"
        style={{ width: 380, maxHeight: '70vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center border-b" style={{ borderColor: 'var(--border-hairline)' }}>
          <button
            onClick={() => setMode('followers')}
            className="flex-1 py-3 text-sm font-semibold"
            style={{ color: mode === 'followers' ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: mode === 'followers' ? '2px solid var(--brand-500, #534AB7)' : '2px solid transparent' }}
          >
            Followers
          </button>
          <button
            onClick={() => setMode('following')}
            className="flex-1 py-3 text-sm font-semibold"
            style={{ color: mode === 'following' ? 'var(--text-primary)' : 'var(--text-tertiary)', borderBottom: mode === 'following' ? '2px solid var(--brand-500, #534AB7)' : '2px solid transparent' }}
          >
            Following
          </button>
          <button onClick={onClose} className="px-4 text-lg" style={{ color: 'var(--text-tertiary)' }} aria-label="Close">×</button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {loading ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-tertiary)' }}>
              {mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
            </p>
          ) : (
            users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-2 py-2">
                <Link href={u.username ? '/u/' + u.username : '#'} className="flex items-center gap-3 min-w-0 flex-1" onClick={onClose}>
                  {u.image ? (
                    <img src={u.image} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
                      {(u.name ?? u.username ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.name ?? u.username}</p>
                    {u.username && <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>@{u.username}</p>}
                  </div>
                </Link>
                <FollowButton userId={u.id} immutableLabel />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
