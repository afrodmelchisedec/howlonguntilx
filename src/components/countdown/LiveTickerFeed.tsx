'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const TICKER_EVENTS = [
  { name: 'FIFA World Cup', date: '2026-06-11', emoji: '⚽', color: '64, 156, 255', slug: 'fifa-world-cup-2026' },
  { name: 'Christmas', date: '2025-12-25', emoji: '🎄', color: '48, 219, 91', slug: 'christmas-2025' },
  { name: 'Solar Eclipse', date: '2026-08-12', emoji: '🌑', color: '218, 143, 255', slug: 'solar-eclipse-2026' },
  { name: 'Black Friday', date: '2025-11-28', emoji: '🛍️', color: '255, 159, 10', slug: 'black-friday-2025' },
  { name: 'New Year 2027', date: '2027-01-01', emoji: '🎆', color: '125, 118, 255', slug: 'new-year-2027' },
  { name: 'Super Bowl LX', date: '2026-02-08', emoji: '🏈', color: '255, 75, 110', slug: 'super-bowl-lx' },
  { name: 'Oscars 2026', date: '2026-03-15', emoji: '🏆', color: '255, 214, 10', slug: 'oscars-2026' },
  { name: 'Apple WWDC', date: '2026-06-08', emoji: '🍎', color: '64, 156, 255', slug: 'apple-wwdc-2026' },
  { name: 'Summer Solstice', date: '2026-06-21', emoji: '☀️', color: '255, 149, 0', slug: 'summer-solstice-2026' },
  { name: 'Halloween', date: '2025-10-31', emoji: '🎃', color: '255, 159, 10', slug: 'halloween-2025' },
  { name: 'US Tax Deadline', date: '2026-04-15', emoji: '📋', color: '255, 75, 110', slug: 'us-tax-deadline-2026' },
  { name: 'Google I/O', date: '2026-05-12', emoji: '💻', color: '48, 219, 91', slug: 'google-io-2026' },
  { name: 'Meteor Shower', date: '2025-08-12', emoji: '🌠', color: '218, 143, 255', slug: 'perseid-meteor-shower-2025' },
  { name: 'Easter 2026', date: '2026-04-05', emoji: '🐣', color: '100, 240, 235', slug: 'easter-2026' },
  { name: 'Prime Day 2026', date: '2026-07-15', emoji: '📦', color: '255, 159, 10', slug: 'prime-day-2026' },
  { name: 'Salary Day', date: '2025-07-31', emoji: '💰', color: '48, 219, 91', slug: 'salary-day-july' },
  { name: 'Grammys 2026', date: '2026-02-01', emoji: '🎵', color: '125, 118, 255', slug: 'grammys-2026' },
  { name: 'CES 2026', date: '2026-01-06', emoji: '🤖', color: '64, 156, 255', slug: 'ces-2026' },
];

function getDays(dateStr: string) {
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  return d > 0 ? d : 0;
}

export function LiveTickerFeed() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Double events for seamless loop
  const doubled = [...TICKER_EVENTS, ...TICKER_EVENTS];

  return (
    <div className="ios-card overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full urgent-glow" style={{ background: 'rgb(255, 75, 110)', '--glow': '255, 75, 110' } as React.CSSProperties} />
          <p className="text-headline">Live World Event Feed</p>
        </div>
        <button onClick={() => setPaused(p => !p)}
          className="press pill text-xs"
          style={{ background: paused ? 'rgba(48, 219, 91, 0.12)' : 'rgba(255, 75, 110, 0.12)', color: paused ? 'rgb(48, 219, 91)' : 'rgb(255, 75, 110)', cursor: 'pointer', border: 'none' }}>
          {paused ? '▶ Resume' : '⏸ Pause'}
        </button>
      </div>

      {/* Scrolling ticker */}
      <div className="relative overflow-hidden" style={{ height: 48, background: 'var(--bg-elevated-2)' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}>
        <div
          ref={trackRef}
          className="flex items-center gap-0 absolute whitespace-nowrap"
          style={{
            animation: paused ? 'none' : 'ticker-scroll 40s linear infinite',
            top: 0, left: 0, height: '100%',
          }}>
          {doubled.map((ev, i) => (
            <div key={i} className="flex items-center gap-2 px-5 h-full"
              style={{ borderRight: '1px solid var(--border-hairline)' }}>
              <span style={{ fontSize: 16 }}>{ev.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
              <span className="tabular text-sm font-black" style={{ color: `rgb(${ev.color})` }}>
                {getDays(ev.date)}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable event cards */}
      <div className="p-4">
        <p className="text-caption mb-3" style={{ color: 'var(--text-tertiary)' }}>TAP TO EXPAND</p>
        <div className="flex flex-col gap-2">
          {TICKER_EVENTS.slice(0, 6).map((ev, i) => (
            <div key={ev.slug}
              className="rounded-xl overflow-hidden cursor-pointer transition-all"
              style={{
                border: `1px solid ${expanded === i ? `rgba(${ev.color}, 0.4)` : 'var(--border-hairline)'}`,
                background: expanded === i ? `rgba(${ev.color}, 0.06)` : 'var(--bg-elevated-2)',
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 20 }}>{ev.emoji}</span>
                  <span className="text-callout font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular text-callout font-black" style={{ color: `rgb(${ev.color})` }}>
                    {getDays(ev.date)} days
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', transform: expanded === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>
                </div>
              </div>

              {expanded === i && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid rgba(${ev.color}, 0.15)` }}>
                  <div className="progress-track mt-1 mb-3">
                    <div className="progress-fill" style={{
                      width: `${100 - Math.min(100, (getDays(ev.date) / 365) * 100)}%`,
                      background: `linear-gradient(90deg, rgba(${ev.color},0.6), rgb(${ev.color}))`,
                    }} />
                  </div>
                  <Link href={`/how-long-until-${ev.slug}`}
                    className="btn-tinted press text-sm w-full text-center block rounded-xl py-2"
                    style={{ background: `rgba(${ev.color}, 0.12)`, color: `rgb(${ev.color})` }}>
                    View live countdown →
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
