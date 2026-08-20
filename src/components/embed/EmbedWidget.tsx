'use client';
import { useEffect, useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';

interface Props {
  event: { name: string; targetDate: Date | string } | null;
  theme?: 'light' | 'dark';
}

const THEMES = {
  light: { bg: '#FFFFFF', text: '#1C1C1E', sub: 'rgba(60,60,67,0.6)', accent: '#534AD9', border: 'rgba(60,60,67,0.12)', track: 'rgba(60,60,67,0.12)' },
  dark:  { bg: '#000000', text: '#F5F5F7', sub: 'rgba(235,235,245,0.6)', accent: '#7D76FF', border: 'rgba(255,255,255,0.1)', track: 'rgba(255,255,255,0.12)' },
};

export function EmbedWidget({ event, theme = 'light' }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const target = event ? new Date(event.targetDate) : new Date('2025-12-25');
  const { days, hours, minutes, seconds, progress } = useCountdown(target);
  const t = THEMES[theme] ?? THEMES.light;
  const name = event?.name ?? 'Christmas';

  const units = [
    { val: mounted ? String(days).padStart(days > 99 ? 3 : 2, '0') : '--', label: 'days' },
    { val: mounted ? String(hours).padStart(2, '0') : '--', label: 'hours' },
    { val: mounted ? String(minutes).padStart(2, '0') : '--', label: 'min' },
    { val: mounted ? String(seconds).padStart(2, '0') : '--', label: 'sec' },
  ];

  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif',
        border: `1px solid ${t.border}`,
        borderRadius: 20,
        padding: '20px 18px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <h1 style={{ fontSize: 17, fontWeight: 800, marginBottom: 14, lineHeight: 1.25 }}>
        How long until {name}?
      </h1>

      <div style={{ display: 'flex', gap: 0, marginBottom: 12 }} suppressHydrationWarning>
        {units.map((unit, i) => (
          <div
            key={unit.label}
            style={{
              textAlign: 'center',
              padding: '0 12px',
              borderRight: i < units.length - 1 ? `1px solid ${t.border}` : 'none',
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
                color: i === 3 ? t.accent : t.text,
              }}
            >
              {unit.val}
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, color: t.sub, marginTop: 3, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {unit.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: 260 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: t.sub, marginBottom: 4 }}>
          <span>{mounted ? progress : 0}% elapsed</span>
          <span>{mounted ? 100 - progress : 100}% remaining</span>
        </div>
        <div style={{ width: '100%', height: 5, borderRadius: 4, background: t.track, overflow: 'hidden' }}>
          <div style={{ width: `${mounted ? progress : 0}%`, height: '100%', background: t.accent, borderRadius: 4, transition: 'width 0.3s' }} />
        </div>
      </div>

      <p style={{ fontSize: 9, color: t.sub, marginTop: 14, letterSpacing: '0.04em' }}>howlonguntilx.com</p>
    </div>
  );
}
