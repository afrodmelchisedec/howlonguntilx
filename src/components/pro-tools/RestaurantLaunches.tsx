// FILE: src/components/pro-tools/RestaurantLaunches.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { RESTAURANT_LAUNCHES_COMMENTS } from '@/lib/seedComments';
import { RESTAURANT_PRESETS, CUISINES, type RestaurantLaunch } from '@/lib/restaurantPresets';

const GLOW = '255, 107, 53';
const MAX_WATCHLIST_FREE = 3;
const MAX_WATCHLIST_PRO = 30;
const HYPE_HORIZON_DAYS = 90;

interface HypeBurst { id: string; restaurantId: string; amount: number; }

function fmtOpenDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCountdown(iso: string, nowMs: number) {
  const target = new Date(iso).getTime();
  const diffMs = target - nowMs;
  const isOpen = diffMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const daysUntil = diffMs / 86400000;
  const ringPercent = isOpen ? 100 : Math.max(0, Math.min(100, 100 - (daysUntil / HYPE_HORIZON_DAYS) * 100));
  return { isOpen, days, hours, minutes, seconds, ringPercent };
}

function RestaurantRing({ percent, color, size = 64 }: { percent: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-hairline)" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`rgb(${color})`} strokeWidth={5}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease-out', filter: `drop-shadow(0 0 5px rgba(${color}, 0.5))` }}
      />
    </svg>
  );
}

