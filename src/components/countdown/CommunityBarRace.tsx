'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

const BASE_EVENTS = [
  { name: 'FIFA World Cup 2026', emoji: '⚽', color: '64, 156, 255', base: 10432, slug: 'fifa-world-cup-2026' },
  { name: 'Christmas 2025', emoji: '🎄', color: '48, 219, 91', base: 8917, slug: 'christmas-2025' },
  { name: 'New Year 2027', emoji: '🎆', color: '125, 118, 255', base: 7234, slug: 'new-year-2027' },
  { name: 'Solar Eclipse 2026', emoji: '🌑', color: '218, 143, 255', base: 5891, slug: 'solar-eclipse-2026' },
  { name: 'Super Bowl LX', emoji: '🏈', color: '255, 75, 110', base: 4320, slug: 'super-bowl-lx' },
  { name: 'Apple WWDC 2026', emoji: '🍎', color: '100, 240, 235', base: 3102, slug: 'apple-wwdc-2026' },
  { name: 'Oscars 2026', emoji: '🏆', color: '255, 214, 10', base: 2847, slug: 'oscars-2026' },
  { name: 'Black Friday 2025', emoji: '🛍️', color: '255, 149, 0', base: 2341, slug: 'black-friday-2025' },
];

function formatCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export function CommunityBarRace() {
  const [counts, setCounts] = useState(BASE_EVENTS.map(e => e.base));
  const [sorted, setSorted] = useState(BASE_EVENTS.map((e, i) => ({ ...e, count: e.base, rank: i })));
  const [racing, setRacing] = useState(true);
  const [userVoted, setUserVoted] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!racing) return;
    intervalRef.current = setInterval(() => {
      setCounts(prev => {
        const next = prev.map((c, i) => {
          const boost = i === 0 ? 3 : i === 1 ? 2 : 1;
          return c + Math.floor(Math.random() * boost * 4);
        });
        const withCounts = BASE_EVENTS.map((e, i) => ({ ...e, count: next[i] }));
        const s = [...withCounts].sort((a, b) => b.count - a.count).map((e, rank) => ({ ...e, rank }));
        setSorted(s);
        return next;
      });
    }, 800);
    return () => clearInterval(intervalRef.current!);
  }, [racing]);

  function vote(idx: number) {
    setUserVoted(idx);
    setCounts(prev => {
      const next = [...prev];
      next[idx] += 500 + Math.floor(Math.random() * 200);
      return next;
    });
  }

  const max = Math.max(...sorted.map(e => e.count));

  return (
    <div className="ios-card overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <div>
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>LIVE · UPDATING EVERY SECOND</p>
          <p className="text-headline mt-0.5">How the world is counting</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full pulse-dot" style={{ background: 'rgb(255,75,110)', '--glow': '255,75,110' } as React.CSSProperties} />
          <button onClick={() => setRacing(r => !r)}
            className="press pill text-xs"
            style={{
              background: racing ? 'rgba(255,75,110,0.12)' : 'rgba(48,219,91,0.12)',
              color: racing ? 'rgb(255,75,110)' : 'rgb(48,219,91)',
              cursor: 'pointer', border: 'none',
            }}>
            {racing ? '⏸ Pause' : '▶ Live'}
          </button>
        </div>
      </div>

      {/* Bar race */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {sorted.map((ev) => {
          const pct = (ev.count / max) * 100;
          const origIdx = BASE_EVENTS.findIndex(e => e.slug === ev.slug);
          return (
            <div key={ev.slug}
              className="transition-all"
              style={{ transition: 'all 0.6s var(--ease-out)', order: ev.rank }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 16, minWidth: 20 }}>{ev.emoji}</span>
                  <span className="text-callout font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
                  {ev.rank === 0 && <span className="pill text-xs" style={{ background: 'rgba(255,214,10,0.15)', color: 'rgb(200,170,0)', fontSize: 9 }}>🏆 #1</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular text-callout font-black" style={{ color: `rgb(${ev.color})` }}>
                    {formatCount(ev.count)}
                  </span>
                  {userVoted !== origIdx && (
                    <button
                      onClick={() => vote(origIdx)}
                      className="press text-xs px-2 py-1 rounded-full font-semibold"
                      style={{
                        background: `rgba(${ev.color}, 0.1)`,
                        color: `rgb(${ev.color})`,
                        border: `1px solid rgba(${ev.color}, 0.25)`,
                        cursor: 'pointer',
                      }}>
                      +1
                    </button>
                  )}
                  {userVoted === origIdx && (
                    <span className="text-xs" style={{ color: `rgb(${ev.color})` }}>✓ voted</span>
                  )}
                </div>
              </div>

              {/* Bar */}
              <div className="progress-track" style={{ height: 8 }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, rgba(${ev.color},0.5), rgb(${ev.color}))`,
                    transition: 'width 0.7s var(--ease-out)',
                    height: '100%',
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="mx-5 mb-5 mt-1 p-4 rounded-2xl text-center" style={{ background: 'var(--bg-elevated-2)', border: '1px solid var(--border-hairline)' }}>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          Join <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCount(sorted.reduce((a, b) => a + b.count, 0))}</span> people tracking these events
        </p>
        <Link href="/auth/signup"
          className="btn-filled press inline-block mt-2 text-sm px-6 py-2 rounded-xl">
          Track yours for free →
        </Link>
      </div>
    </div>
  );
}
