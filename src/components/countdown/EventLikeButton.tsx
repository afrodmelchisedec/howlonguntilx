// FILE: src/components/countdown/EventLikeButton.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export function EventLikeButton({ eventId, glow }: { eventId: string; glow: string }) {
  const { status } = useSession();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/events/${eventId}/like`)
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        setLiked(Boolean(data.liked));
        setLikeCount(typeof data.likeCount === 'number' ? data.likeCount : 0);
      })
      .catch(() => {
        if (!cancelled) setLikeCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function handleClick() {
    if (status !== 'authenticated') {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
      return;
    }
    if (pending) return;

    const prevLiked = liked;
    const prevCount = likeCount ?? 0;
    setPending(true);
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);

    try {
      const res = await fetch(`/api/events/${eventId}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Like request failed');
      const data = await res.json();
      setLiked(Boolean(data.liked));
      setLikeCount(typeof data.likeCount === 'number' ? data.likeCount : prevCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-caption inline-flex items-center gap-1"
      style={{
        color: liked ? `rgb(${glow})` : 'var(--text-secondary)',
        background: liked ? `rgba(${glow}, 0.1)` : 'transparent',
        border: `1px solid ${liked ? `rgba(${glow}, 0.25)` : 'var(--border-secondary, rgba(255,255,255,0.12))'}`,
        borderRadius: '999px',
        padding: '2px 10px',
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.7 : 1,
      }}
      aria-pressed={liked}
      aria-label={liked ? 'Unlike this event' : 'Like this event'}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={liked ? `rgb(${glow})` : 'none'}
        stroke={liked ? `rgb(${glow})` : 'currentColor'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {likeCount === null ? '\u00A0' : likeCount}
    </button>
  );
}
