'use client';
import { useCountdown } from '@/hooks/useCountdown';

interface Props {
  event: { name: string; targetDate: Date | string } | null;
  theme?: 'light' | 'dark';
}

const THEMES = {
  light: { bg: '#FFFFFF', text: '#1C1C1E', sub: 'rgba(60,60,67,0.6)', accent: '#534AD9', border: 'rgba(60,60,67,0.12)' },
  dark:  { bg: '#000000', text: '#F5F5F7', sub: 'rgba(235,235,245,0.6)', accent: '#7D76FF', border: 'rgba(255,255,255,0.1)' },
};

export function EmbedWidget({ event, theme = 'light' }: Props) {
  const target = event ? new Date(event.targetDate) : new Date('2025-12-25');
  const { days, hours, minutes, seconds } = useCountdown(target);
  const t = THEMES[theme] ?? THEMES.light;

  return (
    <div
      className="flex flex-col items-center justify-center h-screen text-center"
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif',
        border: `1px solid ${t.border}`,
        borderRadius: 20,
      }}
    >
      <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: t.sub, marginBottom: 4 }}>
        time until
      </p>
      <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{event?.name ?? 'Christmas'}</p>
      <div style={{ display: 'flex', gap: 12, fontSize: 26, fontWeight: 800, color: t.accent, fontVariantNumeric: 'tabular-nums' }}>
        <span>{String(days).padStart(3,'0')}<span style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginLeft: 2 }}>d</span></span>
        <span>{String(hours).padStart(2,'0')}<span style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginLeft: 2 }}>h</span></span>
        <span>{String(minutes).padStart(2,'0')}<span style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginLeft: 2 }}>m</span></span>
        <span>{String(seconds).padStart(2,'0')}<span style={{ fontSize: 11, fontWeight: 600, color: t.sub, marginLeft: 2 }}>s</span></span>
      </div>
      <p style={{ fontSize: 10, color: t.sub, marginTop: 14, letterSpacing: '0.04em' }}>howlonguntilx.com</p>
    </div>
  );
}
