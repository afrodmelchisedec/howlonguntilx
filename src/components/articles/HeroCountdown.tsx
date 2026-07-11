// FILE: src/components/articles/HeroCountdown.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

function getTimeLeft(targetMs: number, nowMs: number) {
  const diff = targetMs - nowMs;
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}
function pad(n: number) { return String(n).padStart(2, '0'); }

export function HeroCountdown({ targetDate, label, glow }: { targetDate: string; label: string; glow: string }) {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const prevSec = useRef<number | null>(null);
  const [pulseKey, setPulseKey] = useState(0);

  // Mount-safe: never compute Date.now() during SSR or the first client render,
  // so server and client always agree on the very first paint (no hydration error).
  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(targetDate).getTime();
  const time = mounted && now !== null ? getTimeLeft(target, now) : null;

  useEffect(() => {
    if (!time) return;
    if (prevSec.current !== time.s) { setPulseKey(k => k + 1); prevSec.current = time.s; }
  }, [time?.s]);

  return (
    <div
      className="ios-card relative overflow-hidden anim-fade-up mb-6"
      style={{
        border: `1px solid rgba(${glow}, 0.35)`,
        boxShadow: `0 0 48px rgba(${glow}, 0.14), 0 0 0 1px rgba(${glow}, 0.1)`,
        padding: '20px 24px 18px',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)` }} />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 22 }} aria-hidden="true">⏳</span>
          <h2 className="text-callout font-bold m-0" style={{ color: 'var(--text-primary)' }}>{label}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: `rgb(${glow})`, '--glow': glow } as React.CSSProperties} />
          <span className="text-caption font-bold" style={{ color: `rgb(${glow})` }}>LIVE</span>
        </div>
      </div>

      <div key={pulseKey} className="grid grid-cols-4 gap-3 mb-5">
        {[
          { val: time?.d ?? null, label: 'DAYS' },
          { val: time?.h ?? null, label: 'HRS' },
          { val: time?.m ?? null, label: 'MIN' },
          { val: time?.s ?? null, label: 'SEC' },
        ].map(({ val, label: cellLabel }, i) => (
          <div key={cellLabel} className="rounded-2xl py-4 text-center"
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
            }}>
              {val === null ? '--' : (i === 0 ? val : pad(val))}
            </div>
            <div className="text-caption mt-1.5" style={{ color: `rgba(${glow}, ${i === 0 ? 0.9 : 0.45})`, letterSpacing: '0.08em' }}>{cellLabel}</div>
          </div>
        ))}
      </div>

      <div className="progress-track" style={{ height: 5 }}>
        <div style={{
          width: time ? `${(time.s / 60) * 100}%` : '0%',
          background: `linear-gradient(90deg, rgba(${glow},0.5), rgb(${glow}))`,
          transition: 'width 1s linear',
          height: '100%', borderRadius: 999,
        }} />
      </div>
    </div>
  );
}
