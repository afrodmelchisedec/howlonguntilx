'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import type { CalendarEvent } from '@/lib/calendar-shared';

function getDays(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

interface Props {
  events: CalendarEvent[];
}

export function LiveTickerFeed({ events }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  if (!events || events.length === 0) return null;

  // Double events for seamless loop
  const doubled = [...events, ...events];

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
          style={{ background: paused ? 'rgba(48, 219, 91, 0.12)' : 'rgba(255, 75, 110, 0.12)', color: paused ? 'rgb(48, 219, 91)' : 'rgb(255, 75, 110)', cursor: 'pointer',border: 'none' }}>
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
              <span style={{ fontSize: 16 }}>{ev.emoji ?? '📅'}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.event}</span>
              <span className="tabular text-sm font-black" style={{ color: `rgb(${ev.color ?? '125, 118, 255'})` }}>
                {getDays(ev.date!)}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable event cards */}
      <div className="p-4">
        <p className="text-caption mb-3" style={{ color: 'var(--text-tertiary)' }}>TAP TO EXPAND</p>
        <div className="flex flex-col gap-2">
          {events.slice(0, 6).map((ev, i) => (
            <div key={ev.slug ?? i}
              className="rounded-xl overflow-hidden cursor-pointer transition-all"
              style={{
                border: `1px solid ${expanded === i ? `rgba(${ev.color ?? '125, 118, 255'}, 0.4)` : 'var(--border-hairline)'}`,
                background: expanded === i ? `rgba(${ev.color ?? '125, 118, 255'}, 0.06)` : 'var(--bg-elevated-2)',
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}>

              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 20 }}>{ev.emoji ?? '📅'}</span>
                  <span className="text-callout font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.event}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular text-callout font-black" style={{ color: `rgb(${ev.color ?? '125, 118, 255'})` }}>
                    {getDays(ev.date!)} days
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', transform: expanded === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 12 }}>▼</span>                </div>
              </div>

              {expanded === i && (
                <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid rgba(${ev.color ?? '125, 118, 255'}, 0.15)` }}>
                  <div className="progress-track mt-1 mb-3">
                    <div className="progress-fill" style={{
                      width: `${100 - Math.min(100, (getDays(ev.date!) / 365) * 100)}%`,
                      background: `linear-gradient(90deg, rgba(${ev.color ?? '125, 118, 255'},0.6), rgb(${ev.color ?? '125, 118, 255'}))`,
                    }} />
                  </div>
                  {ev.slug && (
                    <Link href={`/how-long-until-${ev.slug}`}
                      className="btn-tinted press text-sm w-full text-center block rounded-xl py-2"
                      style={{ background: `rgba(${ev.color ?? '125, 118, 255'}, 0.12)`, color: `rgb(${ev.color ?? '125, 118, 255'})` }}>
                      View live countdown →
                    </Link>
                  )}
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
