// FILE: src/components/pro-tools/SavingsGoalSlider.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { SAVINGS_GOAL_COMMENTS } from './savingsGoalComments';

interface Goal {
  id: string;
  name: string;
  emoji: string;
  percent: number;
  color: string;
  target: number;
  saved: number;
  locked: boolean;
}

const GLOW = '52, 199, 89';
const MIN_GOALS = 2;
const MAX_GOALS = 6;
const MONTHLY_MIN = 100;
const FREE_MAX_MONTHLY = 2000;
const PRO_MAX_MONTHLY = 20000;
const DEFAULT_MONTHLY = 800;

const DEFAULT_GOALS: Goal[] = [
  { id: 'vacation',  name: 'Vacation',        emoji: '🏖️', percent: 40, color: '255, 159, 10',  target: 3000, saved: 500,  locked: false },
  { id: 'emergency', name: 'Emergency Fund',  emoji: '🛟', percent: 45, color: '100, 200, 255', target: 6000, saved: 1200, locked: false },
  { id: 'gift',      name: 'Gift',            emoji: '🎁', percent: 15, color: '255, 122, 165', target: 500,  saved: 0,    locked: false },
];

const GOAL_TEMPLATES = [
  { name: 'Vacation',           emoji: '🏖️', target: 3000,  saved: 0, color: '255, 159, 10' },
  { name: 'Emergency Fund',     emoji: '🛟', target: 6000,  saved: 0, color: '100, 200, 255' },
  { name: 'Gift',                emoji: '🎁', target: 500,   saved: 0, color: '255, 122, 165' },
  { name: 'New Car',             emoji: '🚗', target: 15000, saved: 0, color: '196, 132, 252' },
  { name: 'Wedding',             emoji: '💍', target: 12000, saved: 0, color: '120, 220, 200' },
  { name: 'House Down Payment',  emoji: '🏡', target: 40000, saved: 0, color: '255, 90, 70' },
  { name: 'Education',           emoji: '🎓', target: 20000, saved: 0, color: '255, 214, 10' },
];
const EXTRA_COLORS = ['196, 132, 252', '120, 220, 200', '255, 90, 70', '255, 214, 10'];

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function formatMonths(m: number): string {
  if (!isFinite(m)) return '—';
  if (m <= 0) return 'Reached! 🎉';
  if (m < 12) return `${m} mo`;
  const y = Math.floor(m / 12);
  const r = m % 12;
  return r ? `${y}y ${r}mo` : `${y}y`;
}

// ---- inline editable goal name ----
function EditableGoalName({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);

  function commit() {
    const trimmed = draft.trim();
    onCommit(trimmed.length > 0 ? trimmed : value);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 5)}ch` }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-footnote font-bold press underline decoration-dotted underline-offset-2"
      title="Click to rename"
    >
      {value}
    </button>
  );
}

// ---- inline editable dollar amount ----
function EditableAmount({ value, onCommit, colorRgb, label }: { value: number; onCommit: (v: number) => void; colorRgb: string; label?: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);

  function commit() {
    const parsed = Math.max(0, Math.round(Number(draft.replace(/[^0-9.]/g, '')) || 0));
    onCommit(parsed);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); }
        }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 6)}ch` }}
      />
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular"
      title={label ? `Click to edit ${label}` : 'Click to edit'}
    >
      {formatMoney(value)}
    </button>
  );
}

