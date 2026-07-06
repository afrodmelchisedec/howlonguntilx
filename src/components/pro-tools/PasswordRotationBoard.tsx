// FILE: src/components/pro-tools/PasswordRotationBoard.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { PASSWORD_ROTATION_COMMENTS } from '@/lib/seedComments';

interface Account {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sensitivity: number; // 0-100, position on the risk-priority line
  lastRotatedIso: string;
}

interface AccountPreset {
  name: string;
  emoji: string;
  color: string;
  defaultSensitivity: number;
}

const GLOW = '46, 196, 182';
const MAX_ACCOUNTS_FREE = 5;
const MAX_ACCOUNTS_PRO = 20;

const ACCOUNT_PRESETS: AccountPreset[] = [
  { name: 'Email',          emoji: '📧', color: '100, 200, 255', defaultSensitivity: 80 },
  { name: 'Banking',        emoji: '🏦', color: '255, 159, 10',  defaultSensitivity: 95 },
  { name: 'Social Media',   emoji: '📱', color: '196, 132, 252', defaultSensitivity: 35 },
  { name: 'Shopping',       emoji: '🛒', color: '88, 214, 113',  defaultSensitivity: 45 },
  { name: 'Work',           emoji: '💼', color: '255, 122, 165', defaultSensitivity: 75 },
  { name: 'Cloud Storage',  emoji: '☁️', color: '120, 220, 200', defaultSensitivity: 60 },
  { name: 'Gaming',         emoji: '🎮', color: '255, 180, 100', defaultSensitivity: 20 },
  { name: 'Custom',         emoji: '🔐', color: '200, 200, 210', defaultSensitivity: 50 },
];

const DAYS_AGO_PRESETS = [
  { label: 'Today',    days: 0 },
  { label: '1 week',   days: 7 },
  { label: '1 month',  days: 30 },
  { label: '3 months', days: 90 },
  { label: '6 months', days: 180 },
  { label: '1 year',   days: 365 },
  { label: '2+ years', days: 730 },
];

type Band = 'fresh' | 'due' | 'overdue' | 'critical';
const BAND_COLOR: Record<Band, string> = {
  fresh: '52, 199, 89', due: '255, 204, 0', overdue: '255, 159, 10', critical: '255, 69, 58',
};
const BAND_LABEL: Record<Band, string> = {
  fresh: '✅ Fresh', due: '🟡 Due soon', overdue: '🟠 Overdue', critical: '🚨 Critical',
};

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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function daysSinceIso(iso: string, today: Date): number {
  const then = new Date(`${iso}T00:00:00`);
  return Math.max(0, Math.floor((today.getTime() - then.getTime()) / 86400000));
}
function recommendedInterval(sensitivity: number): number {
  return Math.round(365 - (sensitivity / 100) * 305);
}
function bandFor(ratio: number): Band {
  if (ratio < 0.5) return 'fresh';
  if (ratio < 1) return 'due';
  if (ratio < 2) return 'overdue';
  return 'critical';
}

function seedInitial(today: Date): Account[] {
  return [
    { id: 'seed-email',   name: 'Primary Email', emoji: '📧', color: '100, 200, 255', sensitivity: 80, lastRotatedIso: toISODate(addDays(today, -200)) },
    { id: 'seed-bank',    name: 'Online Banking', emoji: '🏦', color: '255, 159, 10',  sensitivity: 95, lastRotatedIso: toISODate(addDays(today, -400)) },
    { id: 'seed-insta',   name: 'Instagram',      emoji: '📱', color: '196, 132, 252', sensitivity: 25, lastRotatedIso: toISODate(addDays(today, -20)) },
    { id: 'seed-work',    name: 'Work Slack',     emoji: '💼', color: '255, 122, 165', sensitivity: 70, lastRotatedIso: toISODate(addDays(today, -100)) },
  ];
}

