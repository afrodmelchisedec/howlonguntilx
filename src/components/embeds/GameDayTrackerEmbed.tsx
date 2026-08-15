// FILE: src/components/embeds/GameDayTrackerEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '0, 209, 255';

interface Team { name: string; color: string; }
interface GameEvent {
  id: string;
  teamA: Team;
  teamB: Team;
  date: string;
  prediction: number;
}

function isoInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(19, 0, 0, 0);
  return d.toISOString();
}

const EXAMPLE_EVENTS: GameEvent[] = [
  { id: 'e1', teamA: { name: 'Home Team', color: '255, 69, 58' }, teamB: { name: 'Away Team', color: '0, 122, 255' }, date: isoInDays(2), prediction: 55 },
  { id: 'e2', teamA: { name: 'Reds', color: '255, 159, 10' }, teamB: { name: 'Blues', color: '100, 200, 255' }, date: isoInDays(9), prediction: 40 },
];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function formatCountdownLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days === 0) return '🔥 Today!';
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - r.getDay());
  r.setHours(0, 0, 0, 0);
  return r;
}

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f7',
};

function PredictionTug({ confidence, onChange, teamA, teamB }: {
  confidence: number; onChange: (v: number) => void; teamA: Team; teamB: Team;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleMove = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 100));
  }, [onChange]);

  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging, handleMove]);

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: `rgb(${teamA.color})` }}>{teamA.name} {confidence}%</span>
        <span style={{ color: `rgb(${teamB.color})` }}>{teamB.name} {100 - confidence}%</span>
      </div>
      <div ref={ref} style={{ position: 'relative', height: 24, borderRadius: 999, overflow: 'hidden', display: 'flex', touchAction: 'none' }}>
        <div style={{ width: `${confidence}%`, background: `rgb(${teamA.color})`, transition: 'width 0.1s' }} />
        <div style={{ width: `${100 - confidence}%`, background: `rgb(${teamB.color})`, transition: 'width 0.1s' }} />
        <div
          onPointerDown={() => setDragging(true)}
          style={{
            position: 'absolute', top: '50%', left: `${confidence}%`, width: 24, height: 24,
            transform: 'translate(-50%, -50%)', borderRadius: 999, background: 'white',
            border: '3px solid rgba(0,0,0,0.3)', cursor: 'grab', touchAction: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
          }}
        >
          🏆
        </div>
      </div>
    </div>
  );
}

export function GameDayTrackerEmbed() {
  const [events, setEvents] = useState<GameEvent[]>(EXAMPLE_EVENTS);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const nextEvent = useMemo(
    () => [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [events, tick]
  );

  const heatmap = useMemo(() => {
    const start = startOfWeek(new Date());
    const row: { date: Date; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(day.getDate() + d);
      const count = events.filter(e => sameDay(new Date(e.date), day)).length;
      row.push({ date: day, count });
    }
    return row;
  }, [events, tick]);

  function updatePrediction(id: string, v: number) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, prediction: v } : e));
  }

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>SPORTS & GAMES</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Game Day Tracker</h3>

      {nextEvent && (
        <div style={{ background: '#0a0e14', borderRadius: 14, border: `1.5px solid rgba(${GLOW}, 0.35)`, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: `rgb(${GLOW})`, marginBottom: 8 }}>{formatCountdownLabel(nextEvent.date)}</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
            {nextEvent.teamA.name} <span style={{ color: '#8e8e93' }}>vs</span> {nextEvent.teamB.name}
          </div>
          <PredictionTug
            confidence={nextEvent.prediction}
            onChange={v => updatePrediction(nextEvent.id, v)}
            teamA={nextEvent.teamA}
            teamB={nextEvent.teamB}
          />
        </div>
      )}

      <div style={{ fontSize: 11, color: '#8e8e93', marginBottom: 6 }}>THIS WEEK</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {heatmap.map((day, i) => {
          const isToday = sameDay(day.date, new Date());
          const bg = day.count === 0 ? 'rgba(255,255,255,0.08)' : day.count === 1 ? `rgba(${GLOW}, 0.45)` : `rgba(${GLOW}, 0.9)`;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                width: '100%', height: 20, borderRadius: 5, background: bg,
                border: isToday ? `1.5px solid rgb(${GLOW})` : 'none',
              }} />
              <div style={{ fontSize: 9, color: '#8e8e93', marginTop: 3 }}>{'SMTWTFS'[day.date.getDay()]}</div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: 0 }}>
        Example matchup shown for preview — drag the trophy to see the prediction update live.
      </p>
    </div>
  );
}