export function SavingsGoalSlider() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxMonthly = isPro ? PRO_MAX_MONTHLY : FREE_MAX_MONTHLY;

  const [monthlyTotal, setMonthlyTotal] = useState(DEFAULT_MONTHLY);
  const [goals, setGoals] = useState<Goal[]>(DEFAULT_GOALS);
  const [draggingSlider, setDraggingSlider] = useState(false);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(41);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragDivider = useRef<number | null>(null);
  const toastedSliderDrag = useRef(false);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [monthlyTotal]);

  // Clamp on mount and whenever tier changes
  useEffect(() => {
    setMonthlyTotal(prev => Math.min(prev, maxMonthly));
  }, [maxMonthly]);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/savings-goal-slider')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setMonthlyTotal(Math.min(data.config.monthlyTotal, PRO_MAX_MONTHLY));
          if (Array.isArray(data.config.goals) && data.config.goals.length >= MIN_GOALS) {
            setGoals(data.config.goals);
          }
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  function monthlyFor(g: Goal): number {
    return (g.percent / 100) * monthlyTotal;
  }
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

  const activeGoals = useMemo(() => goals.filter(g => g.target - g.saved > 0), [goals]);
  const fastest = useMemo(
    () => activeGoals.length ? activeGoals.reduce((best, g) => monthsFor(g) < monthsFor(best) ? g : best) : null,
    [activeGoals, monthlyTotal]
  );
  const frozenGoals = useMemo(
    () => goals.filter(g => g.target - g.saved > 0 && monthlyFor(g) < 15),
    [goals, monthlyTotal]
  );

  // ---- monthly-total slider drag ----
  function applyMonthlyTotal(next: number) {
    const clamped = Math.max(MONTHLY_MIN, Math.min(next, maxMonthly));
    if (!isPro && next > FREE_MAX_MONTHLY && !toastedSliderDrag.current) {
      showToast(`Upgrade to Pro to plan with more than ${formatMoney(FREE_MAX_MONTHLY)}/mo`, '⭐');
      toastedSliderDrag.current = true;
    }
    setMonthlyTotal(clamped);
  }

  const handleSliderPointerMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = Math.round(MONTHLY_MIN + ratio * (maxMonthly - MONTHLY_MIN));
    applyMonthlyTotal(next);
  }, [maxMonthly, isPro]);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (draggingSlider) handleSliderPointerMove(e.clientX); }
    function onUp() { setDraggingSlider(false); toastedSliderDrag.current = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [draggingSlider, handleSliderPointerMove]);

  // ---- goal split bar drag ----
  function handleDividerPointerDown(i: number) {
    if (goals[i].locked || goals[i + 1].locked) {
      showToast("Unlock both goals to adjust this divider", '🔒');
      return;
    }
    dragDivider.current = i;
  }

  const handleBarPointerMove = useCallback((clientX: number) => {
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
    function onMove(e: PointerEvent) { handleBarPointerMove(e.clientX); }
    function onUp() { dragDivider.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handleBarPointerMove]);

  function addGoal() {
    if (!isPro) { showToast('Upgrade to Pro to add more goals', '⭐'); return; }
    if (goals.length >= MAX_GOALS) { showToast(`You can have up to ${MAX_GOALS} goals`, '⚠️'); return; }
    setGoals(prev => {
      const usedNames = new Set(prev.map(g => g.name));
      const template = GOAL_TEMPLATES.find(t => !usedNames.has(t.name));
      const unlocked = prev.filter(g => !g.locked);
      const donor = [...(unlocked.length ? unlocked : prev)].sort((a, b) => b.percent - a.percent)[0];
      const take = Math.min(15, Math.floor(donor.percent / 2));
      const next = prev.map(g => g.id === donor.id ? { ...g, percent: g.percent - take } : g);
      const tpl = template ?? { name: `Goal ${prev.length + 1}`, emoji: '🎯', target: 1000, saved: 0, color: EXTRA_COLORS[prev.length % EXTRA_COLORS.length] };
      next.push({ id: `goal-${Date.now()}`, name: tpl.name, emoji: tpl.emoji, target: tpl.target, saved: tpl.saved, percent: take, color: tpl.color, locked: false });
      return next;
    });
  }

  function removeGoal(id: string) {
    setGoals(prev => {
      if (prev.length <= MIN_GOALS) return prev;
      const removed = prev.find(g => g.id === id);
      if (!removed) return prev;
      const rest = prev.filter(g => g.id !== id);
      const unlockedRest = rest.filter(g => !g.locked);
      const pool = unlockedRest.length ? unlockedRest : rest;
      const share = removed.percent / pool.length;
      return rest.map(g => pool.includes(g) ? { ...g, percent: g.percent + share } : g);
    });
  }

  function renameGoal(id: string, name: string) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  }

  function updateGoalField(id: string, field: 'target' | 'saved', value: number) {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g));
  }

  function toggleLock(id: string) {
    if (!isPro) { showToast("Upgrade to Pro to lock a goal's allocation", '⭐'); return; }
    setGoals(prev => prev.map(g => g.id === id ? { ...g, locked: !g.locked } : g));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/savings-goal-slider', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyTotal, goals }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Setup saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function handleReset() {
    setMonthlyTotal(DEFAULT_MONTHLY);
    setGoals(DEFAULT_GOALS);
    showToast('Reset to defaults', '↺');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

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

  function handleCopyPlan() {
    const lines = [
      `Monthly savings: ${formatMoney(monthlyTotal)}`,
      ...goals.map(g =>
        `- ${g.emoji} ${g.name}: ${formatMoney(monthlyFor(g))}/mo → ${formatMoney(g.saved)} of ${formatMoney(g.target)} (${formatMonths(monthsFor(g))})`
      ),
      `Overall progress: ${overallPct}%`,
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Plan copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const sliderRatio = (monthlyTotal - MONTHLY_MIN) / (maxMonthly - MONTHLY_MIN);
  const atFreeLimit = !isPro && monthlyTotal >= FREE_MAX_MONTHLY;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>SAVINGS GOAL ALLOCATION SLIDER</p>
            <h2 className="text-title2">Goal Stack Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              ↺ Reset
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this setup to your account' : 'Upgrade to save your setup'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Monthly savings', value: formatMoney(monthlyTotal) },
            { label: 'Active goals', value: String(goals.length) },
            { label: 'Fastest goal', value: fastest ? formatMonths(monthsFor(fastest)) : '—' },
            { label: 'Overall progress', value: `${overallPct}%` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200"
                style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Monthly total slider */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag to set your total monthly savings</p>
            <p className="text-footnote font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{formatMoney(monthlyTotal)}/mo</p>
          </div>
          <div ref={sliderRef} className="relative h-3 rounded-full" style={{ background: 'var(--border-hairline)', touchAction: 'none' }}>
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
              style={{ width: `${sliderRatio * 100}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 10px rgba(${GLOW}, 0.6)` }} />
            {!isPro && (
              <div className="absolute top-1/2 w-0.5 h-5" style={{
                left: `${((FREE_MAX_MONTHLY - MONTHLY_MIN) / (maxMonthly - MONTHLY_MIN)) * 100}%`,
                transform: 'translate(-50%, -50%)', background: 'rgba(var(--accent-orange), 0.6)',
              }} />
            )}
            <div
              onPointerDown={() => setDraggingSlider(true)}
              className="absolute top-1/2 rounded-full cursor-grab"
              style={{
                left: `${sliderRatio * 100}%`, width: 22, height: 22, transform: 'translate(-50%, -50%)',
                background: 'white', border: `3px solid rgb(${GLOW})`, boxShadow: `0 0 10px rgba(${GLOW}, 0.7)`, touchAction: 'none',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-caption">Min {formatMoney(MONTHLY_MIN)}</span>
            <span className="text-caption">{formatMoney(maxMonthly)}/mo{!isPro ? ` (Pro: ${formatMoney(PRO_MAX_MONTHLY)})` : ''}</span>
          </div>
        </div>

        {/* Frozen-goal warnings */}
        {frozenGoals.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {frozenGoals.map(g => (
              <div key={g.id} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">🥶</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{g.name}</strong> is only getting <strong>{formatMoney(monthlyFor(g))}/mo</strong> — at that rate it'll take a very long time to reach {formatMoney(g.target)}.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Goal split bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Split your monthly savings across goals</p>
            <p className="text-caption">drag the dividers →</p>
          </div>
          <div ref={barRef} className="relative w-full h-12 rounded-2xl overflow-hidden flex select-none"
            style={{ border: '1px solid var(--border-hairline)' }}>
            {goals.map((g, i) => (
              <div key={g.id} className="relative flex items-center justify-center transition-all duration-150"
                style={{
                  width: `${g.percent}%`,
                  background: `rgba(${g.color}, 0.28)`,
                  borderRight: i < goals.length - 1 ? '2px solid var(--bg-base)' : 'none',
                }}>
                {g.percent > 8 && (
                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: `rgb(${g.color})` }}>
                    {g.emoji} {formatMoney(monthlyFor(g))}
                  </span>
                )}
                {i < goals.length - 1 && (
                  <div onPointerDown={() => handleDividerPointerDown(i)}
                    className="absolute top-0 right-0 h-full w-4 -mr-2 flex items-center justify-center z-10"
                    style={{ touchAction: 'none', cursor: (g.locked || goals[i + 1].locked) ? 'not-allowed' : 'ew-resize' }}>
                    {(g.locked || goals[i + 1].locked) ? (
                      <span className="text-[10px]">🔒</span>
                    ) : (
                      <div className="w-1 h-6 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Goal cards */}
        <div className="flex flex-col gap-2 mb-4">
          {goals.map(g => {
            const funded = Math.min(100, Math.round((g.saved / Math.max(g.target, 1)) * 100));
            return (
              <div key={g.id} className="ios-card-nested p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{g.emoji}</span>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: `rgb(${g.color})` }} />
                    <EditableGoalName value={g.name} onCommit={v => renameGoal(g.id, v)} colorRgb={g.color} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleLock(g.id)}
                      className="press text-caption"
                      title={isPro ? (g.locked ? "Unlock allocation" : "Lock allocation") : "Upgrade to Pro to lock"}
                    >
                      {g.locked ? '🔒' : isPro ? '🔓' : '🔒'}
                    </button>
                    {goals.length > MIN_GOALS && (
                      <button onClick={() => removeGoal(g.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 text-footnote">
                  <span>
                    Saved <EditableAmount value={g.saved} onCommit={v => updateGoalField(g.id, 'saved', v)} colorRgb={g.color} label="saved amount" />
                    {' '}of <EditableAmount value={g.target} onCommit={v => updateGoalField(g.id, 'target', v)} colorRgb={g.color} label="target amount" />
                  </span>
                  <span className="font-bold tabular" style={{ color: `rgb(${g.color})` }}>{formatMoney(monthlyFor(g))}/mo</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${funded}%`, background: `rgb(${g.color})` }} />
                </div>
                <div className="flex items-center justify-between text-caption">
                  <span>{funded}% funded</span>
                  <span className="font-semibold">{formatMonths(monthsFor(g))}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-7">
          <button
            onClick={addGoal}
            className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
            style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: goals.length >= MAX_GOALS ? 0.5 : 1 }}
          >
            {isPro ? '+' : '🔒'} Add goal
          </button>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
            📋 Copy plan
          </button>
        </div>

        {/* Free-tier banner */}
        {!isPro && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{
              border: atFreeLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)',
              boxShadow: atFreeLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none',
            }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : '🔒 Free plan: 3 goals, $2,000/mo cap'}</p>
              <p className="text-caption">Upgrade to Premium to plan up to {formatMoney(PRO_MAX_MONTHLY)}/mo, add up to {MAX_GOALS} goals, lock allocations, and save your setup.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
              {toolLiked ? '❤️' : '🤍'}
            </span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      {/* Comments waterfall */}
      <ToolCommentSection seedComments={SAVINGS_GOAL_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
