// FILE: src/components/articles/HeroCountdown.tsx
'use client';
import { useEffect, useRef, useState } from 'react';

export function HeroCountdown({ targetDate, label, glow }: { targetDate: string; label: string; glow: string }) {
  const [now, setNow] = useState(() => Date.now());
  const [pulseKey, setPulseKey] = useState(0);
  const prevSec = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(targetDate).getTime();
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);

  useEffect(() => {
    if (prevSec.current !== s) { setPulseKey(k => k + 1); prevSec.current = s; }
  }, [s]);

  return (
    <div
      className="article-hero-countdown rounded-3xl p-6 sm:p-8 mb-6 text-center anim-fade-up"
      style={{
        background: `linear-gradient(160deg, rgba(${glow}, 0.16), rgba(${glow}, 0.04))`,
        border: `1.5px solid rgba(${glow}, 0.4)`,
        // @ts-ignore custom properties for the shared keyframe
        '--article-glow-a': `rgba(${glow}, 0.25)`,
        '--article-glow-b': `rgba(${glow}, 0.5)`,
        '--article-glow-c': `rgba(${glow}, 0.45)`,
      } as React.CSSProperties}
    >
      <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${glow})` }}>⏳ COUNTING DOWN TO</p>
      <p className="text-title2 mb-4">{label}</p>
      <div className="flex justify-center gap-4 sm:gap-6">
        {[['Days', d], ['Hours', h], ['Min', m], ['Sec', s]].map(([lab, val]) => (
          <div key={lab as string} className="min-w-[56px]">
            <div key={pulseKey} className="text-title1 tabular font-bold article-digit-pulse" style={{ color: `rgb(${glow})` }}>
              {String(val).padStart(2, '0')}
            </div>
            <div className="text-caption mt-1">{lab}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
