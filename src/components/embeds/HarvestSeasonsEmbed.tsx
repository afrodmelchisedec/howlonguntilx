// FILE: src/components/embeds/HarvestSeasonsEmbed.tsx
'use client';
import { useMemo } from 'react';

interface ProduceItem { id: string; name: string; emoji: string; color: string; start: number; peakStart: number; peakEnd: number; end: number; }
type Phase = 'peak' | 'ramping' | 'fading' | 'off';
interface Status { phase: Phase; daysToNext: number; label: string; score: number }

const GLOW = '154, 205, 50';
const PEAK_HIGHLIGHT = '255, 149, 0';

const CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function md(month: number, day: number): number { return CUM_DAYS[month - 1] + day; }

const BASKET: ProduceItem[] = [
  { id: 'strawberries', name: 'Strawberries', emoji: '🍓', color: '255, 107, 107', start: md(4, 15), peakStart: md(5, 15), peakEnd: md(6, 15), end: md(7, 15) },
  { id: 'tomatoes',     name: 'Tomatoes',     emoji: '🍅', color: '255, 90, 54',   start: md(6, 1),  peakStart: md(7, 15), peakEnd: md(9, 1),  end: md(10, 1) },
  { id: 'pumpkin',      name: 'Pumpkin',      emoji: '🎃', color: '255, 140, 0',   start: md(9, 1),  peakStart: md(10, 1), peakEnd: md(10, 31), end: md(11, 15) },
];

function inRange(doy: number, start: number, end: number): boolean {
  if (start <= end) return doy >= start && doy <= end;
  return doy >= start || doy <= end;
}
function forwardDist(from: number, to: number): number {
  let diff = to - from;
  if (diff < 0) diff += 365;
  return diff;
}
function currentDoy(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}
function bandSegments(startDoy: number, endDoy: number): { left: number; width: number }[] {
  const s = (startDoy / 365) * 100;
  const e = (endDoy / 365) * 100;
  if (s <= e) return [{ left: s, width: e - s }];
  return [{ left: s, width: 100 - s }, { left: 0, width: e }];
}
function computeStatus(item: ProduceItem, doy: number): Status {
  if (inRange(doy, item.peakStart, item.peakEnd)) {
    const daysToNext = forwardDist(doy, item.peakEnd);
    return { phase: 'peak', daysToNext, label: daysToNext === 0 ? '🔥 Last day of peak' : `🔥 Peak — ${daysToNext}d left`, score: 100 };
  }
  if (inRange(doy, item.start, item.end)) {
    if (inRange(doy, item.start, item.peakStart)) {
      const total = forwardDist(item.start, item.peakStart) || 1;
      const done = forwardDist(item.start, doy);
      const daysToNext = forwardDist(doy, item.peakStart);
      return { phase: 'ramping', daysToNext, label: `Peak in ${daysToNext}d`, score: Math.round(100 * (done / total)) };
    }
    const total = forwardDist(item.peakEnd, item.end) || 1;
    const done = forwardDist(item.peakEnd, doy);
    const daysToNext = forwardDist(doy, item.end);
    return { phase: 'fading', daysToNext, label: `Ends in ${daysToNext}d`, score: Math.max(0, Math.round(100 * (1 - done / total))) };
  }
  const daysToNext = forwardDist(doy, item.start);
  return { phase: 'off', daysToNext, label: `Starts in ${daysToNext}d`, score: 0 };
}
function phaseColor(phase: Phase, itemColor: string): string {
  if (phase === 'peak') return PEAK_HIGHLIGHT;
  if (phase === 'off') return '160, 160, 170';
  return itemColor;
}

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

export function HarvestSeasonsEmbed() {
  const doy = useMemo(() => currentDoy(), []);

  const withStatus = useMemo(() => BASKET.map(item => ({ item, status: computeStatus(item, doy) })), [doy]);
  const sortedBasket = useMemo(() => [...withStatus].sort((a, b) => {
    if (a.status.phase === 'peak' && b.status.phase !== 'peak') return -1;
    if (b.status.phase === 'peak' && a.status.phase !== 'peak') return 1;
    return a.status.daysToNext - b.status.daysToNext;
  }), [withStatus]);

  const peakCount = withStatus.filter(w => w.status.phase === 'peak').length;
  const startingSoonCount = withStatus.filter(w => (w.status.phase === 'off' || w.status.phase === 'ramping') && w.status.daysToNext <= 14).length;
  const avgFreshness = BASKET.length ? Math.round(withStatus.reduce((a, w) => a + w.status.score, 0) / BASKET.length) : 0;

  const health: 'peak' | 'soon' | 'quiet' = peakCount > 0 ? 'peak' : startingSoonCount > 0 ? 'soon' : 'quiet';
  const healthLabel = {
    peak: `🔥 ${peakCount} at peak right now`,
    soon: `🌱 ${startingSoonCount} starting soon`,
    quiet: '📦 Nothing peaking right now',
  }[health];
  const healthColor = { peak: PEAK_HIGHLIGHT, soon: GLOW, quiet: '160, 160, 170' }[health];

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${healthColor}, 0.25)`, transition: 'box-shadow 0.4s' };

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>SEASON BASKET</p>
          <p style={{ fontSize: 15, fontWeight: 700 }}>What's in season now</p>
        </div>
        <div style={{ fontSize: 10.5, fontWeight: 700, padding: '4px 9px', borderRadius: 999, background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})`, whiteSpace: 'nowrap' }}>
          {healthLabel}
        </div>
      </div>

      <div style={{ position: 'relative', height: 28, borderRadius: 8, background: '#2a2a30', marginBottom: 6, overflow: 'hidden' }}>
        {BASKET.map(item => {
          const segs = bandSegments(item.start, item.end);
          const status = withStatus.find(w => w.item.id === item.id)!.status;
          return segs.map((seg, i) => (
            <div key={`${item.id}-${i}`} style={{ position: 'absolute', top: 0, height: '100%', left: `${seg.left}%`, width: `${seg.width}%`, background: `rgba(${phaseColor(status.phase, item.color)}, 0.35)` }} />
          ));
        })}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${(doy / 365) * 100}%`, width: 2, background: `rgb(${GLOW})`, boxShadow: `0 0 6px rgba(${GLOW}, 0.8)` }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', marginBottom: 16 }}>
        {MONTH_LABELS.map((m, i) => <div key={i} style={{ fontSize: 8.5, opacity: 0.5, textAlign: 'center' }}>{m}</div>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {sortedBasket.map(({ item, status }) => (
          <div key={item.id} style={{ background: '#2a2a30', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
              <span>{item.emoji} {item.name}</span>
              <span style={{ fontWeight: 700, color: `rgb(${phaseColor(status.phase, item.color)})` }}>{status.label}</span>
            </div>
            <div style={{ height: 4, borderRadius: 999, background: '#3a3a40', overflow: 'hidden' }}>
              <div style={{ width: `${status.score}%`, height: '100%', background: `rgb(${phaseColor(status.phase, item.color)})` }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>AVG FRESHNESS</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: `rgb(${GLOW})` }}>{avgFreshness}%</p>
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example basket shown for preview — freshness and peak windows update live based on today's date.
      </p>
    </div>
  );
}
