'use client';
import { useEffect, useState } from 'react';

// Rotating events to show in the hero ticker
const SHOWCASE = [
  { name: 'Christmas 2025',      date: new Date('2025-12-25T00:00:00'), emoji: '🎄', color: '48, 219, 91'   },
  { name: 'FIFA World Cup 2026', date: new Date('2026-06-11T00:00:00'), emoji: '⚽', color: '64, 156, 255'  },
  { name: 'New Year 2027',       date: new Date('2027-01-01T00:00:00'), emoji: '🎆', color: '125, 118, 255' },
  { name: 'Solar Eclipse 2026',  date: new Date('2026-08-12T00:00:00'), emoji: '🌑', color: '218, 143, 255' },
  { name: 'Black Friday 2025',   date: new Date('2025-11-28T00:00:00'), emoji: '🛍️', color: '255, 159, 10'  },
];

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function HeroTicker() {
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState(getTimeLeft(SHOWCASE[0].date));
  const [fade, setFade] = useState(true);

  // Tick every second
  useEffect(() => {
    const t = setInterval(() => {
      setTime(getTimeLeft(SHOWCASE[idx].date));
    }, 1000);
    return () => clearInterval(t);
  }, [idx]);

  // Rotate event every 6 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % SHOWCASE.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  const ev = SHOWCASE[idx];
  const glow = ev.color;

  return (
    <div className="my-6 mx-auto" style={{ maxWidth: 420 }}>
      <div
        className="ios-card p-5 relative overflow-hidden"
        style={{
          border: `1px solid rgba(${glow}, 0.3)`,
          boxShadow: `0 0 32px rgba(${glow}, 0.12), 0 0 0 1px rgba(${glow}, 0.15)`,
          transition: 'opacity 0.3s ease',
          opacity: fade ? 1 : 0,
        }}
      >
        {/* Glow strip top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)`,
        }} />

        {/* Event label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>{ev.emoji}</span>
            <span className="text-footnote font-semibold" style={{ color: 'var(--text-secondary)' }}>
              {ev.name}
            </span>
          </div>
          <span className="pill" style={{ background: `rgba(${glow}, 0.12)`, color: `rgb(${glow})`, fontSize: 10 }}>
            LIVE
          </span>
        </div>

        {/* Countdown digits */}
        <div className="flex items-end justify-center gap-3">
          {[
            { val: time.d, label: 'DAYS' },
            { val: time.h, label: 'HRS' },
            { val: time.m, label: 'MIN' },
            { val: time.s, label: 'SEC' },
          ].map(({ val, label }, i) => (
            <div key={label} className="flex flex-col items-center">
              {i > 0 && (
                <span className="absolute text-2xl font-black tabular mb-1 -ml-4"
                  style={{ color: `rgba(${glow}, 0.4)`, marginTop: 4 }}>
                </span>
              )}
              <div
                className="tabular font-black"
                style={{
                  fontSize: label === 'DAYS' ? 48 : 36,
                  lineHeight: 1,
                  color: label === 'DAYS' ? `rgb(${glow})` : 'var(--text-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  minWidth: label === 'DAYS' ? 80 : 52,
                  textAlign: 'center',
                  textShadow: label === 'DAYS' ? `0 0 24px rgba(${glow}, 0.4)` : 'none',
                }}
              >
                {label === 'DAYS' ? time.d : pad(val)}
              </div>
              <div className="text-caption mt-1" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="progress-track mt-4">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, (time.s / 60) * 100)}%`,
              background: `linear-gradient(90deg, rgba(${glow},0.6), rgb(${glow}))`,
              transition: 'width 1s linear',
            }}
          />
        </div>

        {/* Dots indicator */}
        <div className="flex justify-center gap-1.5 mt-3">
          {SHOWCASE.map((_, i) => (
            <button
              key={i}
              onClick={() => { setFade(false); setTimeout(() => { setIdx(i); setFade(true); }, 300); }}
              style={{
                width: i === idx ? 16 : 6,
                height: 6,
                borderRadius: 999,
                background: i === idx ? `rgb(${glow})` : 'var(--border-hairline)',
                transition: 'all 0.3s var(--spring)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
