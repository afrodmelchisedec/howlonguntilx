// FILE: src/components/embeds/SavingsGoalSliderEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

const GLOW = '52, 199, 89';
const MONTHLY_MIN = 100;
const FREE_MAX_MONTHLY = 2000;
const DEFAULT_MONTHLY = 800;

interface Goal { id: string; name: string; emoji: string; percent: number; color: string; target: number; saved: number; }
const DEFAULT_GOALS: Goal[] = [
  { id: 'vacation',  name: 'Vacation',       emoji: '🏖️', percent: 40, color: '255, 159, 10',  target: 3000, saved: 500 },
  { id: 'emergency', name: 'Emergency Fund', emoji: '🛟', percent: 45, color: '100, 200, 255', target: 6000, saved: 1200 },
  { id: 'gift',      name: 'Gift',           emoji: '🎁', percent: 15, color: '255, 122, 165', target: 500,  saved: 0 },
];

function formatMoney(n: number): string { return `$${Math.round(n).toLocaleString('en-US')}`; }
function formatMonths(m: number): string {
  if (!isFinite(m)) return '—';
  if (m <= 0) return 'Reached! 🎉';
  if (m < 12) return `${m} mo`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${y}y ${r}mo` : `${y}y`;
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function SavingsGoalSliderEmbed() {
  const [monthlyTotal, setMonthlyTotal] = useState(DEFAULT_MONTHLY);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [draggingSlider, setDraggingSlider] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragDivider = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  function monthlyFor(g: Goal): number { return (g.percent / 100) * monthlyTotal; }
  function monthsFor(g: Goal): number {
    const remaining = Math.max(g.target - g.saved, 0);
    if (remaining === 0) return 0;
    const m = monthlyFor(g);
    if (m <= 0) return Infinity;
    return Math.ceil(remaining / m);
  }

  const totalTarget = useMemo(() => goals.reduce((a, g) => a + g.target, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((a, g) => a + g.saved, 0), [goals]);
  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;
  const frozenGoals = goals.filter(g => g.target - g.saved > 0 && monthlyFor(g) < 15);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = Math.round(MONTHLY_MIN + ratio * (FREE_MAX_MONTHLY - MONTHLY_MIN));
    setMonthlyTotal(Math.max(MONTHLY_MIN, Math.min(next, FREE_MAX_MONTHLY)));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (draggingSlider) handleSliderMove(e.clientX); }
    function onUp() { setDraggingSlider(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [draggingSlider, handleSliderMove]);

  function handleDividerDown(i: number) { dragDivider.current = i; forceRender(x => x + 1); }
  const handleBarMove = useCallback((clientX: number) => {
    if (dragDivider.current === null || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setGoals(prev => {
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
    function onMove(e: PointerEvent) { handleBarMove(e.clientX); }
    function onUp() { dragDivider.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleBarMove]);

  const sliderRatio = (monthlyTotal - MONTHLY_MIN) / (FREE_MAX_MONTHLY - MONTHLY_MIN);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>GOAL STACK PLANNER</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Split your monthly savings</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>Drag to set total monthly savings</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: `rgb(${GLOW})` }}>{formatMoney(monthlyTotal)}/mo</span>
      </div>
      <div ref={sliderRef} style={{ position: 'relative', height: 10, borderRadius: 999, background: '#2a2a30', touchAction: 'none', marginBottom: 16 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: 999, width: `${sliderRatio * 100}%`, background: `rgb(${GLOW})` }} />
        <div
          onPointerDown={() => setDraggingSlider(true)}
          style={{ position: 'absolute', top: '50%', left: `${sliderRatio * 100}%`, width: 20, height: 20, transform: 'translate(-50%, -50%)', borderRadius: '50%', background: 'white', border: `3px solid rgb(${GLOW})`, cursor: 'grab', touchAction: 'none' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6 }}>
        <span>Drag the dividers →</span>
      </div>
      <div ref={barRef} style={{ position: 'relative', width: '100%', height: 46, borderRadius: 14, overflow: 'hidden', display: 'flex', border: '1px solid #3a3a40', marginBottom: 12, marginTop: 4 }}>
        {goals.map((g, i) => (
          <div key={g.id} style={{ width: `${g.percent}%`, background: `rgba(${g.color}, 0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRight: i < goals.length - 1 ? '2px solid #1a1a1e' : 'none' }}>
            {g.percent > 10 && <span style={{ fontSize: 11, fontWeight: 700, color: `rgb(${g.color})`, whiteSpace: 'nowrap' }}>{g.emoji} {formatMoney(monthlyFor(g))}</span>}
            {i < goals.length - 1 && (
              <div onPointerDown={() => handleDividerDown(i)} style={{ position: 'absolute', top: 0, right: -8, height: '100%', width: 16, cursor: 'ew-resize', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ width: 4, height: 24, borderRadius: 999, background: '#888' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {goals.map(g => {
          const funded = Math.min(100, Math.round((g.saved / Math.max(g.target, 1)) * 100));
          return (
            <div key={g.id} style={{ background: '#2a2a30', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span>{g.emoji} {g.name}</span>
                <span style={{ fontWeight: 700, color: `rgb(${g.color})` }}>{formatMonths(monthsFor(g))}</span>
              </div>
              <div style={{ height: 5, borderRadius: 999, background: '#3a3a40', overflow: 'hidden' }}>
                <div style={{ width: `${funded}%`, height: '100%', background: `rgb(${g.color})` }} />
              </div>
            </div>
          );
        })}
      </div>

      {frozenGoals.length > 0 && (
        <div style={{ borderLeft: '3px solid #ff453a', background: 'rgba(255,69,58,0.08)', borderRadius: 8, padding: '10px 12px', fontSize: 12, marginBottom: 12 }}>
          🥶 {frozenGoals.map(g => g.name).join(', ')} {frozenGoals.length === 1 ? 'is' : 'are'} getting very little — allocate more to make real progress.
        </div>
      )}

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>OVERALL PROGRESS</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: `rgb(${GLOW})` }}>{overallPct}%</p>
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example goals shown for preview — drag the slider and dividers to see months-to-goal update live.
      </p>
    </div>
  );
}
