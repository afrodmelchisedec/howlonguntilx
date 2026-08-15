// FILE: src/components/embeds/LaunchCountdownPlannerEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '84, 158, 255';
const MIN_DAYS_OUT = 5;
const MAX_DAYS_OUT = 60;

interface Phase { id: string; name: string; percent: number; color: string; }
interface DayInfo { date: Date; isWeekend: boolean; isWorking: boolean; }

const EXAMPLE_PHASES: Phase[] = [
  { id: 'design', name: 'Design', percent: 25, color: '196, 132, 252' },
  { id: 'dev', name: 'Development', percent: 50, color: '100, 200, 255' },
  { id: 'qa', name: 'QA', percent: 25, color: '88, 214, 113' },
];

function todayAtMidnight(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function fmtDate(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtDateFull(d: Date): string { return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }); }

function buildDays(start: Date, daysOut: number): DayInfo[] {
  const days: DayInfo[] = [];
  for (let i = 0; i <= daysOut; i++) {
    const date = addDays(start, i);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    days.push({ date, isWeekend, isWorking: !isWeekend });
  }
  return days;
}

function allocatePhases(days: DayInfo[], phases: Phase[]) {
  const workingDays = days.filter(d => d.isWorking);
  const total = workingDays.length;
  const rawCounts = phases.map(p => (p.percent / 100) * total);
  const counts = rawCounts.map(Math.floor);
  const assigned = counts.reduce((a, b) => a + b, 0);
  const remainder = total - assigned;
  const fracOrder = rawCounts.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) counts[fracOrder[k % Math.max(fracOrder.length, 1)].i] += 1;
  return phases.map((p, i) => ({ ...p, workingDays: counts[i] ?? 0 }));
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

export function LaunchCountdownPlannerEmbed() {
  const [daysOut, setDaysOut] = useState(21);
  const [phases, setPhases] = useState<Phase[]>(EXAMPLE_PHASES);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragDivider = useRef<number | null>(null);

  const today = useMemo(() => todayAtMidnight(), []);
  const launchDate = useMemo(() => addDays(today, daysOut), [today, daysOut]);
  const days = useMemo(() => buildDays(today, daysOut), [today, daysOut]);
  const allocations = useMemo(() => allocatePhases(days, phases), [days, phases]);
  const totalWorkingDays = allocations.reduce((a, p) => a + p.workingDays, 0);

  const sliderRatio = (daysOut - MIN_DAYS_OUT) / (MAX_DAYS_OUT - MIN_DAYS_OUT);

  const handleSliderPointerMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = Math.round(MIN_DAYS_OUT + ratio * (MAX_DAYS_OUT - MIN_DAYS_OUT));
    setDaysOut(next);
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (draggingSlider) handleSliderPointerMove(e.clientX); }
    function onUp() { setDraggingSlider(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [draggingSlider, handleSliderPointerMove]);

  const handleBarPointerMove = useCallback((clientX: number) => {
    if (dragDivider.current === null || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPhases(prev => {
      const idx = dragDivider.current!;
      let cumulative = 0;
      for (let i = 0; i < idx; i++) cumulative += prev[i].percent;
      const nextCumulative = cumulative + prev[idx].percent + prev[idx + 1].percent;
      const minGap = 4;
      const newBoundary = Math.min(Math.max(pct, cumulative + minGap), nextCumulative - minGap);
      const newLeft = newBoundary - cumulative;
      const newRight = nextCumulative - newBoundary;
      const next = [...prev];
      next[idx] = { ...next[idx], percent: newLeft };
      next[idx + 1] = { ...next[idx + 1], percent: newRight };
      return next;
    });
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleBarPointerMove(e.clientX); }
    function onUp() { dragDivider.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleBarPointerMove]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>DEADLINE BUFFER SLIDER</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Launch Countdown Planner</h3>
      <p style={{ fontSize: 12, color: '#8e8e93', margin: '0 0 18px' }}>
        {totalWorkingDays} working days until {fmtDate(launchDate)}
      </p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>Drag to set launch date</span>
          <span style={{ fontWeight: 700, color: `rgb(${GLOW})` }}>{fmtDateFull(launchDate)}</span>
        </div>
        <div ref={sliderRef} style={{ position: 'relative', height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.1)', touchAction: 'none' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 999, width: `${sliderRatio * 100}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 10px rgba(${GLOW}, 0.6)` }} />
          <div
            onPointerDown={() => setDraggingSlider(true)}
            style={{
              position: 'absolute', top: '50%', left: `${sliderRatio * 100}%`, width: 22, height: 22,
              transform: 'translate(-50%, -50%)', borderRadius: 999, background: 'white',
              border: `3px solid rgb(${GLOW})`, cursor: 'grab', touchAction: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#8e8e93' }}>
          <span>Today, {fmtDate(today)}</span>
          <span>{MAX_DAYS_OUT} days out</span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 600 }}>Split working days across phases</span>
          <span style={{ fontSize: 11, color: '#8e8e93' }}>drag the dividers →</span>
        </div>
        <div ref={barRef} style={{ position: 'relative', width: '100%', height: 48, borderRadius: 16, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.1)', userSelect: 'none' }}>
          {phases.map((p, i) => (
            <div key={p.id} style={{
              position: 'relative', width: `${p.percent}%`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `rgba(${p.color}, 0.28)`, borderRight: i < phases.length - 1 ? '2px solid #1a1a1e' : 'none',
              transition: 'width 0.1s',
            }}>
              {p.percent > 8 && (
                <span style={{ fontSize: 11, fontWeight: 700, color: `rgb(${p.color})`, whiteSpace: 'nowrap' }}>{Math.round(p.percent)}%</span>
              )}
              {i < phases.length - 1 && (
                <div
                  onPointerDown={() => { dragDivider.current = i; }}
                  style={{ position: 'absolute', top: 0, right: -8, height: '100%', width: 16, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none', zIndex: 10 }}
                >
                  <div style={{ width: 4, height: 24, borderRadius: 999, background: 'rgba(255,255,255,0.4)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 11, color: '#8e8e93', flexWrap: 'wrap' }}>
          {allocations.map(a => (
            <span key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: `rgb(${a.color})` }} />
              {a.name}: {a.workingDays}d
            </span>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '18px 0 0' }}>
        Example plan shown for preview — drag the date handle or a phase divider to see the split recalculate live.
      </p>
    </div>
  );
}
