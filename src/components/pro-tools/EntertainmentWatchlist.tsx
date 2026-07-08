// FILE: src/components/pro-tools/EntertainmentWatchlist.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { ENTERTAINMENT_COMMENTS } from './entertainmentComments';

interface WatchItem {
  id: string;
  title: string;
  typeKey: string;
  date: string;      // ISO — release date, or "finish by" deadline for shows/anime
  hype: number;       // 0-100
  addedAt: string;    // ISO
  shielded: boolean;
  episodesTotal?: number;
  episodesWatched?: number;
}
interface Template {
  title: string;
  typeKey: string;
  daysOut: number;
  episodesTotal?: number;
}

const GLOW = '255, 45, 85';

const FREE_MAX_ITEMS = 4;
const PRO_MAX_ITEMS = 15;

const TYPES = [
  { key: 'movie', name: 'Movie', emoji: '🎬', color: '255, 69, 58' },
  { key: 'show',  name: 'Show',  emoji: '📺', color: '0, 122, 255' },
  { key: 'anime', name: 'Anime', emoji: '🎭', color: '191, 90, 242' },
  { key: 'game',  name: 'Game',  emoji: '🎮', color: '52, 199, 89' },
  { key: 'album', name: 'Album', emoji: '🎵', color: '255, 159, 10' },
];
function typeOf(key: string) { return TYPES.find(t => t.key === key) ?? TYPES[0]; }
function nextType(key: string): string {
  const idx = TYPES.findIndex(t => t.key === key);
  return TYPES[(idx + 1) % TYPES.length].key;
}
function isBingeable(key: string) { return key === 'show' || key === 'anime'; }

const TEMPLATES: Template[] = [
  { title: 'The Last Signal',       typeKey: 'movie', daysOut: 18 },
  { title: 'Crimson Hour',          typeKey: 'show',  daysOut: 5,  episodesTotal: 10 },
  { title: 'Neon Ronin',            typeKey: 'anime', daysOut: 26, episodesTotal: 12 },
  { title: 'Starfall Chronicles',   typeKey: 'game',  daysOut: 40 },
  { title: 'Midnight Static',       typeKey: 'album', daysOut: 9 },
  { title: 'Glass Horizon',         typeKey: 'movie', daysOut: 55 },
  { title: 'The Forgotten Archive', typeKey: 'show',  daysOut: 12, episodesTotal: 8 },
  { title: 'Pixel Drift',           typeKey: 'game',  daysOut: 70 },
];

function isoInDays(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(20, 0, 0, 0);
  return d.toISOString();
}
function buildDefaultWatchlist(): WatchItem[] {
  const now = new Date().toISOString();
  return [
    { id: 'w-1', title: 'The Last Signal', typeKey: 'movie', date: isoInDays(18), hype: 65, addedAt: now, shielded: false },
    { id: 'w-2', title: 'Crimson Hour', typeKey: 'show', date: isoInDays(5), hype: 80, addedAt: isoInDays(-10), shielded: true, episodesTotal: 10, episodesWatched: 3 },
    { id: 'w-3', title: 'Midnight Static', typeKey: 'album', date: isoInDays(9), hype: 50, addedAt: now, shielded: false },
  ];
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function computeBinge(item: WatchItem) {
  const total = item.episodesTotal ?? 0;
  const watched = Math.min(item.episodesWatched ?? 0, total);
  const remaining = Math.max(0, total - watched);
  const daysLeft = Math.max(0, daysUntil(item.date));
  const addedDate = new Date(item.addedAt);
  const totalSpanDays = Math.max(1, Math.round((new Date(item.date).getTime() - addedDate.getTime()) / 86400000));
  const daysSinceAdded = Math.max(0, totalSpanDays - daysLeft);
  const expectedWatched = total > 0 ? (total * (daysSinceAdded / totalSpanDays)) : 0;
  const paceNeeded = daysLeft > 0 ? Math.round((remaining / daysLeft) * 10) / 10 : remaining;
  let status: 'ahead' | 'onTrack' | 'behind' | 'done' = 'onTrack';
  if (remaining === 0) status = 'done';
  else if (watched >= expectedWatched + 1) status = 'ahead';
  else if (watched < expectedWatched - 1) status = 'behind';
  return { total, watched, remaining, daysLeft, paceNeeded, status };
}

// ---- inline editable title ----
function EditableTitle({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { const t = draft.trim(); onCommit(t.length > 0 ? t : value); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 6)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 text-left" title="Click to rename">
      {value}
    </button>
  );
}

// ---- reusable drag slider ----
function DragSlider({ value, onChange, colorRgb, label }: { value: number; onChange: (v: number) => void; colorRgb: string; label: string }) {
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
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption">{label}</span>
        <span className="text-caption font-bold tabular" style={{ color: `rgb(${colorRgb})` }}>{value}%</span>
      </div>
      <div ref={ref} className="relative h-2 rounded-full" style={{ background: 'var(--border-hairline)', touchAction: 'none' }}>
        <div className="absolute top-0 left-0 h-full rounded-full transition-all duration-100" style={{ width: `${value}%`, background: `rgb(${colorRgb})` }} />
        <div onPointerDown={() => setDragging(true)} className="absolute top-1/2 rounded-full" style={{ left: `${value}%`, width: 16, height: 16, transform: 'translate(-50%, -50%)', background: 'white', border: `3px solid rgb(${colorRgb})`, cursor: 'grab', touchAction: 'none' }} />
      </div>
    </div>
  );
}

