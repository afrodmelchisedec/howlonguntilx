'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FollowButton } from './FollowButton';
import { FollowListModal } from './FollowListModal';

export interface SummaryUser {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
}

export function UserSummaryCard({ user, children }: { user: SummaryUser; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState<{ followerCount: number; followingCount: number } | null>(null);
  const [listMode, setListMode] = useState<'followers' | 'following' | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!open || counts) return;
    let cancelled = false;
    fetch('/api/users/' + user.id + '/follow')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        setCounts({ followerCount: data.followerCount ?? 0, followingCount: data.followingCount ?? 0 });
      })
      .catch(() => { if (!cancelled) setCounts({ followerCount: 0, followingCount: 0 }); });
    return () => { cancelled = true; };
  }, [open, counts, user.id]);

  function show() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  }
  function hideDelayed() {
    timeoutRef.current = setTimeout(() => setOpen(false), 200);
  }

  const profileHref = user.username ? '/u/' + user.username : undefined;

  return (
    <div ref={ref} className="relative inline-block" onMouseEnter={show} onMouseLeave={hideDelayed}>
      <span onClick={() => setOpen(v => !v)} style={{ cursor: profileHref ? 'pointer' : 'default' }}>
        {children}
      </span>
      {open && (
        <div className="ios-card anim-scale-in absolute z-50 top-full left-0 mt-2 p-4"
          style={{ width: 260 }}
          onMouseEnter={show} onMouseLeave={hideDelayed}>
          <div className="flex items-center gap-3 mb-3">
            {user.image ? (
              <img src={user.image} alt={user.name ?? ''} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
                {(user.name ?? user.username ?? '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              {profileHref ? (
                <Link href={profileHref} className="font-semibold text-sm underline block truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.name ?? user.username}
                </Link>
              ) : (
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{user.name ?? 'Unknown'}</p>
              )}
              {user.username && <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>@{user.username}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            <button onClick={() => setListMode('followers')} className="hover:underline" style={{ cursor: 'pointer' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{counts ? counts.followerCount : '…'}</strong> followers
            </button>
            <button onClick={() => setListMode('following')} className="hover:underline" style={{ cursor: 'pointer' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{counts ? counts.followingCount : '…'}</strong> following
            </button>
          </div>
          <FollowButton userId={user.id} onChange={s => setCounts(prev => prev ? { ...prev, followerCount: s.followerCount } : prev)} />
        </div>
      )}
      {listMode && (
        <FollowListModal userId={user.id} initialMode={listMode} onClose={() => setListMode(null)} />
      )}
    </div>
  );
}
