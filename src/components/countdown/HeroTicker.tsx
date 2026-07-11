'use client';
import { useEffect, useState, useRef } from 'react';

const SHOWCASE = [
  { name: 'Christmas 2025',      date: new Date('2025-12-25T00:00:00'), emoji: '🎄', color: '48, 219, 91'   },
  { name: 'FIFA World Cup 2026', date: new Date('2026-06-11T00:00:00'), emoji: '⚽', color: '64, 156, 255'  },
  { name: 'New Year 2027',       date: new Date('2027-01-01T00:00:00'), emoji: '🎆', color: '125, 118, 255' },
  { name: 'Solar Eclipse 2026',  date: new Date('2026-08-12T00:00:00'), emoji: '🌑', color: '218, 143, 255' },
  { name: 'Black Friday 2025',   date: new Date('2025-11-28T00:00:00'), emoji: '🛍️', color: '255, 159, 10'  },
  { name: 'Super Bowl LX',       date: new Date('2026-02-08T00:00:00'), emoji: '🏈', color: '255, 75, 110'  },
];

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function HeroTicker() {
  const [idx, setIdx] = useState(0);
  const [time, setTime] = useState(getTimeLeft(SHOWCASE[0].date));
  const [fade, setFade] = useState(true);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [pressing, setPressing] = useState(false);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  function goTo(i: number) {
    setFade(false);
    setTimeout(() => { setIdx(i); setFade(true); }, 280);
  }

  function resetAuto() {
    if (autoRef.current) clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setIdx(i => {
        const next = (i + 1) % SHOWCASE.length;
        setFade(false);
        setTimeout(() => setFade(true), 280);
        return next;
      });
    }, 6000);
  }

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft(SHOWCASE[idx].date)), 1000);
    return () => clearInterval(t);
  }, [idx]);

  useEffect(() => {
    resetAuto();
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    setDragStart(e.clientX);
    setDragDelta(0);
    setPressing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragStart === null) return;
    setDragDelta(e.clientX - dragStart);
  }

  function onPointerUp(e: React.PointerEvent) {
    setPressing(false);
    if (dragStart === null) return;
    const delta = e.clientX - dragStart;
    if (Math.abs(delta) > 40) {
      const next = delta < 0
        ? (idx + 1) % SHOWCASE.length
        : (idx - 1 + SHOWCASE.length) % SHOWCASE.length;
      goTo(next);
      resetAuto();
    }
    setDragStart(null);
    setDragDelta(0);
  }

  const ev = SHOWCASE[idx];
  const glow = ev.color;

  return (
    <div className="my-8 mx-auto w-full" style={{ maxWidth: 680 }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="ios-card relative overflow-hidden select-none"
        style={{
          border: `1px solid rgba(${glow}, 0.35)`,
          boxShadow: `0 0 48px rgba(${glow}, 0.14), 0 0 0 1px rgba(${glow}, 0.1)`,
          opacity: fade ? 1 : 0,
          transform: `translateX(${dragDelta * 0.06}px) scale(${pressing ? 0.985 : 1})`,
          transition: dragStart !== null ? 'transform 0.05s' : 'opacity 0.28s ease, transform 0.4s var(--spring), border-color 0.4s, box-shadow 0.4s',
          cursor: dragStart !== null ? 'grabbing' : 'grab',
          padding: '20px 24px 18px',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)`, transition: 'background 0.4s' }} />

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 22 }}>{ev.emoji}</span>
            <span className="text-callout font-bold" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: `rgb(${glow})`, '--glow': glow } as React.CSSProperties} />
            <span className="text-caption font-bold" style={{ color: `rgb(${glow})` }}>LIVE</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { val: time.d, label: 'DAYS' },
            { val: time.h, label: 'HRS' },
            { val: time.m, label: 'MIN' },
            { val: time.s, label: 'SEC' },
          ].map(({ val, label }, i) => (
            <div key={label} className="rounded-2xl py-4 text-center"
              style={{
                background: `rgba(${glow}, ${i === 0 ? 0.12 : 0.05})`,
                border: `1px solid rgba(${glow}, ${i === 0 ? 0.3 : 0.1})`,
              }}>
              <div className="tabular font-black" style={{
                fontSize: i === 0 ? 48 : 38,
                lineHeight: 1,
                color: i === 0 ? `rgb(${glow})` : 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
                textShadow: i === 0 ? `0 0 24px rgba(${glow}, 0.5)` : 'none',
                transition: 'color 0.3s',
              }}>
                {i === 0 ? val : pad(val)}
              </div>
              <div className="text-caption mt-1.5" style={{ color: `rgba(${glow}, ${i === 0 ? 0.9 : 0.45})`, letterSpacing: '0.08em' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="progress-track mb-4" style={{ height: 5 }}>
          <div style={{
            width: `${(time.s / 60) * 100}%`,
            background: `linear-gradient(90deg, rgba(${glow},0.5), rgb(${glow}))`,
            transition: 'width 1s linear',
            height: '100%', borderRadius: 999,
          }} />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>← swipe to explore →</p>
          <div className="flex gap-1.5">
            {SHOWCASE.map((_, i) => (
              <button key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i); resetAuto(); }}
                style={{
                  width: i === idx ? 20 : 6, height: 6,
                  borderRadius: 999,
                  background: i === idx ? `rgb(${glow})` : `rgba(${glow}, 0.25)`,
                  transition: 'all 0.3s var(--spring)',
                  border: 'none', cursor: 'pointer', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
