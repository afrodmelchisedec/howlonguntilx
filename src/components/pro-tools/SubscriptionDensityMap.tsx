// FILE: src/components/pro-tools/SubscriptionDensityMap.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { SUBSCRIPTION_DENSITY_COMMENTS } from '@/lib/seedComments';
import { SUBSCRIPTION_PRESETS } from '@/lib/subscriptionPresets';

interface Subscription {
  id: string;
  name: string;
  emoji: string;
  amount: number;
  color: string;
  day: number | null; // null = still in tray
}

function fmtMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function seedInitial(): Subscription[] {
  return [
    { id: 'seed-1', name: 'Netflix',      emoji: '🎬', amount: 15.99, color: '255, 69, 58',  day: 1 },
    { id: 'seed-2', name: 'Spotify',      emoji: '🎧', amount: 10.99, color: '88, 214, 113', day: 1 },
    { id: 'seed-3', name: 'Cloud Storage', emoji: '☁️', amount: 9.99, color: '134, 168, 255', day: 15 },
  ];
}

export function SubscriptionDensityMap() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();

  const now = useMemo(() => new Date(), []);
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();

  const [subs, setSubs] = useState<Subscription[]>(seedInitial);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(74);

  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const draggingSub = subs.find(s => s.id === draggingId) ?? null;

  const tray = subs.filter(s => s.day === null);
  const placed = subs.filter(s => s.day !== null);

  function addPreset(preset: typeof SUBSCRIPTION_PRESETS[number]) {
    setSubs(prev => [...prev, {
      id: `sub-${Date.now()}`,
      name: preset.name,
      emoji: preset.emoji,
      amount: preset.amount,
      color: preset.color,
      day: null,
    }]);
  }

  function removeSub(id: string) {
    setSubs(prev => prev.filter(s => s.id !== id));
  }

  // ---- drag handling ----
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingId) return;
    setGhostPos({ x: clientX, y: clientY });
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest('[data-day]') as HTMLElement | null;
    if (cell) {
      setHoverDay(Number(cell.dataset.day));
    } else {
      setHoverDay(null);
    }
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

  // ---- calendar grid ----
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
      const total = placed
        .filter(s => s.day !== null && days.includes(s.day))
        .reduce((sum, s) => sum + s.amount, 0);
      return { days, total };
    });
  }, [weeks, placed]);

  const maxWeekTotal = Math.max(...weekTotals.map(w => w.total), 1);
  const monthTotal = placed.reduce((sum, s) => sum + s.amount, 0);

  // day -> subscriptions on that day
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

  // fraud-awareness: duplicate names
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

  // fraud-awareness: pile-up days (3+ charges same day)
  const pileUpDays = useMemo(() => {
    return Array.from(dayMap.entries())
      .filter(([, arr]) => arr.length >= 3)
      .map(([day, arr]) => ({ day, count: arr.length, total: arr.reduce((s, x) => s + x.amount, 0) }));
  }, [dayMap]);

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

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(255,159,10,0.25), 0 0 40px rgba(255,159,10,0.1)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-orange))' }}>DENSITY MAP</p>
            <h2 className="text-title2">Subscription Renewal Calendar</h2>
          </div>
          <div className="ios-card-nested px-4 py-2 text-center">
            <div className="text-title3 tabular" style={{ color: 'rgb(var(--accent-orange))' }}>{fmtMoney(monthTotal)}</div>
            <div className="text-caption">this month</div>
          </div>
        </div>

        {/* Fraud awareness banners */}
        {(duplicateGroups.length > 0 || pileUpDays.length > 0) && (
          <div className="flex flex-col gap-2 mb-6">
            {duplicateGroups.map(group => (
              <div key={group[0].name} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">🚨</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  You have <strong>{group.length}</strong> subscriptions named <strong>{group[0].name}</strong> — possible duplicate billing, worth checking ({fmtMoney(group.reduce((s, x) => s + x.amount, 0))}/mo combined).
                </p>
              </div>
            ))}
            {pileUpDays.map(p => (
              <div key={p.day} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
                <span className="text-lg flex-shrink-0">🔥</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  Renewal pile-up: <strong>{p.count} charges</strong> land on day {p.day}, totaling {fmtMoney(p.total)}. Consider spreading these out.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Add subscription presets */}
        <div className="mb-5">
          <p className="text-footnote font-semibold mb-2">Add a subscription</p>
          <div className="flex flex-wrap gap-2">
            {SUBSCRIPTION_PRESETS.map(preset => (
              <button
                key={preset.name}
                onClick={() => addPreset(preset)}
                className="pill press text-xs flex items-center gap-1"
                style={{ background: `rgba(${preset.color}, 0.12)`, color: `rgb(${preset.color})` }}
              >
                {preset.emoji} {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tray of unplaced subscriptions */}
        {tray.length > 0 && (
          <div className="mb-5 ios-card-nested p-4">
            <p className="text-footnote font-semibold mb-3">Drag onto the calendar →</p>
            <div className="flex flex-wrap gap-2">
              {tray.map(s => (
                <div
                  key={s.id}
                  onPointerDown={e => startDrag(s.id, e.clientX, e.clientY)}
                  className="press flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-grab select-none"
                  style={{
                    background: `rgba(${s.color}, 0.18)`,
                    color: `rgb(${s.color})`,
                    touchAction: 'none',
                    opacity: draggingId === s.id ? 0.25 : 1,
                    animation: 'chipBounce 1.8s ease-in-out infinite',
                  }}
                >
                  <span>{s.emoji}</span>
                  <span className="text-xs font-bold">{s.name}</span>
                  <span className="text-xs">{fmtMoney(s.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly heat bar */}
        <div className="mb-5">
          <p className="text-footnote font-semibold mb-2">Weekly card impact</p>
          <div className="flex flex-col gap-1.5">
            {weekTotals.map((w, i) => {
              if (w.days.length === 0) return null;
              const ratio = w.total / maxWeekTotal;
              const hue = ratio > 0.66 ? '255, 69, 58' : ratio > 0.33 ? '255, 159, 10' : '52, 199, 89';
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-caption w-12 flex-shrink-0">Wk {i + 1}</span>
                  <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300 ease-out flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(ratio * 100, w.total > 0 ? 8 : 0)}%`,
                        background: `rgb(${hue})`,
                        boxShadow: w.total > 0 ? `0 0 10px rgba(${hue}, 0.6)` : 'none',
                      }}
                    >
                      {w.total > 0 && <span className="text-[10px] font-bold text-white whitespace-nowrap">{fmtMoney(w.total)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="mb-6">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(w => (
              <div key={w} className="text-caption text-center py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((day, i) => {
              if (day === null) return <div key={i} />;
              const daySubs = dayMap.get(day) ?? [];
              const isHovered = hoverDay === day && draggingId !== null;
              const isPileUp = daySubs.length >= 3;
              return (
                <div
                  key={day}
                  data-day={day}
                  ref={el => { if (el) cellRefs.current.set(day, el); }}
                  className="relative rounded-xl flex flex-col items-center justify-start p-1 transition-all duration-150"
                  style={{
                    minHeight: 64,
                    border: isHovered ? '2px solid rgb(var(--accent-brand))' : '1px solid var(--border-hairline)',
                    background: isHovered ? 'rgba(var(--accent-brand), 0.1)' : 'transparent',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-caption font-semibold">{day}</span>
                    {isPileUp && <span className="text-[10px]">🔥</span>}
                  </div>
                  <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                    {daySubs.slice(0, 3).map(s => (
                      <span
                        key={s.id}
                        onPointerDown={e => { e.stopPropagation(); startDrag(s.id, e.clientX, e.clientY); }}
                        className="press w-5 h-5 rounded-full flex items-center justify-center text-[10px] cursor-grab"
                        style={{
                          background: `rgb(${s.color})`,
                          touchAction: 'none',
                          opacity: draggingId === s.id ? 0.25 : 1,
                        }}
                        title={`${s.name} — ${fmtMoney(s.amount)}`}
                      >
                        {s.emoji}
                      </span>
                    ))}
                    {daySubs.length > 3 && (
                      <span className="text-[9px] font-bold" style={{ color: 'var(--text-tertiary)' }}>+{daySubs.length - 3}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Placed subscriptions list w/ remove */}
        {placed.length > 0 && (
          <div className="mb-6">
            <p className="text-footnote font-semibold mb-2">All subscriptions</p>
            <div className="flex flex-col gap-1.5">
              {placed.sort((a, b) => (a.day ?? 0) - (b.day ?? 0)).map(s => (
                <div key={s.id} className="flex items-center justify-between ios-card-nested px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: `rgb(${s.color})` }}>{s.emoji}</span>
                    <span className="text-footnote font-semibold">{s.name}</span>
                    <span className="text-caption">day {s.day}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-footnote font-bold tabular">{fmtMoney(s.amount)}</span>
                    <button onClick={() => removeSub(s.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? 'rgb(var(--accent-orange))' : 'var(--text-secondary)' }}>
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
      <ToolCommentSection seedComments={SUBSCRIPTION_DENSITY_COMMENTS} onRequireAuth={requireAuth} glow="255, 159, 10" />

      <ToastHost toast={toast} />

      {/* Floating drag ghost */}
      {draggingSub && ghostPos && (
        <div
          className="fixed z-[90] pointer-events-none flex items-center gap-1.5 px-3 py-2 rounded-xl"
          style={{
            left: ghostPos.x, top: ghostPos.y,
            transform: 'translate(-50%, -50%) scale(1.1)',
            background: `rgba(${draggingSub.color}, 0.9)`,
            color: 'white',
            boxShadow: `0 8px 24px rgba(${draggingSub.color}, 0.5)`,
          }}
        >
          <span>{draggingSub.emoji}</span>
          <span className="text-xs font-bold">{draggingSub.name}</span>
        </div>
      )}

      <style>{`
        @keyframes chipBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2px); }
        }
      `}</style>
    </div>
  );
}
