// FILE: src/components/embeds/TaxBudgetDeadlinesEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

const GLOW = '245, 166, 35';
type Category = 'quarterly' | 'federal' | 'state';
const CATEGORY_COLORS: Record<Category, string> = { quarterly: '245, 166, 35', federal: '100, 200, 255', state: '196, 132, 252' };

interface Deadline { id: string; name: string; emoji: string; date: string; category: Category; target: number; saved: number; }

const TRACK_HEIGHT = 130;
const SNAP_AMOUNT = 250; // free-tier drag precision

function startOfToday(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function nextOccurrence(month: number, day: number): Date {
  const today = startOfToday();
  const year = today.getFullYear();
  let candidate = new Date(year, month - 1, day);
  if (candidate < today) candidate = new Date(year + 1, month - 1, day);
  return candidate;
}
function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - startOfToday().getTime()) / 86400000);
}
function formatMoney(n: number): string { return `$${Math.round(n).toLocaleString('en-US')}`; }
function formatCountdown(days: number): string {
  if (days < 0) return `Overdue ${Math.abs(days)}d`;
  if (days === 0) return 'Today!';
  if (days === 1) return 'Tomorrow';
  return `${days}d`;
}
function urgencyColor(days: number): string {
  if (days <= 14) return '255, 69, 58';
  if (days <= 60) return '255, 159, 10';
  return '52, 199, 89';
}

const DEFAULT_DEADLINES: Deadline[] = [
  { id: 'q1',     name: 'Q1 Estimated Tax',       emoji: '📄', date: isoDate(nextOccurrence(4, 15)),  category: 'quarterly', target: 2500, saved: 0 },
  { id: 'annual', name: 'Annual Filing Deadline',  emoji: '🗂️', date: isoDate(nextOccurrence(4, 15)),  category: 'federal',   target: 4000, saved: 0 },
  { id: 'state',  name: 'State Estimated Tax',     emoji: '🏛️', date: isoDate(nextOccurrence(4, 15)),  category: 'state',     target: 1200, saved: 0 },
];

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function TaxBudgetDeadlinesEmbed() {
  const [deadlines, setDeadlines] = useState<Deadline[]>(DEFAULT_DEADLINES);
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragId = useRef<string | null>(null);
  const [, forceRender] = useState(0);

  const scaleMax = useMemo(() => Math.max(3000, ...deadlines.map(d => d.target)), [deadlines]);

  const safeHarborScore = useMemo(() => {
    if (deadlines.length === 0) return 100;
    const weightSum = deadlines.reduce((a, d) => a + (d.target || 1), 0);
    const weighted = deadlines.reduce((a, d) => {
      const pct = d.target > 0 ? Math.min(100, (d.saved / d.target) * 100) : 100;
      return a + pct * (d.target || 1);
    }, 0);
    return Math.round(weighted / weightSum);
  }, [deadlines]);

  const urgentUnderfunded = deadlines.filter(d => daysUntil(d.date) <= 14 && d.saved < d.target);
  const health: 'strong' | 'ontrack' | 'behind' | 'urgent' =
    urgentUnderfunded.length > 0 ? 'urgent' : safeHarborScore >= 90 ? 'strong' : safeHarborScore >= 60 ? 'ontrack' : 'behind';
  const healthLabel = {
    strong: '✅ Fully on pace',
    ontrack: '🟡 On track',
    behind: '⚠️ Falling behind',
    urgent: `🚨 ${urgentUnderfunded.length} deadline${urgentUnderfunded.length === 1 ? '' : 's'} underfunded & close`,
  }[health];
  const healthColor = { strong: '52, 199, 89', ontrack: '255, 159, 10', behind: '255, 159, 10', urgent: '255, 69, 58' }[health];

  function ratioAtClientY(id: string, clientY: number): number {
    const el = trackRefs.current[id];
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, (rect.bottom - clientY) / TRACK_HEIGHT));
  }
  function savedAtClientY(id: string, clientY: number): number {
    const raw = ratioAtClientY(id, clientY) * scaleMax;
    return Math.round(raw / SNAP_AMOUNT) * SNAP_AMOUNT;
  }
  function startDrag(id: string, clientY: number) {
    dragId.current = id;
    forceRender(x => x + 1);
    const amount = Math.max(0, savedAtClientY(id, clientY));
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, saved: amount } : d));
  }
  const handlePointerMove = useCallback((clientY: number) => {
    if (!dragId.current) return;
    const amount = Math.max(0, savedAtClientY(dragId.current, clientY));
    setDeadlines(prev => prev.map(d => d.id === dragId.current ? { ...d, saved: amount } : d));
  }, [scaleMax]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientY); }
    function onUp() { dragId.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handlePointerMove]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>SAFE-HARBOR PLANNER</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Drag each bar to log what you've saved</p>
      <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 16 }}>Snaps to {formatMoney(SNAP_AMOUNT)} steps</p>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', height: TRACK_HEIGHT + 40, marginBottom: 12 }}>
        {deadlines.map(d => {
          const pct = d.target > 0 ? Math.min(100, (d.saved / d.target) * 100) : 100;
          const barHeight = (Math.min(scaleMax, d.saved) / scaleMax) * TRACK_HEIGHT;
          const catColor = CATEGORY_COLORS[d.category];
          return (
            <div key={d.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div
                ref={el => { trackRefs.current[d.id] = el; }}
                onPointerDown={e => startDrag(d.id, e.clientY)}
                style={{ position: 'relative', width: '100%', height: TRACK_HEIGHT, borderRadius: 10, background: '#2a2a30', touchAction: 'none', cursor: 'grab', overflow: 'hidden' }}
              >
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: barHeight, background: `rgba(${pct >= 100 ? '52, 199, 89' : catColor}, 0.75)`, transition: dragId.current === d.id ? 'none' : 'height 0.2s ease' }} />
              </div>
              <span style={{ fontSize: 16 }}>{d.emoji}</span>
              <span style={{ fontSize: 10, opacity: 0.7, textAlign: 'center', lineHeight: 1.2 }}>{d.name.replace(' Estimated Tax', '').replace(' Filing Deadline', '').replace(' Deadline', '')}</span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: `rgb(${catColor})` }}>{Math.round(pct)}%</span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        {deadlines.map(d => {
          const days = daysUntil(d.date);
          return (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, background: '#2a2a30', borderRadius: 8, padding: '6px 10px' }}>
              <span>{d.emoji} {formatMoney(d.saved)} <span style={{ opacity: 0.5 }}>of {formatMoney(d.target)}</span></span>
              <span style={{ color: `rgb(${urgencyColor(days)})`, fontWeight: 600 }}>{formatCountdown(days)}</span>
            </div>
          );
        })}
      </div>

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center' }}>
        <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>SAFE-HARBOR SCORE</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{safeHarborScore}</p>
      </div>

      <div style={{ borderLeft: `3px solid rgb(${healthColor})`, background: `rgba(${healthColor}, 0.08)`, borderRadius: 8, padding: '10px 12px', fontSize: 12.5, marginBottom: 4 }}>
        {healthLabel}
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example deadlines shown for preview — not tax advice. Consult a tax professional for your specific situation.
      </p>
    </div>
  );
}