// ---- episode scrubber ----
function EpisodeScrubber({ total, watched, onChange, colorRgb }: { total: number; watched: number; onChange: (v: number) => void; colorRgb: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const handleMove = useCallback((clientX: number) => {
    if (!ref.current || total <= 0) return;
    const rect = ref.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * total));
  }, [total, onChange]);
  useEffect(() => {
    if (!dragging) return;
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [dragging, handleMove]);
  const ratio = total > 0 ? watched / total : 0;
  return (
    <div
      ref={ref}
      onPointerDown={e => { setDragging(true); handleMove(e.clientX); }}
      className="relative h-3 rounded-full cursor-pointer"
      style={{ background: 'var(--border-hairline)', touchAction: 'none' }}
    >
      <div className="h-full rounded-full transition-all duration-150" style={{ width: `${ratio * 100}%`, background: `rgb(${colorRgb})` }} />
    </div>
  );
}

export function EntertainmentWatchlist() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxItems = isPro ? PRO_MAX_ITEMS : FREE_MAX_ITEMS;

  const [watchlist, setWatchlist] = useState<WatchItem[]>(buildDefaultWatchlist);
  const [monthOffset, setMonthOffset] = useState(0);
  const [peekingId, setPeekingId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customTypeKey, setCustomTypeKey] = useState('show');
  const [customDateStr, setCustomDateStr] = useState('');
  const [customEpisodes, setCustomEpisodes] = useState('10');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(19);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const draggingId = useRef<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/entertainment-watchlist')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.items)) setWatchlist(data.config.items.slice(0, PRO_MAX_ITEMS));
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  useEffect(() => { if (!isPro) setMonthOffset(0); }, [isPro]);

  const sorted = useMemo(() => [...watchlist], [watchlist, tick]);
  const nextItem = useMemo(
    () => [...watchlist].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [watchlist, tick]
  );
  const releasesThisWeek = useMemo(() => watchlist.filter(w => { const d = daysUntil(w.date); return d >= 0 && d <= 7; }).length, [watchlist, tick]);
  const avgHype = watchlist.length ? Math.round(watchlist.reduce((a, w) => a + w.hype, 0) / watchlist.length) : 0;

  const firstBingeableId = useMemo(() => sorted.find(w => isBingeable(w.typeKey))?.id ?? null, [sorted]);

  const health: 'today' | 'soon' | 'planned' | 'empty' =
    watchlist.length === 0 ? 'empty' : nextItem && daysUntil(nextItem.date) <= 0 ? 'today' : nextItem && daysUntil(nextItem.date) <= 3 ? 'soon' : nextItem ? 'planned' : 'empty';
  const healthLabel = {
    today: '🍿 Releasing today!',
    soon: '🔥 Coming up fast',
    planned: '🗓️ Queue looking good',
    empty: '➕ Add something to watch',
  }[health];
  const healthColor = { today: PEAK(), soon: '255, 159, 10', planned: GLOW, empty: '160, 160, 170' }[health];
  function PEAK() { return '255, 69, 58'; }

  const atFreeLimit = !isPro && watchlist.length >= FREE_MAX_ITEMS;

  // ---- drag-to-reorder ----
  function startReorder(id: string) { draggingId.current = id; }
  const handleReorderMove = useCallback((clientY: number) => {
    const id = draggingId.current;
    if (!id) return;
    setWatchlist(prev => {
      const currentIndex = prev.findIndex(w => w.id === id);
      if (currentIndex === -1) return prev;
      let closestIndex = currentIndex;
      let closestDist = Infinity;
      prev.forEach((item, i) => {
        const el = rowRefs.current[item.id];
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - mid);
        if (dist < closestDist) { closestDist = dist; closestIndex = i; }
      });
      if (closestIndex === currentIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(currentIndex, 1);
      next.splice(closestIndex, 0, moved);
      return next;
    });
  }, []);
  useEffect(() => {
    function onMove(e: PointerEvent) { handleReorderMove(e.clientY); }
    function onUp() { draggingId.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleReorderMove]);

  function addFromTemplate(t: Template) {
    if (watchlist.length >= maxItems) {
      showToast(isPro ? `Watchlist full at ${maxItems}` : 'Upgrade to Pro to track more titles', isPro ? '⚠️' : '⭐');
      return;
    }
    setWatchlist(prev => [...prev, {
      id: `w-${Date.now()}`, title: t.title, typeKey: t.typeKey, date: isoInDays(t.daysOut),
      hype: 50, addedAt: new Date().toISOString(), shielded: false,
      episodesTotal: t.episodesTotal, episodesWatched: t.episodesTotal ? 0 : undefined,
    }]);
  }
  function removeItem(id: string) { setWatchlist(prev => prev.filter(w => w.id !== id)); }
  function renameItem(id: string, title: string) { setWatchlist(prev => prev.map(w => w.id === id ? { ...w, title } : w)); }
  function cycleItemType(id: string) {
    setWatchlist(prev => prev.map(w => {
      if (w.id !== id) return w;
      const newType = nextType(w.typeKey);
      return { ...w, typeKey: newType, episodesTotal: isBingeable(newType) ? (w.episodesTotal ?? 10) : undefined, episodesWatched: isBingeable(newType) ? (w.episodesWatched ?? 0) : undefined };
    }));
  }
  function setHype(id: string, v: number) { setWatchlist(prev => prev.map(w => w.id === id ? { ...w, hype: v } : w)); }
  function setEpisodesWatched(id: string, v: number) { setWatchlist(prev => prev.map(w => w.id === id ? { ...w, episodesWatched: v } : w)); }
  function toggleShield(id: string) { setWatchlist(prev => prev.map(w => w.id === id ? { ...w, shielded: !w.shielded } : w)); }
  function peek(id: string) {
    setPeekingId(id);
    setTimeout(() => setPeekingId(prev => (prev === id ? null : prev)), 3000);
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom title', '⭐'); return; }
    if (watchlist.length >= PRO_MAX_ITEMS) { showToast(`Watchlist full at ${PRO_MAX_ITEMS}`, '⚠️'); return; }
    setCustomTitle(''); setCustomTypeKey('show'); setCustomEpisodes('10');
    const d = new Date(); d.setDate(d.getDate() + 21);
    setCustomDateStr(d.toISOString().slice(0, 10));
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    const title = customTitle.trim() || 'Untitled';
    const bingeable = isBingeable(customTypeKey);
    setWatchlist(prev => [...prev, {
      id: `w-${Date.now()}`, title, typeKey: customTypeKey,
      date: new Date(`${customDateStr}T20:00:00`).toISOString(),
      hype: 50, addedAt: new Date().toISOString(), shielded: false,
      episodesTotal: bingeable ? Math.max(1, Math.round(Number(customEpisodes) || 10)) : undefined,
      episodesWatched: bingeable ? 0 : undefined,
    }]);
    setShowCustomForm(false);
    showToast('Custom title added', '✨');
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your watchlist', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/entertainment-watchlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: watchlist }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Watchlist saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }
  function handleReset() {
    setWatchlist(buildDefaultWatchlist());
    setShowCustomForm(false);
    setMonthOffset(0);
    showToast('Watchlist reset', '↺');
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
      'My watchlist priority queue:',
      ...sorted.map((w, i) => `${i + 1}. ${typeOf(w.typeKey).emoji} ${w.title} — ${formatDate(new Date(w.date))} (${Math.max(0, daysUntil(w.date))}d)`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const now = new Date();
  const gridYear = now.getFullYear();
  const gridMonth = now.getMonth() + monthOffset;
  const monthCells = useMemo(() => buildMonthGrid(gridYear, gridMonth), [gridYear, gridMonth]);
  const monthLabel = new Date(gridYear, gridMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const heroShielded = nextItem?.shielded && daysUntil(nextItem.date) > 0 && peekingId !== nextItem.id;

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>ENTERTAINMENT</p>
            <h2 className="text-title2">Release Queue</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your watchlist to your account' : 'Upgrade to save your watchlist'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Next release', value: nextItem ? `${Math.max(0, daysUntil(nextItem.date))}d` : '—' },
            { label: 'Watchlist', value: `${watchlist.length} / ${maxItems}` },
            { label: 'Avg hype', value: `${avgHype}%` },
            { label: 'Releasing this week', value: String(releasesThisWeek) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Marquee hero */}
        {nextItem ? (
          <div className="relative rounded-2xl overflow-hidden mb-7 anim-fade-up p-5" style={{ background: `linear-gradient(135deg, rgba(${typeOf(nextItem.typeKey).color},0.22), rgba(0,0,0,0.35))`, border: `1.5px solid rgba(${typeOf(nextItem.typeKey).color}, 0.5)`, boxShadow: `0 0 30px rgba(${typeOf(nextItem.typeKey).color}, 0.2)` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="pill text-[10px]" style={{ background: `rgba(${typeOf(nextItem.typeKey).color}, 0.2)`, color: `rgb(${typeOf(nextItem.typeKey).color})` }}>
                {typeOf(nextItem.typeKey).emoji} {typeOf(nextItem.typeKey).name}
              </span>
              <button onClick={() => toggleShield(nextItem.id)} className="press text-xs" style={{ color: nextItem.shielded ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
                {nextItem.shielded ? '🛡️ Shield on' : '🛡️ Shield off'}
              </button>
            </div>
            {heroShielded ? (
              <button onClick={() => peek(nextItem.id)} className="w-full py-8 flex flex-col items-center gap-2 press">
                <span className="text-2xl">🙈</span>
                <span className="text-footnote font-semibold" style={{ color: 'var(--text-secondary)' }}>Tap to peek</span>
              </button>
            ) : (
              <>
                <h3 className="text-title2 mb-1">{nextItem.title}</h3>
                <p className="text-largetitle tabular font-bold mb-3" style={{ color: `rgb(${typeOf(nextItem.typeKey).color})`, textShadow: `0 0 16px rgba(${typeOf(nextItem.typeKey).color}, 0.5)` }}>
                  {Math.max(0, daysUntil(nextItem.date))}d
                </p>
                <p className="text-footnote mb-3" style={{ color: 'var(--text-secondary)' }}>{formatDate(new Date(nextItem.date))}</p>
                <DragSlider value={nextItem.hype} onChange={v => setHype(nextItem.id, v)} colorRgb={typeOf(nextItem.typeKey).color} label="Hype" />
              </>
            )}
          </div>
        ) : (
          <div className="ios-card-nested p-6 text-center mb-7">
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Nothing queued — add a title below.</p>
          </div>
        )}

        {/* Priority queue — drag to reorder */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Priority queue — drag ⋮⋮ to reorder</p>
          </div>
          <div className="flex flex-col gap-2">
            {sorted.map(item => {
              const t = typeOf(item.typeKey);
              const shielded = item.shielded && daysUntil(item.date) > 0 && peekingId !== item.id;
              const binge = isBingeable(item.typeKey) ? computeBinge(item) : null;
              const bingeLocked = isBingeable(item.typeKey) && !isPro && item.id !== firstBingeableId;
              const bingeColor = binge?.status === 'behind' ? '255, 69, 58' : binge?.status === 'ahead' ? '52, 199, 89' : binge?.status === 'done' ? GLOW : '255, 159, 10';
              return (
                <div key={item.id} ref={el => { rowRefs.current[item.id] = el; }} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${t.color})` }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span onPointerDown={() => startReorder(item.id)} className="press text-sm" style={{ cursor: 'grab', color: 'var(--text-tertiary)', touchAction: 'none' }} title="Drag to reorder">⋮⋮</span>
                      <button onClick={() => cycleItemType(item.id)} className="text-lg press" title="Click to change type">{t.emoji}</button>
                      {shielded ? (
                        <button onClick={() => peek(item.id)} className="text-footnote font-bold press" style={{ color: 'var(--text-secondary)' }}>🙈 Hidden — tap to peek</button>
                      ) : (
                        <EditableTitle value={item.title} onCommit={v => renameItem(item.id, v)} colorRgb={t.color} />
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleShield(item.id)} className="press text-caption" title="Toggle Spoiler Shield">{item.shielded ? '🛡️' : '🔓'}</button>
                      <span className="text-footnote font-bold" style={{ color: `rgb(${t.color})` }}>{Math.max(0, daysUntil(item.date))}d</span>
                      <button onClick={() => removeItem(item.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                    </div>
                  </div>
                  {!shielded && <p className="text-caption">{formatDate(new Date(item.date))}</p>}

                  {isBingeable(item.typeKey) && (
                    <div className="mt-1" style={{ opacity: bingeLocked ? 0.5 : 1 }}>
                      {bingeLocked ? (
                        <p className="text-caption">🔒 Binge tracking is Pro-only for this title — your top show is free.</p>
                      ) : binge ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-caption">{binge.watched} / {binge.total} episodes</span>
                            <span className="text-caption font-bold" style={{ color: `rgb(${bingeColor})` }}>
                              {binge.status === 'done' ? '✅ Finished' : binge.status === 'ahead' ? '🚀 Ahead of pace' : binge.status === 'behind' ? '⚠️ Behind pace' : '✅ On track'}
                            </span>
                          </div>
                          <EpisodeScrubber total={binge.total} watched={binge.watched} onChange={v => setEpisodesWatched(item.id, v)} colorRgb={bingeColor} />
                          {binge.remaining > 0 && (
                            <p className="text-caption mt-1">Need ~{binge.paceNeeded} ep/day to finish by {formatDate(new Date(item.date))}</p>
                          )}
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add from templates */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-footnote font-semibold">Add to your watchlist</p>
            <button onClick={openCustomForm} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '✨' : '🔒'} Add custom title
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.filter(t => !watchlist.some(w => w.title === t.title)).map(t => (
              <button
                key={t.title}
                onClick={() => addFromTemplate(t)}
                className="ios-card-nested press px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                style={{ opacity: watchlist.length >= maxItems ? 0.5 : 1 }}
              >
                {typeOf(t.typeKey).emoji} {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Custom title form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ Add custom title</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 col-span-2">
                <span className="text-caption">Title</span>
                <input value={customTitle} onChange={e => setCustomTitle(e.target.value)} placeholder="e.g. Season 4" maxLength={40}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Type</span>
                <select value={customTypeKey} onChange={e => setCustomTypeKey(e.target.value)} className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }}>
                  {TYPES.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Date</span>
                <input type="date" value={customDateStr} onChange={e => setCustomDateStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              {isBingeable(customTypeKey) && (
                <label className="flex flex-col gap-1 col-span-2">
                  <span className="text-caption">Total episodes</span>
                  <input type="number" min={1} value={customEpisodes} onChange={e => setCustomEpisodes(e.target.value)}
                    className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
                </label>
              )}
            </div>
            <button type="submit" className="btn-filled press text-sm">Add to watchlist</button>
          </form>
        )}

        {/* Release calendar grid */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-footnote font-semibold">Release calendar — {monthLabel}</p>
            {isPro && (
              <div className="flex gap-1.5">
                <button onClick={() => setMonthOffset(0)} className="ios-card-nested press text-xs px-2.5 py-1" style={{ color: monthOffset === 0 ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>This month</button>
                <button onClick={() => setMonthOffset(1)} className="ios-card-nested press text-xs px-2.5 py-1" style={{ color: monthOffset === 1 ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>Next month</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="text-caption text-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((day, i) => {
              if (!day) return <div key={i} />;
              const isToday = sameDay(day, new Date());
              const dayReleases = watchlist.filter(w => sameDay(new Date(w.date), day));
              return (
                <div key={i} className="ios-card-nested flex flex-col items-center justify-center gap-0.5 aspect-square" style={{ border: isToday ? `1.5px solid rgb(${GLOW})` : undefined }}>
                  <span className="text-[10px] tabular" style={{ color: isToday ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>{day.getDate()}</span>
                  {dayReleases.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayReleases.slice(0, 3).map(r => <span key={r.id} className="w-1.5 h-1.5 rounded-full" style={{ background: `rgb(${typeOf(r.typeKey).color})` }} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end mb-7">
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ Watchlist full" : `🔒 Free plan: ${FREE_MAX_ITEMS} titles, current month only`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_ITEMS} titles, custom titles, binge tracking on every show, a 2-month calendar, and saving your watchlist.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
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

      <ToolCommentSection seedComments={ENTERTAINMENT_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
