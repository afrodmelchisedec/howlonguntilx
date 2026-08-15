// FILE: src/components/embeds/SubscriptionDensityEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface Subscription { id: string; name: string; emoji: string; amount: number; color: string; day: number | null; }

const GLOW = '255, 159, 10';

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function seedInitial(): Subscription[] {
  return [
    { id: 'seed-1', name: 'Netflix',       emoji: '🎬', amount: 15.99, color: '255, 69, 58',  day: 1 },
    { id: 'seed-2', name: 'Spotify',       emoji: '🎧', amount: 10.99, color: '88, 214, 113', day: 1 },
    { id: 'seed-3', name: 'Cloud Storage', emoji: '☁️', amount: 9.99,  color: '134, 168, 255', day: 15 },
    { id: 'seed-4', name: 'Gym',           emoji: '💪', amount: 39.99, color: '196, 132, 252', day: null },
  ];
}

export function SubscriptionDensityEmbed() {
  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const [subs, setSubs] = useState<Subscription[]>(seedInitial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const tray = subs.filter(s => s.day === null);
  const placed = subs.filter(s => s.day !== null);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingId) return;
    setGhostPos({ x: clientX, y: clientY });
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest('[data-day]') as HTMLElement | null;
    setHoverDay(cell ? Number(cell.dataset.day) : null);
  }, [draggingId]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX, e.clientY); }
    function onUp() {
      if (draggingId && hoverDay !== null) {
        setSubs(prev => prev.map(s => s.id === draggingId ? { ...s, day: hoverDay } : s));
      }
      setDraggingId(null);
      setHoverDay(null);
      setGhostPos(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove, draggingId, hoverDay]);

  function startDrag(id: string, clientX: number, clientY: number) {
    setDraggingId(id);
    setGhostPos({ x: clientX, y: clientY });
  }

  const grid = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [firstWeekday, daysInMonth]);

  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));
    return rows;
  }, [grid]);

  const weekTotals = useMemo(() => {
    return weeks.map(row => {
      const days = row.filter((d): d is number => d !== null);
      const total = placed.filter(s => s.day !== null && days.includes(s.day)).reduce((sum, s) => sum + s.amount, 0);
      return { days, total };
    });
  }, [weeks, placed]);

  const maxWeekTotal = Math.max(...weekTotals.map(w => w.total), 1);
  const monthTotal = placed.reduce((sum, s) => sum + s.amount, 0);

  const dayMap = useMemo(() => {
    const map = new Map<number, Subscription[]>();
    for (const s of placed) {
      if (s.day === null) continue;
      const arr = map.get(s.day) ?? [];
      arr.push(s);
      map.set(s.day, arr);
    }
    return map;
  }, [placed]);

  const duplicateGroups = useMemo(() => {
    const byName = new Map<string, Subscription[]>();
    for (const s of subs) {
      const key = s.name.toLowerCase();
      const arr = byName.get(key) ?? [];
      arr.push(s);
      byName.set(key, arr);
    }
    return Array.from(byName.values()).filter(arr => arr.length > 1);
  }, [subs]);

  const pileUpDays = useMemo(() => {
    return Array.from(dayMap.entries())
      .filter(([, arr]) => arr.length >= 3)
      .map(([day, arr]) => ({ day, count: arr.length }));
  }, [dayMap]);

  function heatColor(ratio: number): string {
    return ratio > 0.66 ? '255, 69, 58' : ratio > 0.33 ? '255, 159, 10' : '52, 199, 89';
  }

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)`, position: 'relative' };

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>SUBSCRIPTION RENEWAL DENSITY MAP</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Drag subscriptions onto the calendar</p>

      {tray.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, padding: 10, background: '#2a2a30', borderRadius: 10 }}>
          {tray.map(s => (
            <div
              key={s.id}
              onPointerDown={e => startDrag(s.id, e.clientX, e.clientY)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 9px', borderRadius: 999, background: `rgba(${s.color}, 0.22)`, color: `rgb(${s.color})`, fontSize: 11, fontWeight: 700, cursor: 'grab', touchAction: 'none', opacity: draggingId === s.id ? 0.3 : 1 }}
            >
              {s.emoji} {s.name} · {fmtMoney(s.amount)}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} style={{ fontSize: 9, opacity: 0.5, textAlign: 'center' }}>{d}</div>
        ))}
      </div>

      {weeks.map((row, wi) => {
        const ratio = weekTotals[wi].total / maxWeekTotal;
        const hue = weekTotals[wi].total > 0 ? heatColor(ratio) : null;
        return (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
            {row.map((day, di) => {
              const daySubs = day !== null ? (dayMap.get(day) ?? []) : [];
              return (
                <div
                  key={di}
                  data-day={day ?? undefined}
                  style={{
                    minHeight: 34, borderRadius: 6, fontSize: 9.5, padding: 2,
                    background: day === hoverDay && draggingId ? `rgba(${GLOW}, 0.35)` : hue ? `rgba(${hue}, ${0.12 + ratio * 0.25})` : '#2a2a30',
                    border: day === hoverDay && draggingId ? `1px dashed rgb(${GLOW})` : '1px solid transparent',
                    opacity: day === null ? 0.2 : 1,
                  }}
                >
                  {day !== null && <div style={{ opacity: 0.6, marginBottom: 1 }}>{day}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {daySubs.slice(0, 3).map(s => <span key={s.id} style={{ fontSize: 9 }}>{s.emoji}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {ghostPos && draggingId && (() => {
        const s = subs.find(x => x.id === draggingId);
        if (!s) return null;
        return (
          <div style={{ position: 'fixed', left: ghostPos.x, top: ghostPos.y, transform: 'translate(-50%, -50%)', pointerEvents: 'none', padding: '5px 9px', borderRadius: 999, background: `rgba(${s.color}, 0.9)`, color: '#1a1a1e', fontSize: 11, fontWeight: 700, zIndex: 100 }}>
            {s.emoji} {s.name}
          </div>
        );
      })()}

      {duplicateGroups.length > 0 && (
        <div style={{ borderLeft: '3px solid #ff453a', background: 'rgba(255,69,58,0.08)', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, marginTop: 12 }}>
          🔁 Possible duplicate: {duplicateGroups.map(g => g[0].name).join(', ')}
        </div>
      )}
      {pileUpDays.length > 0 && (
        <div style={{ borderLeft: '3px solid #ff9f0a', background: 'rgba(255,159,10,0.08)', borderRadius: 8, padding: '10px 12px', fontSize: 11.5, marginTop: 8 }}>
          📅 {pileUpDays.length} day{pileUpDays.length > 1 ? 's' : ''} with 3+ charges hitting at once
        </div>
      )}

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, textAlign: 'center', marginTop: 12 }}>
        <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>MONTHLY TOTAL</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: `rgb(${GLOW})` }}>{fmtMoney(monthTotal)}</p>
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example subscriptions shown for preview — drag them onto the calendar to see which weeks hit hardest.
      </p>
    </div>
  );
}
