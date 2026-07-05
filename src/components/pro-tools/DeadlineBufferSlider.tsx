// FILE: src/components/pro-tools/DeadlineBufferSlider.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { DEADLINE_BUFFER_COMMENTS } from '@/lib/seedComments';

interface Phase {
  id: string;
  name: string;
  percent: number;
  color: string;
}

interface DayInfo {
  date: Date;
  iso: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isWorking: boolean;
}

const GLOW = '84, 158, 255';
const MIN_DAYS_OUT = 5;
const FREE_MAX_DAYS_OUT = 30;
const PRO_MAX_DAYS_OUT = 180;
const DEFAULT_DAYS_OUT = 21;
const MIN_PHASES = 2;
const MAX_PHASES = 5;

const DEFAULT_PHASES: Phase[] = [
  { id: 'design', name: 'Design',      percent: 25, color: '196, 132, 252' },
  { id: 'dev',    name: 'Development', percent: 50, color: '100, 200, 255' },
  { id: 'qa',     name: 'QA',          percent: 25, color: '88, 214, 113' },
];
const EXTRA_COLORS = ['255, 180, 100', '255, 122, 165', '120, 220, 200'];

function todayAtMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtDateFull(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function buildDays(start: Date, daysOut: number, holidays: Set<string>): DayInfo[] {
  const days: DayInfo[] = [];
  for (let i = 0; i <= daysOut; i++) {
    const date = addDays(start, i);
    const iso = toISODate(date);
    const dow = date.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = holidays.has(iso);
    days.push({ date, iso, isWeekend, isHoliday, isWorking: !isWeekend && !isHoliday });
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
  const fracOrder = rawCounts
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    counts[fracOrder[k % Math.max(fracOrder.length, 1)].i] += 1;
  }

  const dayPhaseIndex = new Map<string, number>();
  let phaseIdx = 0;
  let remaining = counts[0] ?? 0;
  const startDates: (Date | null)[] = phases.map(() => null);
  const endDates: (Date | null)[] = phases.map(() => null);

  for (const d of workingDays) {
    while (remaining === 0 && phaseIdx < phases.length - 1) {
      phaseIdx += 1;
      remaining = counts[phaseIdx];
    }
    dayPhaseIndex.set(d.iso, phaseIdx);
    if (startDates[phaseIdx] === null) startDates[phaseIdx] = d.date;
    endDates[phaseIdx] = d.date;
    remaining -= 1;
  }

  const allocations = phases.map((p, i) => ({
    ...p,
    workingDays: counts[i] ?? 0,
    startDate: startDates[i],
    endDate: endDates[i],
  }));

  return { allocations, dayPhaseIndex, totalWorkingDays: total };
}

// ---- inline editable phase name ----
function EditablePhaseName({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
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

export function DeadlineBufferSlider() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxDaysOut = isPro ? PRO_MAX_DAYS_OUT : FREE_MAX_DAYS_OUT;

  const today = useMemo(() => todayAtMidnight(), []);
  const todayIso = useMemo(() => toISODate(today), [today]);

  const [daysOut, setDaysOut] = useState(DEFAULT_DAYS_OUT);
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const [holidays, setHolidays] = useState<Set<string>>(new Set());
  const [draggingSlider, setDraggingSlider] = useState(false);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(63);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dragDivider = useRef<number | null>(null);
  const toastedSliderDrag = useRef(false);
  const phaseCounter = useRef(0);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [daysOut]);

  // Clamp on mount and whenever tier changes
  useEffect(() => {
    setDaysOut(prev => Math.min(prev, maxDaysOut));
  }, [maxDaysOut]);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/deadline-buffer')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setDaysOut(Math.min(data.config.daysOut, PRO_MAX_DAYS_OUT));
          if (Array.isArray(data.config.phases) && data.config.phases.length >= MIN_PHASES) {
            setPhases(data.config.phases);
          }
          if (Array.isArray(data.config.holidays)) {
            setHolidays(new Set(data.config.holidays));
          }
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const launchDate = useMemo(() => addDays(today, daysOut), [today, daysOut]);
  const days = useMemo(() => buildDays(today, daysOut, holidays), [today, daysOut, holidays]);
  const { allocations, dayPhaseIndex, totalWorkingDays } = useMemo(
    () => allocatePhases(days, phases), [days, phases]
  );

  const weekendCount = useMemo(() => days.filter(d => d.isWeekend).length, [days]);
  const holidayCount = useMemo(() => days.filter(d => d.isHoliday).length, [days]);

  const health: 'safe' | 'tight' | 'danger' =
    totalWorkingDays < 5 ? 'danger' : totalWorkingDays < 10 ? 'tight' : 'safe';
  const healthLabel = { safe: '✅ Comfortable runway', tight: '⚠️ Getting tight', danger: '🚨 Very tight timeline' }[health];
  const healthColor = { safe: '52, 199, 89', tight: '255, 159, 10', danger: '255, 69, 58' }[health];

  const tightPhases = useMemo(() => allocations.filter(a => a.workingDays > 0 && a.workingDays < 2), [allocations]);

  // ---- slider drag ----
  function applyDaysOut(next: number) {
    const clamped = Math.max(MIN_DAYS_OUT, Math.min(next, maxDaysOut));
    if (!isPro && next > FREE_MAX_DAYS_OUT && !toastedSliderDrag.current) {
      showToast(`Upgrade to Pro to plan launches more than ${FREE_MAX_DAYS_OUT} days out`, '⭐');
      toastedSliderDrag.current = true;
    }
    setDaysOut(clamped);
  }

  const handleSliderPointerMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const next = Math.round(MIN_DAYS_OUT + ratio * (maxDaysOut - MIN_DAYS_OUT));
    applyDaysOut(next);
  }, [maxDaysOut, isPro]);

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

  // ---- phase split bar drag ----
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
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handleBarPointerMove]);

  function addPhase() {
    if (!isPro) { showToast('Upgrade to Pro to add custom phases', '⭐'); return; }
    if (phases.length >= MAX_PHASES) { showToast(`You can have up to ${MAX_PHASES} phases`, '⚠️'); return; }
    setPhases(prev => {
      const usedColors = new Set(prev.map(p => p.color));
      const color = EXTRA_COLORS.find(c => !usedColors.has(c)) ?? EXTRA_COLORS[prev.length % EXTRA_COLORS.length];
      const donor = [...prev].sort((a, b) => b.percent - a.percent)[0];
      const take = Math.min(15, Math.floor(donor.percent / 2));
      const next = prev.map(p => p.id === donor.id ? { ...p, percent: p.percent - take } : p);
      phaseCounter.current += 1;
      next.push({ id: `phase-${Date.now()}`, name: `Phase ${phaseCounter.current}`, percent: take, color });
      return next;
    });
  }

  function removePhase(id: string) {
    setPhases(prev => {
      if (prev.length <= MIN_PHASES) return prev;
      const removed = prev.find(p => p.id === id);
      if (!removed) return prev;
      const rest = prev.filter(p => p.id !== id);
      const share = removed.percent / rest.length;
      return rest.map(p => ({ ...p, percent: p.percent + share }));
    });
  }

  function renamePhase(id: string, name: string) {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }

  function toggleHolidayForDay(day: DayInfo) {
    if (day.isWeekend) return;
    if (!isPro) { showToast('Upgrade to Pro to mark custom holidays', '⭐'); return; }
    setHolidays(prev => {
      const next = new Set(prev);
      if (next.has(day.iso)) next.delete(day.iso); else next.add(day.iso);
      return next;
    });
  }

  // ---- calendar heatmap grid ----
  const grid = useMemo(() => {
    const cells: (DayInfo | null)[] = [];
    const leading = today.getDay();
    for (let i = 0; i < leading; i++) cells.push(null);
    for (const d of days) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [days, today]);

  const weeks = useMemo(() => {
    const rows: (DayInfo | null)[][] = [];
    for (let i = 0; i < grid.length; i += 7) rows.push(grid.slice(i, i + 7));
    return rows;
  }, [grid]);

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/deadline-buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysOut, phases, holidays: Array.from(holidays) }),
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
    setDaysOut(DEFAULT_DAYS_OUT);
    setPhases(DEFAULT_PHASES);
    setHolidays(new Set());
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

  function handleCopySchedule() {
    const lines = [
      `Launch: ${fmtDateFull(launchDate)} (${daysOut} calendar days, ${totalWorkingDays} working days)`,
      ...allocations.map(a =>
        `- ${a.name}: ${a.workingDays} working day${a.workingDays === 1 ? '' : 's'}${a.startDate && a.endDate ? ` (${fmtDate(a.startDate)}–${fmtDate(a.endDate)})` : ''}`
      ),
      `Holidays excluded: ${holidays.size > 0 ? Array.from(holidays).sort().join(', ') : 'none'}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Schedule copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const sliderRatio = (daysOut - MIN_DAYS_OUT) / (maxDaysOut - MIN_DAYS_OUT);
  const atFreeLimit = !isPro && daysOut >= FREE_MAX_DAYS_OUT;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>DEADLINE BUFFER SLIDER</p>
            <h2 className="text-title2">Launch Countdown Planner</h2>
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
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>
              {healthLabel}
            </div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Launch date', value: fmtDate(launchDate) },
            { label: 'Calendar days', value: String(daysOut) },
            { label: 'Working days', value: String(totalWorkingDays) },
            { label: 'Excluded days', value: String(weekendCount + holidayCount) },
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

        {/* Linear launch-date slider */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag to set your launch date</p>
            <p className="text-footnote font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{fmtDateFull(launchDate)}</p>
          </div>
          <div ref={sliderRef} className="relative h-3 rounded-full" style={{ background: 'var(--border-hairline)', touchAction: 'none' }}>
            <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100"
              style={{ width: `${sliderRatio * 100}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 10px rgba(${GLOW}, 0.6)` }} />
            {!isPro && (
              <div className="absolute top-1/2 w-0.5 h-5" style={{
                left: `${((FREE_MAX_DAYS_OUT - MIN_DAYS_OUT) / (maxDaysOut - MIN_DAYS_OUT)) * 100}%`,
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
            <span className="text-caption">Today, {fmtDate(today)}</span>
            <span className="text-caption">{maxDaysOut} days out{!isPro ? ' (Pro: 180)' : ''}</span>
          </div>
        </div>

        {/* Smart tip banners */}
        {tightPhases.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {tightPhases.map(p => (
              <div key={p.id} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">⏱️</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{p.name}</strong> only has <strong>{p.workingDays} working day{p.workingDays === 1 ? '' : 's'}</strong> — that's extremely tight, worth reconsidering the split.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Phase split bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Split your working days across phases</p>
            <p className="text-caption">drag the dividers →</p>
          </div>
          <div ref={barRef} className="relative w-full h-12 rounded-2xl overflow-hidden flex select-none"
            style={{ border: '1px solid var(--border-hairline)' }}>
            {phases.map((p, i) => (
              <div key={p.id} className="relative flex items-center justify-center transition-all duration-150"
                style={{
                  width: `${p.percent}%`,
                  background: `rgba(${p.color}, 0.28)`,
                  borderRight: i < phases.length - 1 ? '2px solid var(--bg-base)' : 'none',
                }}>
                {p.percent > 8 && (
                  <span className="text-xs font-bold whitespace-nowrap" style={{ color: `rgb(${p.color})` }}>
                    {Math.round(p.percent)}%
                  </span>
                )}
                {i < phases.length - 1 && (
                  <div onPointerDown={() => { dragDivider.current = i; }}
                    className="absolute top-0 right-0 h-full w-4 -mr-2 cursor-ew-resize flex items-center justify-center z-10"
                    style={{ touchAction: 'none' }}>
                    <div className="w-1 h-6 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Phase cards */}
        <div className="flex flex-col gap-2 mb-4">
          {allocations.map(a => (
            <div key={a.id} className="ios-card-nested p-3 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: `rgb(${a.color})` }} />
                <EditablePhaseName value={a.name} onCommit={v => renamePhase(a.id, v)} colorRgb={a.color} />
                {a.startDate && a.endDate && (
                  <span className="text-caption">{fmtDate(a.startDate)}–{fmtDate(a.endDate)}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-footnote font-bold tabular" style={{ color: `rgb(${a.color})` }}>
                  {a.workingDays}d
                </span>
                {phases.length > MIN_PHASES && (
                  <button onClick={() => removePhase(a.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-7">
          <button
            onClick={addPhase}
            className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
            style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: phases.length >= MAX_PHASES ? 0.5 : 1 }}
          >
            {isPro ? '+' : '🔒'} Add phase
          </button>
          <button onClick={handleCopySchedule} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
            📋 Copy schedule
          </button>
        </div>

        {/* Calendar heatmap — click a weekday to mark/unmark a holiday (Pro) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Timeline calendar</p>
            <p className="text-caption">
              {isPro ? 'tap a weekday to mark a holiday' : `${holidayCount} holiday${holidayCount === 1 ? '' : 's'} excluded`}
            </p>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
              <div key={w} className="text-caption text-center py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              if (!cell) return <div key={i} />;
              const phaseIdx = dayPhaseIndex.get(cell.iso);
              const phase = phaseIdx !== undefined ? phases[phaseIdx] : null;
              const bg = cell.isHoliday
                ? 'rgba(255, 90, 70, 0.35)'
                : cell.isWeekend
                  ? 'var(--border-hairline)'
                  : phase ? `rgba(${phase.color}, 0.55)` : 'var(--border-hairline)';
              const isToday = cell.iso === todayIso;
              return (
                <div
                  key={i}
                  onClick={() => toggleHolidayForDay(cell)}
                  title={`${fmtDateFull(cell.date)}${cell.isHoliday ? ' — Holiday' : cell.isWeekend ? ' — Weekend' : phase ? ` — ${phase.name}` : ''}`}
                  className="rounded-md flex items-center justify-center text-[9px] font-bold transition-all duration-150"
                  style={{
                    height: 26,
                    background: bg,
                    color: cell.isHoliday ? 'rgb(255, 90, 70)' : 'var(--text-tertiary)',
                    cursor: cell.isWeekend ? 'default' : 'pointer',
                    border: isToday ? `1.5px solid rgb(${GLOW})` : '1px solid transparent',
                  }}
                >
                  {cell.date.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly working-days bar chart */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Working days per week</p>
          <div className="flex flex-col gap-1.5">
            {weeks.map((row, i) => {
              if (row.every(d => d === null)) return null;
              const workingCount = row.filter(d => d && d.isWorking).length;
              const ratio = workingCount / 5;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-caption w-12 flex-shrink-0">Wk {i + 1}</span>
                  <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div className="h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(ratio * 100, workingCount > 0 ? 10 : 0)}%`,
                        background: `rgb(${GLOW})`,
                        boxShadow: workingCount > 0 ? `0 0 8px rgba(${GLOW}, 0.5)` : 'none',
                      }}>
                      {workingCount > 0 && <span className="text-[10px] font-bold text-white">{workingCount}d</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Free-tier upgrade banner */}
        {atFreeLimit && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: '1.5px solid rgba(var(--accent-orange), 0.4)', boxShadow: '0 0 20px rgba(var(--accent-orange), 0.1)' }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">⭐ You've hit the free limit</p>
              <p className="text-caption">Upgrade to Premium to plan up to {PRO_MAX_DAYS_OUT} days out, add custom phases, mark holidays, and save your setup.</p>
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
      <ToolCommentSection seedComments={DEADLINE_BUFFER_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
