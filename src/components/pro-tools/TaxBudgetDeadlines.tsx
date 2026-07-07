// FILE: src/components/pro-tools/TaxBudgetDeadlines.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { TAX_DEADLINE_COMMENTS } from './taxDeadlineComments';

type Category = 'quarterly' | 'federal' | 'state' | 'other';

interface DeadlineTemplate {
  key: string;
  name: string;
  emoji: string;
  month: number;
  day: number;
  category: Category;
  defaultTarget: number;
}
interface Deadline {
  id: string;
  key: string;
  name: string;
  emoji: string;
  date: string;
  category: Category;
  target: number;
  saved: number;
  custom: boolean;
}

const GLOW = '245, 166, 35';
const CATEGORY_COLORS: Record<Category, string> = {
  quarterly: '245, 166, 35',
  federal: '100, 200, 255',
  state: '196, 132, 252',
  other: '120, 220, 200',
};
const CATEGORY_LABEL: Record<Category, string> = {
  quarterly: 'Quarterly Est.',
  federal: 'Federal',
  state: 'State',
  other: 'Other',
};

const FREE_MAX_DEADLINES = 3;
const PRO_MAX_DEADLINES = 8;
const FREE_SNAP_AMOUNT = 250;
const PRO_SNAP_AMOUNT = 25;
const WINDOW_DAYS = 420;

// Fixed geometry — never derived from live drag values, so the bar you're
// dragging can never re-scale itself mid-gesture.
const TRACK_HEIGHT = 170;
const LABEL_HEIGHT = 42;
const TOP_PADDING = 34;
const CONTAINER_HEIGHT = TRACK_HEIGHT + LABEL_HEIGHT + TOP_PADDING;
const COLUMN_WIDTH = 64;

const TEMPLATES: DeadlineTemplate[] = [
  { key: 'q1',        name: 'Q1 Estimated Tax',       emoji: '📄', month: 4,  day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q2',        name: 'Q2 Estimated Tax',       emoji: '📄', month: 6,  day: 16, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q3',        name: 'Q3 Estimated Tax',       emoji: '📄', month: 9,  day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'q4',        name: 'Q4 Estimated Tax',       emoji: '📄', month: 1,  day: 15, category: 'quarterly', defaultTarget: 2500 },
  { key: 'annual',    name: 'Annual Filing Deadline', emoji: '🗂️', month: 4,  day: 15, category: 'federal',   defaultTarget: 4000 },
  { key: 'extension', name: 'Extension Deadline',     emoji: '⏳', month: 10, day: 15, category: 'federal',   defaultTarget: 0 },
  { key: 'state',     name: 'State Estimated Tax',    emoji: '🏛️', month: 4,  day: 15, category: 'state',     defaultTarget: 1200 },
];