export function RestaurantLaunches() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxWatchlist = isPro ? MAX_WATCHLIST_PRO : MAX_WATCHLIST_FREE;

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const [cuisineFilter, setCuisineFilter] = useState('all');
  const [sortMode, setSortMode] = useState<'soonest' | 'hype'>('soonest');
  const [hypeScores, setHypeScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(RESTAURANT_PRESETS.map(r => [r.id, r.hype]))
  );
  const [hypeBursts, setHypeBursts] = useState<HypeBurst[]>([]);
  const [customRestaurants, setCustomRestaurants] = useState<RestaurantLaunch[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customDate, setCustomDate] = useState('');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(103);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const draggingId = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const allRestaurants = useMemo(() => [...RESTAURANT_PRESETS, ...customRestaurants], [customRestaurants]);

  function getRestaurant(id: string): RestaurantLaunch | undefined {
    return allRestaurants.find(r => r.id === id);
  }

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/restaurant-watchlist')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.customRestaurants)) setCustomRestaurants(data.config.customRestaurants);
          if (Array.isArray(data.config.watchlist)) setWatchlist(data.config.watchlist);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const filteredSorted = useMemo(() => {
    let list = allRestaurants;
    if (cuisineFilter !== 'all') list = list.filter(r => r.cuisine === cuisineFilter);
    const withMeta = list.map(r => ({ r, diffDays: (new Date(r.openDateIso).getTime() - nowMs) / 86400000 }));
    withMeta.sort((a, b) => sortMode === 'soonest' ? a.diffDays - b.diffDays : (hypeScores[b.r.id] ?? 0) - (hypeScores[a.r.id] ?? 0));
    return withMeta.map(x => x.r);
  }, [allRestaurants, cuisineFilter, sortMode, nowMs, hypeScores]);

  const soonWatchlist = useMemo(() => {
    return watchlist
      .map(id => getRestaurant(id))
      .filter((r): r is RestaurantLaunch => !!r)
      .filter(r => {
        const diffDays = (new Date(r.openDateIso).getTime() - nowMs) / 86400000;
        return diffDays >= 0 && diffDays <= 3;
      });
  }, [watchlist, allRestaurants, nowMs]);

  function handleHype(id: string) {
    const amount = 2 + Math.floor(Math.random() * 4);
    setHypeScores(prev => ({ ...prev, [id]: Math.min(100, (prev[id] ?? 0) + amount) }));
    const burstId = `${id}-${Date.now()}`;
    setHypeBursts(prev => [...prev, { id: burstId, restaurantId: id, amount }]);
    setTimeout(() => setHypeBursts(prev => prev.filter(b => b.id !== burstId)), 700);
  }

  function addToWatchlist(id: string) {
    if (watchlist.includes(id)) return;
    if (!isPro && watchlist.length >= MAX_WATCHLIST_FREE) {
      showToast(`Upgrade to Pro to track more than ${MAX_WATCHLIST_FREE} restaurants`, '⭐');
      return;
    }
    if (isPro && watchlist.length >= MAX_WATCHLIST_PRO) {
      showToast(`You can track up to ${MAX_WATCHLIST_PRO} restaurants`, '⚠️');
      return;
    }
    setWatchlist(prev => [...prev, id]);
    showToast('Added to your watchlist!', '⭐');
  }

  function removeFromWatchlist(id: string) {
    setWatchlist(prev => prev.filter(x => x !== id));
  }

  function addCustomRestaurant() {
    if (!isPro) { showToast('Upgrade to Pro to add your own restaurant', '⭐'); return; }
    if (!customName.trim() || !customDate) { showToast('Give it a name and an opening date', '⚠️'); return; }
    const id = `custom-${Date.now()}`;
    const newRestaurant: RestaurantLaunch = {
      id, name: customName.trim(), emoji: '🍽️', cuisine: 'Custom',
      city: customCity.trim() || 'Somewhere', openDateIso: new Date(`${customDate}T00:00:00`).toISOString(),
      color: '196, 132, 252', blurb: 'Added by you.', hype: 10,
    };
    setCustomRestaurants(prev => [...prev, newRestaurant]);
    setHypeScores(prev => ({ ...prev, [id]: 10 }));
    if (!isPro && watchlist.length >= MAX_WATCHLIST_FREE) {
      showToast('Custom restaurant added — upgrade to add it to your watchlist too', '⭐');
    } else {
      setWatchlist(prev => [...prev, id]);
    }
    setCustomName(''); setCustomCity(''); setCustomDate('');
    setShowAddCustom(false);
    showToast('Custom restaurant added!', '🎉');
  }

  // ---- drag-to-reorder watchlist ----
  const handleReorderPointerMove = useCallback((clientY: number) => {
    if (!draggingId.current) return;
    const idx = watchlist.indexOf(draggingId.current);
    if (idx === -1) return;
    for (const [id, el] of itemRefs.current) {
      if (id === draggingId.current) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const otherIdx = watchlist.indexOf(id);
      if (otherIdx === -1) continue;
      if ((clientY < mid && otherIdx < idx) || (clientY > mid && otherIdx > idx)) {
        setWatchlist(prev => {
          const next = [...prev];
          const from = next.indexOf(draggingId.current!);
          const [item] = next.splice(from, 1);
          next.splice(otherIdx, 0, item);
          return next;
        });
        break;
      }
    }
  }, [watchlist]);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (activeDragId) handleReorderPointerMove(e.clientY); }
    function onUp() { draggingId.current = null; setActiveDragId(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [activeDragId, handleReorderPointerMove]);

  function startReorderDrag(id: string) {
    draggingId.current = id;
    setActiveDragId(id);
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your watchlist', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/restaurant-watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist, customRestaurants }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Watchlist saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyRestaurant(r: RestaurantLaunch) {
    const { isOpen, days, hours } = getCountdown(r.openDateIso, nowMs);
    const text = isOpen
      ? `${r.emoji} ${r.name} (${r.city}) is now open!`
      : `${r.emoji} ${r.name} (${r.city}) opens in ${days}d ${hours}h — ${fmtOpenDate(r.openDateIso)}`;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleShareRestaurant(r: RestaurantLaunch) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?restaurant=${r.id}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>FOOD · RESTAURANT LAUNCHES</p>
            <h2 className="text-title2">Grand Opening Tracker</h2>
          </div>
          <div className="flex items-center gap-2">
            <select value={cuisineFilter} onChange={e => setCuisineFilter(e.target.value)}
              className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              <option value="all">All cuisines</option>
              {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={() => setSortMode(m => m === 'soonest' ? 'hype' : 'soonest')} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              {sortMode === 'soonest' ? '📅 Soonest' : '🔥 Most hyped'}
            </button>
          </div>
        </div>

        {/* Restaurant grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {filteredSorted.map(r => {
            const { isOpen, days, hours, minutes, seconds, ringPercent } = getCountdown(r.openDateIso, nowMs);
            const burst = hypeBursts.find(b => b.restaurantId === r.id);
            const inWatchlist = watchlist.includes(r.id);
            return (
              <div
                key={r.id}
                className={`ios-card-nested p-4 relative overflow-hidden ${isOpen ? 'anim-open-radiate' : ''}`}
                style={isOpen ? { border: '1.5px solid rgba(100, 200, 255, 0.5)' } : undefined}
              >
                <div className="flex items-start gap-3 mb-3">
                  <RestaurantRing percent={ringPercent} color={r.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-footnote font-bold">{r.emoji} {r.name}</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{r.city} · {r.cuisine}</p>
                  </div>
                </div>
                <p className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>{r.blurb}</p>

                <div className="mb-3">
                  {isOpen ? (
                    <p className="text-footnote font-bold" style={{ color: `rgb(${r.color})` }}>🎉 Now Open!</p>
                  ) : (
                    <p className="text-footnote font-bold tabular" style={{ color: `rgb(${r.color})` }}>
                      {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
                    </p>
                  )}
                  <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>Opens {fmtOpenDate(r.openDateIso)}</p>
                </div>

                {/* hype bar */}
                <div className="relative mb-3">
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div className="h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${hypeScores[r.id] ?? 0}%`, background: `rgb(${r.color})`, boxShadow: `0 0 8px rgba(${r.color}, 0.5)` }} />
                  </div>
                  {burst && (
                    <span key={burst.id} className="absolute -top-1 right-0 text-xs font-bold anim-float-up" style={{ color: `rgb(${r.color})` }}>
                      +{burst.amount}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => handleHype(r.id)} className="ios-card-nested press flex-1 text-xs py-2" style={{ color: 'var(--text-secondary)' }}>
                    🔥 Hype it up!
                  </button>
                  <button
                    onClick={() => inWatchlist ? removeFromWatchlist(r.id) : addToWatchlist(r.id)}
                    className="ios-card-nested press flex-1 text-xs py-2"
                    style={{ color: inWatchlist ? `rgb(${r.color})` : 'var(--text-secondary)' }}
                  >
                    {inWatchlist ? '✓ Watching' : '+ Watchlist'}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => handleCopyRestaurant(r)} className="press text-caption flex-1" style={{ color: 'var(--text-tertiary)' }}>📋 Copy</button>
                  <button onClick={() => handleShareRestaurant(r)} className="press text-caption flex-1" style={{ color: 'var(--text-tertiary)' }}>🔗 Share</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom restaurant */}
        <div className="mb-8">
          {!showAddCustom ? (
            <button
              onClick={() => isPro ? setShowAddCustom(true) : showToast('Upgrade to Pro to add your own restaurant', '⭐')}
              className="ios-card-nested press w-full text-xs py-2.5"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
            >
              {isPro ? '+ Add a restaurant of your own' : '🔒 Add a restaurant of your own (Pro)'}
            </button>
          ) : (
            <div className="ios-card-nested p-4">
              <p className="text-footnote font-semibold mb-2">Add your own launch</p>
              <div className="flex flex-col gap-2 mb-3">
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Restaurant name"
                  className="ios-card p-2 text-sm" style={{ background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }} />
                <input value={customCity} onChange={e => setCustomCity(e.target.value)} placeholder="City"
                  className="ios-card p-2 text-sm" style={{ background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }} />
                <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                  className="ios-card p-2 text-sm" style={{ background: 'var(--border-hairline)', border: '1px solid var(--border-hairline)' }} />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={addCustomRestaurant} className="btn-filled press flex-1 text-xs py-2">Add it</button>
                <button onClick={() => setShowAddCustom(false)} className="ios-card-nested press flex-1 text-xs py-2" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Smart tip */}
        {soonWatchlist.length > 0 && (
          <div className="ios-card-nested p-3 mb-6 flex items-center gap-3" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
            <span className="text-lg flex-shrink-0">🎉</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {soonWatchlist.map(r => r.name).join(', ')} {soonWatchlist.length === 1 ? 'opens' : 'open'} in less than 3 days — mark your calendar!
            </p>
          </div>
        )}

        {/* Watchlist */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-footnote font-semibold">Your watchlist {!isPro && `(${watchlist.length}/${MAX_WATCHLIST_FREE})`}</p>
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="ios-card-nested press text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
          >
            {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
          </button>
        </div>
        {watchlist.length === 0 ? (
          <div className="ios-card-nested p-6 text-center mb-6">
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Nothing on your watchlist yet — tap "+ Watchlist" on any restaurant above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {watchlist.map(id => {
              const r = getRestaurant(id);
              if (!r) return null;
              const { isOpen, days, hours } = getCountdown(r.openDateIso, nowMs);
              const isDragging = activeDragId === id;
              return (
                <div
                  key={id}
                  ref={el => { if (el) itemRefs.current.set(id, el); }}
                  className={`ios-card-nested p-3 flex items-center gap-3 ${isOpen ? 'anim-open-radiate' : ''}`}
                  style={{
                    opacity: isDragging ? 0.6 : 1,
                    transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                    transition: 'opacity 0.15s, transform 0.15s',
                    border: isOpen ? '1.5px solid rgba(100, 200, 255, 0.5)' : undefined,
                  }}
                >
                  <span onPointerDown={() => startReorderDrag(id)} className="cursor-grab press text-lg" style={{ touchAction: 'none', color: 'var(--text-tertiary)' }}>⠿</span>
                  <span className="text-lg flex-shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-footnote font-semibold truncate">{r.name}</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{r.city}</p>
                  </div>
                  <p className="text-caption font-bold tabular" style={{ color: `rgb(${r.color})` }}>
                    {isOpen ? '🎉 Open' : `${days}d ${hours}h`}
                  </p>
                  <button onClick={() => removeFromWatchlist(id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Free-tier upgrade banner */}
        {!isPro && watchlist.length >= MAX_WATCHLIST_FREE && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: '1.5px solid rgba(var(--accent-orange), 0.4)', boxShadow: '0 0 20px rgba(var(--accent-orange), 0.1)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">⭐ You've hit the free limit</p>
              <p className="text-caption">Upgrade to Premium to track up to {MAX_WATCHLIST_PRO} restaurants, add your own, and save your list.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
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

      <ToolCommentSection seedComments={RESTAURANT_LAUNCHES_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />

      <style>{`
        @keyframes floatUp {
          0%   { opacity: 0; transform: translateY(4px) scale(0.9); }
          30%  { opacity: 1; transform: translateY(-2px) scale(1.1); }
          100% { opacity: 0; transform: translateY(-16px) scale(1); }
        }
        .anim-float-up { animation: floatUp 0.7s ease-out forwards; }

        @keyframes openRadiate {
          0%, 100% {
            box-shadow: 0 0 18px rgba(52, 199, 89, 0.55), 0 0 34px rgba(52, 199, 89, 0.25);
            border-color: rgba(52, 199, 89, 0.6);
          }
          50% {
            box-shadow: 0 0 24px rgba(100, 200, 255, 0.65), 0 0 44px rgba(100, 200, 255, 0.3);
            border-color: rgba(100, 200, 255, 0.7);
          }
        }
        .anim-open-radiate { animation: openRadiate 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}