// ---- inline editable account name ----
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
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 6)}ch` }}
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

export function PasswordRotationBoard() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxAccounts = isPro ? MAX_ACCOUNTS_PRO : MAX_ACCOUNTS_FREE;

  const today = useMemo(() => todayAtMidnight(), []);

  const [accounts, setAccounts] = useState<Account[]>(() => seedInitial(today));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(87);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const lineRef = useRef<HTMLDivElement>(null);
  const draggingAccountId = useRef<string | null>(null);
  const customCounter = useRef(0);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/password-rotation')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          setAccounts(data.accounts);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const computed = useMemo(() => accounts.map(a => {
    const daysSince = daysSinceIso(a.lastRotatedIso, today);
    const interval = recommendedInterval(a.sensitivity);
    const ratio = daysSince / interval;
    return { ...a, daysSince, interval, ratio, band: bandFor(ratio) };
  }), [accounts, today]);

  const sortedByUrgency = useMemo(() => [...computed].sort((a, b) => b.ratio - a.ratio), [computed]);

  const healthScore = useMemo(() => {
    if (computed.length === 0) return 100;
    const avgClamped = computed.reduce((sum, a) => sum + Math.min(a.ratio, 2), 0) / computed.length;
    return Math.round(100 * (1 - avgClamped / 2));
  }, [computed]);

  const criticalAccounts = computed.filter(a => a.band === 'critical');
  const overdueAccounts = computed.filter(a => a.band === 'overdue');

  const ringColor = healthScore >= 70 ? '52, 199, 89' : healthScore >= 40 ? '255, 159, 10' : '255, 69, 58';
  const RING_R = 54;
  const CIRC = 2 * Math.PI * RING_R;
  const ringOffset = CIRC * (1 - healthScore / 100);

  const atFreeLimit = !isPro && accounts.length >= MAX_ACCOUNTS_FREE;

  function addAccount(preset: AccountPreset) {
    if (!isPro && accounts.length >= MAX_ACCOUNTS_FREE) {
      showToast(`Upgrade to track more than ${MAX_ACCOUNTS_FREE} accounts`, '⭐');
      setDropdownOpen(false);
      return;
    }
    if (isPro && accounts.length >= MAX_ACCOUNTS_PRO) {
      showToast(`You can track up to ${MAX_ACCOUNTS_PRO} accounts`, '⚠️');
      setDropdownOpen(false);
      return;
    }
    const isCustom = preset.name === 'Custom';
    if (isCustom) customCounter.current += 1;
    const name = isCustom ? `Custom ${customCounter.current}` : preset.name;
    setAccounts(prev => [...prev, {
      id: `acc-${Date.now()}`,
      name,
      emoji: preset.emoji,
      color: preset.color,
      sensitivity: preset.defaultSensitivity,
      lastRotatedIso: toISODate(addDays(today, -180)),
    }]);
    setDropdownOpen(false);
    if (isCustom) showToast('Click the name to customize it', '✏️');
  }

  function removeAccount(id: string) {
    setAccounts(prev => prev.filter(a => a.id !== id));
  }

  function renameAccount(id: string, name: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name } : a));
  }

  function setDaysAgo(id: string, daysAgo: number) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, lastRotatedIso: toISODate(addDays(today, -daysAgo)) } : a));
  }

  function setExactDate(id: string, isoValue: string) {
    if (!isPro) { showToast('Upgrade to Pro to set an exact rotation date', '⭐'); return; }
    if (!isoValue) return;
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, lastRotatedIso: isoValue } : a));
  }

  function markRotatedToday(id: string) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, lastRotatedIso: toISODate(today) } : a));
    showToast('Marked as rotated today!', '🎉');
  }

  // ---- risk-priority line drag ----
  const handleLinePointerMove = useCallback((clientX: number) => {
    if (!draggingAccountId.current || !lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const pct = Math.round(ratio * 100);
    setAccounts(prev => prev.map(a => a.id === draggingAccountId.current ? { ...a, sensitivity: pct } : a));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (activeDragId) handleLinePointerMove(e.clientX); }
    function onUp() { draggingAccountId.current = null; setActiveDragId(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [activeDragId, handleLinePointerMove]);

  function startDragChip(id: string) {
    draggingAccountId.current = id;
    setActiveDragId(id);
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your account list', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/password-rotation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Account list saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
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

  function handleCopyList() {
    const lines = [
      `Password Rotation Priority — as of ${fmtDate(today)}`,
      ...sortedByUrgency.map((a, i) =>
        `${i + 1}. ${a.emoji} ${a.name} — ${BAND_LABEL[a.band]} — ${a.daysSince}d since rotation (due every ${a.interval}d)`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Priority list copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>ROTATION PRIORITY BOARD</p>
            <h2 className="text-title2">Password Rotation Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this list to your account' : 'Upgrade to save your account list'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="relative">
              <button onClick={() => setDropdownOpen(o => !o)} className="btn-filled press text-xs px-4 py-2">
                + Add account
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                  <div className="ios-card anim-scale-in absolute right-0 mt-2 w-56 overflow-hidden z-40" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                    {ACCOUNT_PRESETS.map(preset => (
                      <button
                        key={preset.name}
                        onClick={() => addAccount(preset)}
                        className="sidebar-item w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium press"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span>{preset.emoji}</span><span>{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {!isPro && (
          <p className="text-caption mb-5" style={{ color: atFreeLimit ? 'rgb(var(--accent-orange))' : 'var(--text-tertiary)' }}>
            {accounts.length}/{MAX_ACCOUNTS_FREE} accounts on the free plan
            {atFreeLimit && ' — upgrade for unlimited tracking and exact dates'}
          </p>
        )}

        {/* Health score ring + summary */}
        <div className="flex items-center gap-6 mb-8 flex-wrap justify-center sm:justify-start">
          <svg viewBox="0 0 140 140" width={140} height={140} style={{ flexShrink: 0 }}>
            <circle cx={70} cy={70} r={RING_R} fill="none" stroke="var(--border-hairline)" strokeWidth={12} />
            <circle
              cx={70} cy={70} r={RING_R} fill="none" stroke={`rgb(${ringColor})`} strokeWidth={12}
              strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={ringOffset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dashoffset 0.3s ease-out, stroke 0.3s ease-out', filter: `drop-shadow(0 0 8px rgba(${ringColor}, 0.5))` }}
            />
            <text x={70} y={64} textAnchor="middle" fontSize="28" fontWeight="800" fill="var(--text-primary)">{healthScore}</text>
            <text x={70} y={84} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">health score</text>
          </svg>
          <div className="flex-1 min-w-[200px]">
            {criticalAccounts.length > 0 && (
              <div className="ios-card-nested p-3 mb-2 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(255, 69, 58)' }}>
                <span className="text-lg flex-shrink-0">🚨</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{criticalAccounts.length}</strong> account{criticalAccounts.length === 1 ? '' : 's'} critically overdue — rotate {criticalAccounts.map(a => a.name).join(', ')} first.
                </p>
              </div>
            )}
            {criticalAccounts.length === 0 && overdueAccounts.length > 0 && (
              <div className="ios-card-nested p-3 mb-2 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(255, 159, 10)' }}>
                <span className="text-lg flex-shrink-0">🟠</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{overdueAccounts.length}</strong> account{overdueAccounts.length === 1 ? '' : 's'} overdue for rotation.
                </p>
              </div>
            )}
            {criticalAccounts.length === 0 && overdueAccounts.length === 0 && (
              <div className="ios-card-nested p-3 mb-2 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(52, 199, 89)' }}>
                <span className="text-lg flex-shrink-0">✅</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  All accounts are within their recommended rotation window.
                </p>
              </div>
            )}
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Higher sensitivity accounts get shorter recommended rotation windows — drag them on the line below to reflect how critical each one really is.
            </p>
          </div>
        </div>

        {/* Risk-priority drag line */}
        <div className="mb-2">
          <p className="text-footnote font-semibold mb-1">Drag each account by how sensitive it is</p>
        </div>
        <div
          ref={lineRef}
          className="relative h-3 rounded-full mt-8 mb-3"
          style={{
            background: 'linear-gradient(to right, rgba(88,214,113,0.35), rgba(255,204,0,0.35), rgba(255,159,10,0.35), rgba(255,69,58,0.35))',
            touchAction: 'none',
          }}
        >
          {computed.map(a => (
            <div
              key={a.id}
              onPointerDown={() => startDragChip(a.id)}
              className="absolute top-1/2 rounded-full flex items-center justify-center cursor-grab select-none"
              style={{
                left: `${a.sensitivity}%`, width: 36, height: 36, transform: 'translate(-50%, -50%)',
                background: `rgb(${a.color})`, border: `3px solid rgb(${BAND_COLOR[a.band]})`,
                boxShadow: `0 0 10px rgba(${BAND_COLOR[a.band]}, 0.6)`, touchAction: 'none',
                zIndex: activeDragId === a.id ? 20 : 10,
                transition: activeDragId === a.id ? 'none' : 'left 0.15s ease-out',
              }}
              title={a.name}
            >
              <span style={{ fontSize: 16 }}>{a.emoji}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-caption mb-8" style={{ color: 'var(--text-tertiary)' }}>
          <span>← Low sensitivity</span><span>High sensitivity →</span>
        </div>

        {/* Ranked account cards, sorted by urgency */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-footnote font-semibold">Rotation priority order</p>
          <button onClick={handleCopyList} className="ios-card-nested press text-xs px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>
            📋 Copy list
          </button>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {sortedByUrgency.map(a => {
            const barRatio = Math.min(a.ratio / 2, 1);
            const isPresetActive = (days: number) => Math.abs(a.daysSince - days) <= 3;
            return (
              <div key={a.id} className="ios-card-nested p-4">
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0" style={{ background: `rgb(${a.color})` }}>{a.emoji}</span>
                    <EditableName value={a.name} onCommit={v => renameAccount(a.id, v)} colorRgb={a.color} />
                    <span className="pill text-[10px] font-bold" style={{ background: `rgba(${BAND_COLOR[a.band]}, 0.18)`, color: `rgb(${BAND_COLOR[a.band]})` }}>
                      {BAND_LABEL[a.band]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => markRotatedToday(a.id)} className="ios-card-nested press text-[10px] px-2.5 py-1.5" style={{ color: 'var(--text-secondary)' }}>
                      ✅ Rotated today
                    </button>
                    <button onClick={() => removeAccount(a.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>

                {/* days-since-rotation bar */}
                <div className="relative h-4 rounded-full overflow-hidden mb-1.5" style={{ background: 'var(--border-hairline)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(barRatio * 100, 4)}%`, background: `rgb(${BAND_COLOR[a.band]})`, boxShadow: `0 0 8px rgba(${BAND_COLOR[a.band]}, 0.5)` }}
                  />
                  <div className="absolute top-0 bottom-0 w-0.5" style={{ left: '50%', background: 'rgba(255,255,255,0.4)' }} title="Recommended rotation point" />
                </div>
                <p className="text-caption mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  {a.daysSince}d since rotation · recommended every {a.interval}d
                </p>

                {/* rotation date controls */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {DAYS_AGO_PRESETS.map(p => (
                    <button
                      key={p.label}
                      onClick={() => setDaysAgo(a.id, p.days)}
                      className="pill press text-[10px]"
                      style={{
                        background: isPresetActive(p.days) ? `rgba(${GLOW}, 0.2)` : 'var(--border-hairline)',
                        color: isPresetActive(p.days) ? `rgb(${GLOW})` : 'var(--text-secondary)',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                  {isPro ? (
                    <input
                      type="date"
                      value={a.lastRotatedIso}
                      max={toISODate(today)}
                      onChange={e => setExactDate(a.id, e.target.value)}
                      className="ios-card-nested text-[10px] px-2 py-1.5"
                      style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-hairline)' }}
                    />
                  ) : (
                    <button
                      onClick={() => showToast('Upgrade to Pro to set an exact rotation date', '⭐')}
                      className="pill press text-[10px]"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      🔒 Exact date
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Free-tier upgrade banner */}
        {atFreeLimit && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: '1.5px solid rgba(var(--accent-orange), 0.4)', boxShadow: '0 0 20px rgba(var(--accent-orange), 0.1)' }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">⭐ You've hit the free limit</p>
              <p className="text-caption">Upgrade to Premium to track up to {MAX_ACCOUNTS_PRO} accounts, set exact rotation dates, and save your list.</p>
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
      <ToolCommentSection seedComments={PASSWORD_ROTATION_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