const PRESETS: { label: string; emoji: string; keys: string[] }[] = [
  { label: 'W2 Employee',    emoji: '💼', keys: ['annual', 'state'] },
  { label: 'Self-Employed',  emoji: '🧾', keys: ['q1', 'q2', 'q3', 'q4', 'annual'] },
  { label: 'Business Owner', emoji: '🏢', keys: ['q1', 'q2', 'q3', 'q4', 'annual', 'extension', 'state'] },
];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
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
function buildFromTemplate(tpl: DeadlineTemplate): Deadline {
  return {
    id: `dl-${tpl.key}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    key: tpl.key,
    name: tpl.name,
    emoji: tpl.emoji,
    date: isoDate(nextOccurrence(tpl.month, tpl.day)),
    category: tpl.category,
    target: tpl.defaultTarget,
    saved: 0,
    custom: false,
  };
}
function defaultDeadlines(): Deadline[] {
  return TEMPLATES
    .map(buildFromTemplate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, FREE_MAX_DEADLINES);
}
function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function formatDateLabel(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
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

// ---- inline editable name ----
function EditableName({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
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
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 5)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2" title="Click to rename">
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
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 6)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular" title={label ? `Click to edit ${label}` : 'Click to edit'}>
      {formatMoney(value)}
    </button>
  );
}

// ---- floating hover/drag tooltip ----
function DragTooltip({ deadline }: { deadline: Deadline }) {
  const catColor = CATEGORY_COLORS[deadline.category];
  const days = daysUntil(deadline.date);
  const funded = deadline.target > 0 ? Math.min(999, Math.round((deadline.saved / deadline.target) * 100)) : 100;
  return (
    <div
      className="absolute z-30 pointer-events-none anim-fade-up"
      style={{ bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)', width: 190 }}
    >
      <div className="ios-card-nested p-3" style={{ boxShadow: '0 10px 28px rgba(0,0,0,0.4)', border: `1.5px solid rgb(${catColor})` }}>
        <p className="text-footnote font-bold mb-0.5" style={{ color: `rgb(${catColor})` }}>{deadline.emoji} {deadline.name}</p>
        <p className="text-caption mb-1.5">{formatDateLabel(deadline.date)} · {formatCountdown(days)}</p>
        <p className="text-footnote font-bold tabular">
          {formatMoney(deadline.saved)} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>of {formatMoney(deadline.target)}</span>
        </p>
        <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>{funded}% funded · drag ↑↓ to log savings</p>
      </div>
      <div className="mx-auto" style={{ width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `6px solid rgb(${catColor})` }} />
    </div>
  );
}

export function TaxBudgetDeadlines() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxDeadlines = isPro ? PRO_MAX_DEADLINES : FREE_MAX_DEADLINES;
  const snapAmount = isPro ? PRO_SNAP_AMOUNT : FREE_SNAP_AMOUNT;

  const [deadlines, setDeadlines] = useState<Deadline[]>(() => defaultDeadlines());
  const [pulse, setPulse] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customCategory, setCustomCategory] = useState<Category>('other');
  const [customTargetStr, setCustomTargetStr] = useState('1000');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(33);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => { setDeadlines(prev => prev.slice(0, maxDeadlines)); }, [maxDeadlines]);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/tax-budget-deadlines')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.deadlines) && data.config.deadlines.length > 0) {
          setDeadlines(data.config.deadlines.slice(0, PRO_MAX_DEADLINES));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const totalTarget = useMemo(() => deadlines.reduce((a, d) => a + d.target, 0), [deadlines]);
  const totalSaved = useMemo(() => deadlines.reduce((a, d) => a + d.saved, 0), [deadlines]);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [totalTarget, totalSaved]);

  const sorted = useMemo(() => [...deadlines].sort((a, b) => a.date.localeCompare(b.date)), [deadlines]);
  const nearest = sorted.length ? sorted[0] : null;
  const nearestDays = nearest ? daysUntil(nearest.date) : null;
  const dailySetAside = nearestDays && nearestDays > 0 ? totalRemaining / nearestDays : totalRemaining;

  const safeHarborScore = useMemo(() => {
    if (deadlines.length === 0) return 100;
    const weightSum = deadlines.reduce((a, d) => a + (d.target || 1), 0);
    const weighted = deadlines.reduce((a, d) => {
      const pct = d.target > 0 ? Math.min(100, (d.saved / d.target) * 100) : 100;
      return a + pct * (d.target || 1);
    }, 0);
    return Math.round(weighted / weightSum);
  }, [deadlines]);

  const urgentUnderfunded = useMemo(
    () => sorted.filter(d => daysUntil(d.date) <= 14 && d.saved < d.target),
    [sorted]
  );

  const health: 'strong' | 'ontrack' | 'behind' | 'urgent' =
    urgentUnderfunded.length > 0 ? 'urgent' : safeHarborScore >= 90 ? 'strong' : safeHarborScore >= 60 ? 'ontrack' : 'behind';
  const healthLabel = {
    strong: '✅ Fully on pace',
    ontrack: '🟡 On track',
    behind: '⚠️ Falling behind',
    urgent: `🚨 ${urgentUnderfunded.length} deadline${urgentUnderfunded.length === 1 ? '' : 's'} underfunded & close`,
  }[health];
  const healthColor = { strong: '52, 199, 89', ontrack: '255, 159, 10', behind: '255, 159, 10', urgent: '255, 69, 58' }[health];

  // IMPORTANT: derived only from `target`, never from `saved` — this is what
  // stops the bar you're dragging from re-scaling itself mid-drag.
  const scaleMax = useMemo(() => Math.max(3000, ...deadlines.map(d => d.target)), [deadlines.map(d => d.target).join('|')]);

  const totalsByCategory = useMemo(() => {
    const totals: Record<Category, number> = { quarterly: 0, federal: 0, state: 0, other: 0 };
    for (const d of deadlines) totals[d.category] += d.target;
    return totals;
  }, [deadlines]);

  const fundedPoints = useMemo(() => sorted.map(d => ({
    id: d.id,
    name: d.name,
    pct: d.target > 0 ? Math.min(150, (d.saved / d.target) * 100) : 100,
  })), [sorted]);
  const avgFundedPct = fundedPoints.length ? fundedPoints.reduce((a, p) => a + Math.min(100, p.pct), 0) / fundedPoints.length : 100;
  const lineColor = avgFundedPct >= 90 ? '52, 199, 89' : avgFundedPct >= 50 ? '255, 159, 10' : '255, 69, 58';

  const atFreeLimit = !isPro && deadlines.length >= FREE_MAX_DEADLINES;

  // ---- drag to log saved amount ----
  function ratioAtClientY(clientY: number): number {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const zeroY = rect.bottom - LABEL_HEIGHT;
    return Math.min(1, Math.max(0, (zeroY - clientY) / TRACK_HEIGHT));
  }
  function savedAtClientY(clientY: number): number {
    const raw = ratioAtClientY(clientY) * scaleMax;
    return Math.round(raw / snapAmount) * snapAmount;
  }
  function startDrag(id: string, clientY: number) {
    dragId.current = id;
    setHoveredId(id);
    const amount = Math.max(0, savedAtClientY(clientY));
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, saved: amount } : d));
  }
  const handlePointerMove = useCallback((clientY: number) => {
    if (!dragId.current) return;
    const amount = Math.max(0, savedAtClientY(clientY));
    setDeadlines(prev => prev.map(d => d.id === dragId.current ? { ...d, saved: amount } : d));
  }, [scaleMax, snapAmount]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientY); }
    function onUp() { dragId.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  function applyPreset(preset: typeof PRESETS[number]) {
    const built = preset.keys.map(k => buildFromTemplate(TEMPLATES.find(t => t.key === k)!));
    if (!isPro && built.length > FREE_MAX_DEADLINES) {
      showToast(`Upgrade to Pro to track all ${built.length} ${preset.label} deadlines at once`, '⭐');
      setDeadlines(built.slice(0, FREE_MAX_DEADLINES));
      return;
    }
    setDeadlines(built.slice(0, maxDeadlines));
    showToast(`Loaded ${preset.label} deadlines`, preset.emoji);
  }

  function addNextTemplate() {
    if (!isPro && deadlines.length >= FREE_MAX_DEADLINES) { showToast('Upgrade to Pro to track more deadlines', '⭐'); return; }
    if (deadlines.length >= maxDeadlines) { showToast(`You can track up to ${maxDeadlines} deadlines`, '⚠️'); return; }
    const usedKeys = new Set(deadlines.map(d => d.key));
    const template = TEMPLATES.find(t => !usedKeys.has(t.key));
    if (!template) { showToast('All standard deadlines are already added', 'ℹ️'); return; }
    setDeadlines(prev => [...prev, buildFromTemplate(template)]);
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom deadline', '⭐'); return; }
    if (deadlines.length >= PRO_MAX_DEADLINES) { showToast(`You can track up to ${PRO_MAX_DEADLINES} deadlines`, '⚠️'); return; }
    setCustomName('');
    setCustomDate(isoDate(new Date(Date.now() + 30 * 86400000)));
    setCustomCategory('other');
    setCustomTargetStr('1000');
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    if (deadlines.length >= PRO_MAX_DEADLINES) { showToast(`You can track up to ${PRO_MAX_DEADLINES} deadlines`, '⚠️'); return; }
    const name = customName.trim() || 'Custom Deadline';
    const target = Math.max(0, Math.round(Number(customTargetStr) || 0));
    setDeadlines(prev => [...prev, {
      id: `dl-custom-${Date.now()}`,
      key: 'custom',
      name,
      emoji: '📌',
      date: customDate || isoDate(new Date(Date.now() + 30 * 86400000)),
      category: customCategory,
      target,
      saved: 0,
      custom: true,
    }]);
    setShowCustomForm(false);
    showToast('Custom deadline added', '📌');
  }

  function removeDeadline(id: string) { setDeadlines(prev => prev.filter(d => d.id !== id)); }
  function renameDeadline(id: string, name: string) { setDeadlines(prev => prev.map(d => d.id === id ? { ...d, name } : d)); }
  function updateField(id: string, field: 'target' | 'saved', value: number) {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/tax-budget-deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlines }),
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
    setDeadlines(defaultDeadlines());
    setShowCustomForm(false);
    showToast('Reset to defaults', '↺');
  }
  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyPlan() {
    const lines = [
      `Safe-Harbor Score: ${safeHarborScore}%`,
      `Total needed: ${formatMoney(totalTarget)}  ·  Saved: ${formatMoney(totalSaved)}  ·  Remaining: ${formatMoney(totalRemaining)}`,
      ...sorted.map(d => `- ${d.emoji} ${d.name} (${formatDateLabel(d.date)}, ${formatCountdown(daysUntil(d.date))}): ${formatMoney(d.saved)} of ${formatMoney(d.target)}`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>TAX & BUDGET DEADLINES</p>
            <h2 className="text-title2">Safe-Harbor Planner</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
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

        {/* Safe-Harbor Score */}
        <div className="ios-card-nested p-5 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ background: `rgba(${GLOW}, 0.06)` }}>
          <div>
            <p className="text-caption mb-1">SAFE-HARBOR SCORE</p>
            <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>How well-funded you are, weighted across every deadline.</p>
          </div>
          <div className="text-largetitle tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${safeHarborScore >= 90 ? '52, 199, 89' : safeHarborScore >= 60 ? GLOW : '255, 69, 58'})` }}>
            {safeHarborScore}%
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Total needed', value: formatMoney(totalTarget) },
            { label: 'Saved so far', value: formatMoney(totalSaved) },
            { label: 'Next deadline', value: nearest ? formatCountdown(nearestDays!) : '—' },
            { label: 'Daily set-aside', value: formatMoney(dailySetAside) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick setup presets */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Quick setup — I am a…</p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Underfunded-and-close banner */}
        {urgentUnderfunded.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {urgentUnderfunded.map(d => (
              <div key={d.id} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">🚨</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{d.name}</strong> is due in <strong>{formatCountdown(daysUntil(d.date))}</strong> and you're only at <strong>{formatMoney(d.saved)}</strong> of <strong>{formatMoney(d.target)}</strong>.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Drag-to-log-savings timeline */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag any bar up or down to log how much you've saved</p>
            <p className="text-caption">${snapAmount} per step</p>
          </div>
          <div
            ref={trackRef}
            className="relative w-full rounded-2xl"
            style={{ height: CONTAINER_HEIGHT, background: 'var(--border-hairline)', touchAction: 'none', overflowX: 'auto', overflowY: 'visible' }}
          >
            <div className="absolute left-4 right-4" style={{ bottom: LABEL_HEIGHT, height: 1, background: 'var(--bg-base)', opacity: 0.4 }} />
            {sorted.map(d => {
              const days = daysUntil(d.date);
              const xPct = Math.min(95, Math.max(5, (days / WINDOW_DAYS) * 100));
              const catColor = CATEGORY_COLORS[d.category];
              const targetH = Math.min(TRACK_HEIGHT, (d.target / scaleMax) * TRACK_HEIGHT);
              const savedH = Math.min(TRACK_HEIGHT, (d.saved / scaleMax) * TRACK_HEIGHT);
              const fullyFunded = d.target > 0 && d.saved >= d.target;
              const fillColor = fullyFunded ? '52, 199, 89' : catColor;
              const showTooltip = hoveredId === d.id;
              return (
                <div
                  key={d.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${xPct}%`, bottom: LABEL_HEIGHT, transform: 'translateX(-50%)', width: COLUMN_WIDTH, height: TRACK_HEIGHT }}
                >
                  {/* Big grabbable zone — the whole column, not just a sliver */}
                  <div
                    className="absolute inset-0 cursor-ns-resize"
                    style={{ touchAction: 'none' }}
                    onPointerDown={e => startDrag(d.id, e.clientY)}
                    onMouseEnter={() => setHoveredId(d.id)}
                    onMouseLeave={() => { if (dragId.current !== d.id) setHoveredId(null); }}
                  >
                    {showTooltip && <DragTooltip deadline={d} />}
                    <div className="absolute bottom-0 left-1/2 rounded-t-lg transition-all duration-150" style={{ width: 34, transform: 'translateX(-50%)', height: targetH, border: `2px dashed rgb(${catColor})`, background: `rgba(${catColor}, 0.05)` }} />
                    <div className="absolute bottom-0 left-1/2 rounded-t-lg transition-all duration-150" style={{ width: 30, transform: 'translateX(-50%)', height: savedH, background: `rgb(${fillColor})`, boxShadow: `0 0 10px rgba(${fillColor}, 0.45)` }} />
                    <div
                      className="absolute left-1/2 rounded-full flex items-center justify-center transition-all duration-150"
                      style={{
                        width: 28, height: 28, transform: 'translate(-50%, 50%)',
                        bottom: savedH, background: 'white', border: `3px solid rgb(${fillColor})`,
                        boxShadow: showTooltip ? `0 2px 12px rgba(${fillColor}, 0.55)` : '0 2px 8px rgba(0,0,0,0.25)',
                        cursor: 'grab',
                      }}
                    />
                  </div>
                  <div className="absolute text-center" style={{ bottom: -LABEL_HEIGHT + 4, width: 78, left: '50%', transform: 'translateX(-50%)' }}>
                    <p className="text-[9px] font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: `rgb(${catColor})` }}>{d.emoji} {d.name}</p>
                    <p className="text-[9px] font-semibold" style={{ color: `rgb(${urgencyColor(days)})` }}>{formatCountdown(days)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Funded-percent line chart */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-footnote font-semibold">Funded % across deadlines</p>
            <p className="text-caption">avg {Math.round(avgFundedPct)}%</p>
          </div>
          {fundedPoints.length > 1 ? (
            <svg viewBox="0 0 400 90" width="100%" height="90" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fundedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`rgb(${lineColor})`} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={`rgb(${lineColor})`} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 50, 100].map(mark => (
                <line key={mark} x1={0} x2={400} y1={90 - Math.min(90, mark * 0.8)} y2={90 - Math.min(90, mark * 0.8)} stroke="var(--border-hairline)" strokeWidth={1} />
              ))}
              {(() => {
                const n = fundedPoints.length;
                const pts = fundedPoints.map((p, i) => {
                  const x = (i / (n - 1)) * 400;
                  const y = 90 - Math.min(90, Math.min(p.pct, 100) * 0.8);
                  return `${x},${y}`;
                });
                const areaPath = `M0,90 L${pts.join(' L')} L400,90 Z`;
                const linePath = `M${pts.join(' L')}`;
                return (
                  <>
                    <path d={areaPath} fill="url(#fundedFill)" className="transition-all duration-500" />
                    <path d={linePath} fill="none" stroke={`rgb(${lineColor})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-500" />
                    {fundedPoints.map((p, i) => {
                      const x = (i / (n - 1)) * 400;
                      const y = 90 - Math.min(90, Math.min(p.pct, 100) * 0.8);
                      return <circle key={p.id} cx={x} cy={y} r={4} fill={`rgb(${lineColor})`} className="transition-all duration-500" />;
                    })}
                  </>
                );
              })()}
            </svg>
          ) : (
            <p className="text-caption">Add at least 2 deadlines to see the trend line.</p>
          )}
        </div>

        {/* Category breakdown */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Needed by category</p>
          <div className="w-full h-8 rounded-xl overflow-hidden flex" style={{ border: '1px solid var(--border-hairline)' }}>
            {(Object.keys(totalsByCategory) as Category[]).map(key => {
              const amt = totalsByCategory[key];
              const pct = totalTarget > 0 ? (amt / totalTarget) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div key={key} className="h-full flex items-center justify-center transition-all duration-500" style={{ width: `${pct}%`, background: `rgba(${CATEGORY_COLORS[key]}, 0.3)` }}>
                  {pct > 12 && <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: `rgb(${CATEGORY_COLORS[key]})` }}>{formatMoney(amt)}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {(Object.keys(totalsByCategory) as Category[]).map(key => (
              <span key={key} className="flex items-center gap-1.5 text-caption">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `rgb(${CATEGORY_COLORS[key]})` }} />
                {CATEGORY_LABEL[key]}
              </span>
            ))}
          </div>
        </div>

        {/* Deadline cards */}
        <div className="flex flex-col gap-2 mb-4">
          {sorted.length === 0 && (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No deadlines tracked yet — add one below.</p>
            </div>
          )}
          {sorted.map(d => {
            const catColor = CATEGORY_COLORS[d.category];
            const days = daysUntil(d.date);
            const funded = d.target > 0 ? Math.min(100, Math.round((d.saved / d.target) * 100)) : 100;
            return (
              <div key={d.id} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${catColor})` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.emoji}</span>
                    <EditableName value={d.name} onCommit={v => renameDeadline(d.id, v)} colorRgb={catColor} />
                    <span className="pill text-[10px]" style={{ background: `rgba(${catColor}, 0.15)`, color: `rgb(${catColor})` }}>{CATEGORY_LABEL[d.category]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-caption font-semibold" style={{ color: `rgb(${urgencyColor(days)})` }}>{formatDateLabel(d.date)} · {formatCountdown(days)}</span>
                    <button onClick={() => removeDeadline(d.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-2 text-footnote">
                  <span>
                    Saved <EditableAmount value={d.saved} onCommit={v => updateField(d.id, 'saved', v)} colorRgb={catColor} label="saved amount" />
                    {' '}of <EditableAmount value={d.target} onCommit={v => updateField(d.id, 'target', v)} colorRgb={catColor} label="target amount" />
                  </span>
                  <span className="font-bold tabular" style={{ color: `rgb(${catColor})` }}>{funded}% funded</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${funded}%`, background: `rgb(${funded >= 100 ? '52, 199, 89' : catColor})` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={addNextTemplate}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro || deadlines.length < FREE_MAX_DEADLINES ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: deadlines.length >= maxDeadlines ? 0.5 : 1 }}
            >
              {isPro || deadlines.length < FREE_MAX_DEADLINES ? '+' : '🔒'} Add deadline
            </button>
            <button
              onClick={openCustomForm}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: isPro && deadlines.length >= PRO_MAX_DEADLINES ? 0.5 : 1 }}
              title={isPro ? 'Create a fully custom deadline' : 'Upgrade to Pro to add a custom deadline'}
            >
              {isPro ? '✨' : '🔒'} Custom deadline
            </button>
          </div>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
        </div>

        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ New custom deadline</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption">Name</span>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Sales Tax Q3" maxLength={30}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Category</span>
                <select value={customCategory} onChange={e => setCustomCategory(e.target.value as Category)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }}>
                  {(Object.keys(CATEGORY_LABEL) as Category[]).map(c => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Due date</span>
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Amount needed ($)</span>
                <input type="number" min={0} step={snapAmount} value={customTargetStr} onChange={e => setCustomTargetStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add deadline</button>
          </form>
        )}

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: atFreeLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)', boxShadow: atFreeLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : `🔒 Free plan: 3 deadlines, $${FREE_SNAP_AMOUNT} per drag step`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_DEADLINES} deadlines, ${PRO_SNAP_AMOUNT} drag precision, custom deadlines, and saving your setup.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <ToolCommentSection seedComments={TAX_DEADLINE_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
