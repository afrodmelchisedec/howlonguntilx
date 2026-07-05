// FILE: src/components/pro-tools/RunwayLab.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { RUNWAY_LAB_COMMENTS } from '@/lib/seedComments';

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

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function RunwayLab() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();

  const [daysToPayday, setDaysToPayday] = useState(14);
  const [income, setIncome] = useState(2400);
  const [fixedExpenses, setFixedExpenses] = useState(1400);
  const [splits, setSplits] = useState<Splits>(DEFAULT_SPLITS);
  const [spentToday, setSpentToday] = useState(0);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(128);

  const barRef = useRef<HTMLDivElement>(null);
  const dragSegment = useRef<number | null>(null);

  const discretionary = Math.max(income - fixedExpenses, 0);
  const dailyBudget = discretionary / Math.max(daysToPayday, 1);
  const remainingAfterToday = discretionary - spentToday;

  const fixedRatio = income > 0 ? fixedExpenses / income : 1;
  const health: Health = fixedRatio > 0.8 || dailyBudget < 15
    ? 'danger'
    : fixedRatio > 0.6 || dailyBudget < 35
      ? 'tight'
      : 'safe';

  const healthLabel: Record<Health, string> = {
    safe: '✅ Healthy runway',
    tight: '⚠️ Getting tight',
    danger: '🚨 High risk',
  };

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 260);
    return () => clearTimeout(t);
  }, [daysToPayday, income, fixedExpenses, spentToday]);

  // Keep fixedExpenses within [0, income] whenever income shrinks —
  // prevents fixedExpenses > income, which would break the fixedRatio math.
  useEffect(() => {
    setFixedExpenses(prev => Math.min(prev, income));
  }, [income]);

  // Keep spentToday within [0, discretionary] whenever income or fixedExpenses
  // change — prevents spentToday > its own slider max, which was causing the
  // fill bar to render past 100% width and overflow the card.
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

  const CHART_W = 560;
  const CHART_H = 180;
  const maxBalance = Math.max(...chartData.map(p => p.balance), 1);

  const pathD = useMemo(() => {
    if (chartData.length < 2) return '';
    const stepX = CHART_W / (chartData.length - 1);
    const pts = chartData.map((p, i) => {
      const x = i * stepX;
      const y = CHART_H - (p.balance / maxBalance) * (CHART_H - 20) - 10;
      return `${x},${y}`;
    });
    return `M0,${CHART_H} L${pts.join(' L')} L${CHART_W},${CHART_H} Z`;
  }, [chartData, maxBalance]);

  const lineD = useMemo(() => {
    if (chartData.length < 2) return '';
    const stepX = CHART_W / (chartData.length - 1);
    return chartData.map((p, i) => {
      const x = i * stepX;
      const y = CHART_H - (p.balance / maxBalance) * (CHART_H - 20) - 10;
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

  function requireAuth() {
    showToast('You need to sign up first', '🔒');
  }

  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => {
      setToolLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
  }

  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const glowRgb = HEALTH_COLOR[health];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div
        className="ios-card p-6 sm:p-8 transition-all duration-500"
        style={{ boxShadow: `0 0 0 1.5px rgba(${glowRgb}, 0.35), 0 0 40px rgba(${glowRgb}, 0.15)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${glowRgb})` }}>RUNWAY LAB</p>
            <h2 className="text-title2">Payday Budget Simulator</h2>
          </div>
          <div className="pill press transition-all duration-500" style={{ background: `rgba(${glowRgb}, 0.15)`, color: `rgb(${glowRgb})` }}>
            {healthLabel[health]}
          </div>
        </div>

        {/* Live headline numbers */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: 'Daily budget', value: fmtMoney(dailyBudget) },
            { label: 'Discretionary', value: fmtMoney(discretionary) },
            { label: 'Days left', value: String(daysToPayday) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200"
                style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${glowRgb})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-5 mb-7">
          <SliderRow label="Days until payday" value={daysToPayday} min={1} max={30} step={1}
            display={`${daysToPayday}d`} glow={glowRgb} onChange={setDaysToPayday} />
          <SliderRow label="Income this period" value={income} min={0} max={120000} step={500}
            display={fmtMoney(income)} glow={glowRgb} onChange={setIncome} />
          <SliderRow label="Fixed expenses (rent, bills, etc.)" value={fixedExpenses} min={0} max={income} step={50}
            display={fmtMoney(fixedExpenses)} glow={glowRgb} onChange={setFixedExpenses} />
          <SliderRow label="Already spent today" value={spentToday} min={0} max={Math.max(discretionary, 1)} step={10}
            display={fmtMoney(spentToday)} glow={glowRgb} onChange={setSpentToday} />
        </div>

        {/* Drag-to-split budget bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Split your discretionary spend</p>
            <p className="text-caption">drag the dividers →</p>
          </div>
          <div ref={barRef} className="relative w-full h-12 rounded-2xl overflow-hidden flex select-none"
            style={{ border: '1px solid var(--border-hairline)' }}>
            {SEGMENT_ORDER.map((key, i) => {
              const meta = SEGMENT_META[key];
              return (
                <div key={key} className="relative flex items-center justify-center transition-all duration-150"
                  style={{
                    width: `${splits[key]}%`,
                    background: `rgba(${meta.color}, 0.28)`,
                    borderRight: i < SEGMENT_ORDER.length - 1 ? '2px solid var(--bg-base)' : 'none',
                  }}>
                  {splits[key] > 8 && (
                    <span className="text-xs font-bold whitespace-nowrap" style={{ color: `rgb(${meta.color})` }}>
                      {meta.emoji} {Math.round(splits[key])}%
                    </span>
                  )}
                  {i < SEGMENT_ORDER.length - 1 && (
                    <div onPointerDown={() => { dragSegment.current = i; }}
                      className="absolute top-0 right-0 h-full w-4 -mr-2 cursor-ew-resize flex items-center justify-center z-10"
                      style={{ touchAction: 'none' }}>
                      <div className="w-1 h-6 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {SEGMENT_ORDER.map(key => {
              const meta = SEGMENT_META[key];
              const amount = (splits[key] / 100) * discretionary;
              return (
                <div key={key} className="text-center">
                  <div className="text-footnote font-bold tabular" style={{ color: `rgb(${meta.color})` }}>{fmtMoney(amount)}</div>
                  <div className="text-caption">{meta.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Projected balance until payday</p>
            {runsOutEarly && (
              <span className="text-caption font-bold" style={{ color: `rgb(${HEALTH_COLOR.danger})` }}>
                Runs out on day {zeroDay}
              </span>
            )}
          </div>
          <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="w-full transition-all duration-300"
            style={{ filter: `drop-shadow(0 0 8px rgba(${glowRgb}, 0.35))` }}>
            <defs>
              <linearGradient id="runwayFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${glowRgb})`} stopOpacity="0.35" />
                <stop offset="100%" stopColor={`rgb(${glowRgb})`} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={pathD} fill="url(#runwayFill)" style={{ transition: 'all 0.25s ease-out' }} />
            <path d={lineD} fill="none" stroke={`rgb(${glowRgb})`} strokeWidth={2.5} strokeLinecap="round"
              style={{ transition: 'all 0.25s ease-out' }} />
            <line x1="0" y1={CHART_H - 10} x2={CHART_W} y2={CHART_H - 10} stroke="var(--border-hairline)" strokeDasharray="4 4" />
          </svg>
        </div>

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? `rgb(${glowRgb})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
              {toolLiked ? '❤️' : '🤍'}
            </span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      {/* Comments waterfall */}
      <ToolCommentSection seedComments={RUNWAY_LAB_COMMENTS} onRequireAuth={requireAuth} glow={glowRgb} />

      <ToastHost toast={toast} />
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, display, glow, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; glow: string; onChange: (v: number) => void;
}) {
  const rawPct = ((value - min) / (max - min)) * 100;
  const pct = Number.isFinite(rawPct) ? Math.min(100, Math.max(0, rawPct)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{label}</p>
        <p className="text-footnote font-bold tabular" style={{ color: `rgb(${glow})` }}>{display}</p>
      </div>
      <div className="relative h-2 rounded-full" style={{ background: 'var(--border-hairline)' }}>
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, background: `rgb(${glow})`, boxShadow: `0 0 10px rgba(${glow}, 0.6)` }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer" style={{ height: '100%', touchAction: 'none' }} />
        <div className="absolute top-1/2 rounded-full transition-all duration-100 pointer-events-none"
          style={{
            left: `${pct}%`, width: 18, height: 18, transform: 'translate(-50%, -50%)',
            background: 'white', border: `2px solid rgb(${glow})`, boxShadow: `0 0 10px rgba(${glow}, 0.7)`,
          }} />
      </div>
    </div>
  );
}
