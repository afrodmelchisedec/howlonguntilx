// FILE: src/components/pro-tools/CoverageWatchView.tsx
'use client';
import { useMemo } from 'react';
const GLOW = '150, 111, 255';

const METHOD_LABELS: Record<string, { label: string; emoji: string; daysToEffective: number; immediateIfEarlyCycle: boolean }> = {
  PILL_COMBINED: { label: 'Combined Pill', emoji: '💊', daysToEffective: 7, immediateIfEarlyCycle: true },
  PILL_MINI:     { label: 'Mini Pill',     emoji: '💊', daysToEffective: 2, immediateIfEarlyCycle: false },
  PATCH:         { label: 'Patch',         emoji: '🩹', daysToEffective: 7, immediateIfEarlyCycle: true },
  RING:          { label: 'Ring',          emoji: '⭕', daysToEffective: 7, immediateIfEarlyCycle: true },
  SHOT:          { label: 'Shot (Depo)',   emoji: '💉', daysToEffective: 7, immediateIfEarlyCycle: true },
  IUD_HORMONAL:  { label: 'Hormonal IUD',  emoji: '🌀', daysToEffective: 7, immediateIfEarlyCycle: true },
  IUD_COPPER:    { label: 'Copper IUD',    emoji: '🌀', daysToEffective: 0, immediateIfEarlyCycle: true },
  IMPLANT:       { label: 'Implant',       emoji: '🦴', daysToEffective: 7, immediateIfEarlyCycle: true },
  CONDOM:        { label: 'Condom',        emoji: '🛡️', daysToEffective: 0, immediateIfEarlyCycle: true },
};

export function CoverageWatchView({ method, startDate, cycleDayAtStart }: { method: string; startDate: string | null; cycleDayAtStart: number }) {
  const info = METHOD_LABELS[method];
  const percent = useMemo(() => {
    if (!info || !startDate) return 0;
    const immediate = info.immediateIfEarlyCycle && cycleDayAtStart <= 5;
    const days = immediate ? 0 : info.daysToEffective;
    const start = new Date(startDate + 'T00:00:00').getTime();
    const end = start + days * 86400000;
    if (end <= start) return 100;
    return Math.max(0, Math.min(100, ((Date.now() - start) / (end - start)) * 100));
  }, [info, startDate, cycleDayAtStart]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>COVERAGE WATCH</p>
        <h1 className="text-title1 mb-2">A read-only coverage status</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>No personal notes are shared here — just the method and coverage percentage.</p>
      </div>

      <div className="ios-card p-6 sm:p-8 flex flex-col items-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>
        {info ? (
          <>
            <p className="text-headline mb-4">{info.emoji} {info.label}</p>
            <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--fill-secondary)' }}>
              <div className="h-full rounded-full" style={{ width: `${percent}%`, background: `rgb(${GLOW})` }} />
            </div>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{Math.round(percent)}% toward typical full effectiveness.</p>
          </>
        ) : (
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>No method logged yet.</p>
        )}
      </div>
    </div>
  );
}
