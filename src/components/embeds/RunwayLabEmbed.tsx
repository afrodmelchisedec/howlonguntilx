// FILE: src/components/embeds/RunwayLabEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

type Health = 'safe' | 'tight' | 'danger';
interface Splits { food: number; transport: number; fun: number; other: number }

const DEFAULT_SPLITS: Splits = { food: 40, transport: 20, fun: 25, other: 15 };
const SEGMENT_ORDER: (keyof Splits)[] = ['food', 'transport', 'fun', 'other'];
const SEGMENT_META: Record<keyof Splits, { label: string; emoji: string; color: string }> = {
  food:      { label: 'Food',      emoji: '🍔', color: '88, 214, 113' },
  transport: { label: 'Transport', emoji: '🚗', color: '100, 200, 255' },
  fun:       { label: 'Fun',       emoji: '🎮', color: '196, 132, 252' },
  other:     { label: 'Other',     emoji: '📦', color: '255, 180, 100' },
};

const HEALTH_COLOR: Record<Health, string> = {
  safe:   '52, 199, 89',
  tight:  '255, 159, 10',
  danger: '255, 69, 58',
};
const HEALTH_LABEL: Record<Health, string> = {
  safe: '✅ Healthy runway',
  tight: '⚠️ Getting tight',
  danger: '🚨 High risk',
};

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function RunwayLabEmbed() {
  const [daysToPayday, setDaysToPayday] = useState(14);
  const [income, setIncome] = useState(2400);
  const [fixedExpenses, setFixedExpenses] = useState(1400);
  const [splits, setSplits] = useState<Splits>(DEFAULT_SPLITS);
  const [spentToday, setSpentToday] = useState(0);

  const barRef = useRef<HTMLDivElement>(null);
  const dragSegment = useRef<number | null>(null);
  const [, forceRender] = useState(0);

  const discretionary = Math.max(income - fixedExpenses, 0);
  const dailyBudget = discretionary / Math.max(daysToPayday, 1);
  const remainingAfterToday = discretionary - spentToday;

  const fixedRatio = income > 0 ? fixedExpenses / income : 1;
  const health: Health = fixedRatio > 0.8 || dailyBudget < 15
    ? 'danger'
    : fixedRatio > 0.6 || dailyBudget < 35
      ? 'tight'
      : 'safe';

  const glowRgb = HEALTH_COLOR[health];

  // Keep fixedExpenses and spentToday within valid bounds as income/expenses change
  useEffect(() => { setFixedExpenses(prev => Math.min(prev, income)); }, [income]);
  useEffect(() => {
    const maxDiscretionary = Math.max(income - fixedExpenses, 0);
    setSpentToday(prev => Math.min(prev, maxDiscretionary));
  }, [income, fixedExpenses]);

  const chartData = useMemo(() => {
    const points: { day: number; balance: number }[] = [];
    for (let d = 0; d <= daysToPayday; d++) {
      const balance = Math.max(remainingAfterToday - dailyBudget * d, 0);
      points.push({ day: d, balance });
    }
    return points;
  }, [daysToPayday, dailyBudget, remainingAfterToday]);

  const CHART_W = 380;
  const CHART_H = 120;
  const maxBalance = Math.max(...chartData.map(p => p.balance), 1);

  const pathD = useMemo(() => {
    if (chartData.length < 2) return '';
    const stepX = CHART_W / (chartData.length - 1);
    const pts = chartData.map((p, i) => {
      const x = i * stepX;
      const y = CHART_H - (p.balance / maxBalance) * (CHART_H - 16) - 8;
      return `${x},${y}`;
    });
    return `M0,${CHART_H} L${pts.join(' L')} L${CHART_W},${CHART_H} Z`;
  }, [chartData, maxBalance]);

  const lineD = useMemo(() => {
    if (chartData.length < 2) return '';
    const stepX = CHART_W / (chartData.length - 1);
    return chartData.map((p, i) => {
      const x = i * stepX;
      const y = CHART_H - (p.balance / maxBalance) * (CHART_H - 16) - 8;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }, [chartData, maxBalance]);

  const zeroDay = chartData.findIndex(p => p.balance <= 0);
  const runsOutEarly = zeroDay !== -1 && zeroDay < daysToPayday;

  const handlePointerMove = useCallback((clientX: number) => {
    if (dragSegment.current === null || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setSplits(prev => {
      const idx = dragSegment.current!;
      const keys = SEGMENT_ORDER;
      let cumulative = 0;
      for (let i = 0; i < idx; i++) cumulative += prev[keys[i]];
      const nextCumulative = cumulative + prev[keys[idx]] + prev[keys[idx + 1]];
      const minGap = 4;
      const newBoundary = Math.min(Math.max(pct, cumulative + minGap), nextCumulative - minGap);
      const newLeft = newBoundary - cumulative;
      const newRight = nextCumulative - newBoundary;
      return { ...prev, [keys[idx]]: newLeft, [keys[idx + 1]]: newRight };
    });
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX); }
    function onUp() { dragSegment.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  function handleDividerDown(i: number) { dragSegment.current = i; forceRender(x => x + 1); }

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${glowRgb}, 0.25)`, transition: 'box-shadow 0.4s' };

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${glowRgb})`, marginBottom: 4, fontWeight: 700 }}>RUNWAY LAB</p>
          <p style={{ fontSize: 15, fontWeight: 700 }}>Payday Budget Simulator</p>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: `rgba(${glowRgb}, 0.15)`, color: `rgb(${glowRgb})`, whiteSpace: 'nowrap' }}>
          {HEALTH_LABEL[health]}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Daily budget', value: fmtMoney(dailyBudget) },
          { label: 'Discretionary', value: fmtMoney(discretionary) },
          { label: 'Days left', value: String(daysToPayday) },
        ].map(stat => (
          <div key={stat.label} style={{ background: '#2a2a30', borderRadius: 10, padding: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: `rgb(${glowRgb})` }}>{stat.value}</div>
            <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        <SliderField label="Days until payday" value={daysToPayday} min={1} max={30} step={1}
          display={`${daysToPayday}d`} glow={glowRgb} onChange={setDaysToPayday} />
        <SliderField label="Income this period" value={income} min={0} max={12000} step={100}
          display={fmtMoney(income)} glow={glowRgb} onChange={setIncome} />
        <SliderField label="Fixed expenses" value={fixedExpenses} min={0} max={income} step={50}
          display={fmtMoney(fixedExpenses)} glow={glowRgb} onChange={setFixedExpenses} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Split your discretionary spend</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>drag the dividers →</span>
        </div>
        <div ref={barRef} style={{ position: 'relative', width: '100%', height: 44, borderRadius: 14, overflow: 'hidden', display: 'flex', border: '1px solid #3a3a40', touchAction: 'none' }}>
          {SEGMENT_ORDER.map((key, i) => {
            const meta = SEGMENT_META[key];
            return (
              <div key={key} style={{ position: 'relative', width: `${splits[key]}%`, background: `rgba(${meta.color}, 0.28)`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: i < SEGMENT_ORDER.length - 1 ? '2px solid #1a1a1e' : 'none' }}>
                {splits[key] > 8 && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: `rgb(${meta.color})`, whiteSpace: 'nowrap' }}>
                    {meta.emoji} {Math.round(splits[key])}%
                  </span>
                )}
                {i < SEGMENT_ORDER.length - 1 && (
                  <div onPointerDown={() => handleDividerDown(i)}
                    style={{ position: 'absolute', top: 0, right: -8, height: '100%', width: 16, cursor: 'ew-resize', touchAction: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <div style={{ width: 4, height: 24, borderRadius: 999, background: '#888' }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
          {SEGMENT_ORDER.map(key => {
            const meta = SEGMENT_META[key];
            const amount = (splits[key] / 100) * discretionary;
            return (
              <div key={key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: `rgb(${meta.color})` }}>{fmtMoney(amount)}</div>
                <div style={{ fontSize: 9.5, opacity: 0.6 }}>{meta.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Projected balance until payday</span>
          {runsOutEarly && (
            <span style={{ fontSize: 11, fontWeight: 700, color: `rgb(${HEALTH_COLOR.danger})` }}>
              Runs out day {zeroDay}
            </span>
          )}
        </div>
        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={{ width: '100%', filter: `drop-shadow(0 0 8px rgba(${glowRgb}, 0.35))` }}>
          <defs>
            <linearGradient id="rlFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgb(${glowRgb})`} stopOpacity="0.35" />
              <stop offset="100%" stopColor={`rgb(${glowRgb})`} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={pathD} fill="url(#rlFade)" />
          <path d={lineD} fill="none" stroke={`rgb(${glowRgb})`} strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example numbers shown for preview — drag the sliders and split bar to see your runway update live.
      </p>
    </div>
  );
}

function SliderField({ label, value, min, max, step, display, glow, onChange }: {
  label: string; value: number; min: number; max: number; step: number; display: string; glow: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, opacity: 0.7 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: `rgb(${glow})` }}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: `rgb(${glow})` }}
      />
    </div>
  );
}
