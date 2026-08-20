'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function FollowButton({ userId, onChange, immutableLabel }: { userId: string; onChange?: (state: { following: boolean; followerCount: number }) => void; immutableLabel?: boolean }) {
  const { status, data: session } = useSession();
  const [following, setFollowing] = useState(false);
  const [isImmutable, setIsImmutable] = useState(false);
  const [pending, setPending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/users/' + userId + '/follow')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        setFollowing(Boolean(data.following));
        setIsImmutable(Boolean(data.isImmutable));
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [userId]);

  if (!loaded || isImmutable || session?.user?.id === userId) return null;

  async function toggle() {
    if (status !== 'authenticated') {
      window.location.href = '/auth/signin?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (pending) return;

    const prevFollowing = following;
    setPending(true);
    setFollowing(!prevFollowing);

    try {
      const res = await fetch('/api/users/' + userId + '/follow', { method: prevFollowing ? 'DELETE' : 'POST' });
      if (!res.ok) throw new Error('Follow request failed');
      const data = await res.json();
      const nextFollowing = Boolean(data.following);
      setFollowing(nextFollowing);
      if (onChange && typeof data.followerCount === 'number') {
        onChange({ following: nextFollowing, followerCount: data.followerCount });
      }
    } catch {
      setFollowing(prevFollowing);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="text-sm font-medium px-4 py-1.5 rounded-full transition-colors flex-shrink-0"
      style={following ? {
        background: 'var(--bg-elevated-2)', color: 'var(--text-primary)', border: '1px solid var(--border-hairline)',
      } : {
        background: 'var(--brand-500, #534AB7)', color: '#fff', border: '1px solid transparent',
      }}
      aria-pressed={following}
    >
      {pending ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}
