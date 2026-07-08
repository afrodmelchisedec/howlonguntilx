// FILE: src/components/pro-tools/ShoppingDealsRadar.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { SHOPPING_DEALS_COMMENTS } from '@/lib/seedComments';
import { DEALS_PRESETS, type Deal } from '@/lib/dealsPresets';

const GLOW = '255, 90, 150';
const MAX_WISHLIST_FREE = 3;
const MAX_WISHLIST_PRO = 30;
const SEGMENT_ANGLE = 45;

interface WheelSegment { label: string; type: 'percent' | 'shipping' | 'mystery' | 'jackpot' | 'none'; value?: number; color: string; weight: number; }

const SEGMENTS: WheelSegment[] = [
  { label: '5% OFF',       type: 'percent',  value: 5,  color: '88, 214, 113',  weight: 20 },
  { label: 'Free Ship',    type: 'shipping',            color: '100, 200, 255', weight: 16 },
  { label: '10% OFF',      type: 'percent',  value: 10, color: '196, 132, 252', weight: 18 },
  { label: 'Try Again',    type: 'none',                color: '150, 150, 160', weight: 14 },
  { label: '15% OFF',      type: 'percent',  value: 15, color: '255, 159, 10',  weight: 12 },
  { label: 'Mystery Box',  type: 'mystery',              color: '255, 122, 165', weight: 8 },
  { label: '20% OFF',      type: 'percent',  value: 20, color: '255, 204, 0',   weight: 7 },
  { label: 'JACKPOT 25%',  type: 'jackpot',  value: 25, color: '255, 69, 58',   weight: 5 },
];

const LS_KEY = 'shopping-deals-state-v1';

interface LocalState { wishlist: string[]; streak: number; lastSpinDate: string; spinsToday: number; }

function loadLocal(): LocalState {
  if (typeof window === 'undefined') return { wishlist: [], streak: 0, lastSpinDate: '', spinsToday: 0 };
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return { wishlist: [], streak: 0, lastSpinDate: '', spinsToday: 0 };
    const parsed = JSON.parse(raw);
    return {
      wishlist: Array.isArray(parsed.wishlist) ? parsed.wishlist : [],
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
      lastSpinDate: typeof parsed.lastSpinDate === 'string' ? parsed.lastSpinDate : '',
      spinsToday: typeof parsed.spinsToday === 'number' ? parsed.spinsToday : 0,
    };
  } catch {
    return { wishlist: [], streak: 0, lastSpinDate: '', spinsToday: 0 };
  }
}
function saveLocal(state: LocalState) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function getTodayIso(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
function getYesterdayIso(): string {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function pickSegment(): number {
  const total = SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTS.length; i++) { r -= SEGMENTS[i].weight; if (r <= 0) return i; }
  return SEGMENTS.length - 1;
}

function genCode(seg: WheelSegment): string {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  if (seg.type === 'jackpot') return `JACKPOT${rand}`;
  if (seg.type === 'shipping') return `SHIP${rand}`;
  if (seg.type === 'percent') return `SAVE${seg.value}${rand}`;
  return '';
}

function getDealCountdown(iso: string, nowMs: number) {
  const diffMs = new Date(iso).getTime() - nowMs;
  const expired = diffMs <= 0;
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return { expired, days, hours, minutes };
}

export function ShoppingDealsRadar() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxWishlist = isPro ? MAX_WISHLIST_PRO : MAX_WISHLIST_FREE;
  const maxSpinsToday = isPro ? 2 : 1;

  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const initialLocal = useMemo(loadLocal, []);
  const [wishlist, setWishlist] = useState<string[]>(initialLocal.wishlist);
  const [streak, setStreak] = useState(initialLocal.streak);
  const [lastSpinDate, setLastSpinDate] = useState(initialLocal.lastSpinDate);
  const [spinsToday, setSpinsToday] = useState(initialLocal.lastSpinDate === getTodayIso() ? initialLocal.spinsToday : 0);
  const [dbLoaded, setDbLoaded] = useState(false);

  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prizeBubble, setPrizeBubble] = useState<{ label: string; color: string; code: string } | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(139);
  const [savingConfig, setSavingConfig] = useState(false);

  const draggingId = useRef<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    saveLocal({ wishlist, streak, lastSpinDate, spinsToday });
  }, [wishlist, streak, lastSpinDate, spinsToday]);

  useEffect(() => {
    if (!isPro || dbLoaded) return;
    fetch('/api/tools/shopping-deals')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.wishlist)) setWishlist(data.config.wishlist);
          if (typeof data.config.streak === 'number') setStreak(data.config.streak);
          if (typeof data.config.lastSpinDate === 'string') setLastSpinDate(data.config.lastSpinDate);
          if (typeof data.config.spinsToday === 'number' && data.config.lastSpinDate === getTodayIso()) {
            setSpinsToday(data.config.spinsToday);
          }
        }
        setDbLoaded(true);
      })
      .catch(() => setDbLoaded(true));
  }, [isPro, dbLoaded]);

  async function syncToServer(next: { wishlist: string[]; streak: number; lastSpinDate: string; spinsToday: number }) {
    if (!isPro) return;
    try {
      await fetch('/api/tools/shopping-deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
    } catch { /* silent — local cache still holds the truth */ }
  }

  function getDeal(id: string): Deal | undefined {
    return DEALS_PRESETS.find(d => d.id === id);
  }

  function spinRotationTo(index: number) {
    setWheelRotation(prev => {
      const current = prev % 360;
      const target = (360 - (index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)) % 360;
      let delta = target - current;
      if (delta <= 0) delta += 360;
      return prev + delta + 4 * 360;
    });
  }

  function handleSpin() {
    if (spinning) return;
    const todayIso = getTodayIso();
    const effectiveSpinsToday = lastSpinDate === todayIso ? spinsToday : 0;
    if (effectiveSpinsToday >= maxSpinsToday) {
      showToast(isPro ? 'Come back tomorrow for more spins!' : 'Upgrade to Pro for a bonus daily spin', isPro ? '⏰' : '⭐');
      return;
    }
    setSpinning(true);
    setPrizeBubble(null);
    const idx = pickSegment();
    spinRotationTo(idx);
    setTimeout(() => applyPrize(idx), 3300);
  }

  function applyPrize(idx: number) {
    setSpinning(false);
    const seg = SEGMENTS[idx];
    const todayIso = getTodayIso();
    const isFirstSpinToday = lastSpinDate !== todayIso;
    const nextSpinsToday = isFirstSpinToday ? 1 : spinsToday + 1;
    const nextStreak = isFirstSpinToday
      ? (lastSpinDate === getYesterdayIso() ? streak + 1 : 1)
      : streak;

    setSpinsToday(nextSpinsToday);
    setLastSpinDate(todayIso);
    setStreak(nextStreak);

    const code = seg.type !== 'none' ? genCode(seg) : '';
    setPrizeBubble({ label: seg.label, color: seg.color, code });

    if (seg.type === 'mystery') {
      const unclaimed = DEALS_PRESETS.filter(d => !wishlist.includes(d.id));
      if (unclaimed.length > 0 && wishlist.length < maxWishlist) {
        const pick = unclaimed[Math.floor(Math.random() * unclaimed.length)];
        setWishlist(prev => [...prev, pick.id]);
        showToast(`Mystery Box added ${pick.name} to your deals!`, '🎁');
      }
    }

    syncToServer({ wishlist, streak: nextStreak, lastSpinDate: todayIso, spinsToday: nextSpinsToday });
  }

  function addToWishlist(id: string) {
    if (wishlist.includes(id)) return;
    if (!isPro && wishlist.length >= MAX_WISHLIST_FREE) {
      showToast(`Upgrade to Pro to track more than ${MAX_WISHLIST_FREE} deals`, '⭐');
      return;
    }
    if (isPro && wishlist.length >= MAX_WISHLIST_PRO) {
      showToast(`You can track up to ${MAX_WISHLIST_PRO} deals`, '⚠️');
      return;
    }
    setWishlist(prev => [...prev, id]);
    showToast('Added to your deals!', '🛍️');
  }
  function removeFromWishlist(id: string) {
    setWishlist(prev => prev.filter(x => x !== id));
  }

  const handleReorderPointerMove = useCallback((clientY: number) => {
    if (!draggingId.current) return;
    const idx = wishlist.indexOf(draggingId.current);
    if (idx === -1) return;
    for (const [id, el] of itemRefs.current) {
      if (id === draggingId.current) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const otherIdx = wishlist.indexOf(id);
      if (otherIdx === -1) continue;
      if ((clientY < mid && otherIdx < idx) || (clientY > mid && otherIdx > idx)) {
        setWishlist(prev => {
          const next = [...prev];
          const from = next.indexOf(draggingId.current!);
          const [item] = next.splice(from, 1);
          next.splice(otherIdx, 0, item);
          return next;
        });
        break;
      }
    }
  }, [wishlist]);

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
    if (!isPro) { showToast('Upgrade to save your deals', '⭐'); return; }
    setSavingConfig(true);
    try {
      await syncToServer({ wishlist, streak, lastSpinDate, spinsToday });
      showToast('Deals list saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  const wishlistDeals = useMemo(() => wishlist.map(id => getDeal(id)).filter((d): d is Deal => !!d), [wishlist]);
  const totalSavings = useMemo(() => wishlistDeals.reduce((s, d) => s + (d.originalPrice - d.dealPrice), 0), [wishlistDeals]);
  const savingsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of wishlistDeals) map.set(d.category, (map.get(d.category) ?? 0) + (d.originalPrice - d.dealPrice));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [wishlistDeals]);
  const maxCategorySavings = Math.max(...savingsByCategory.map(([, v]) => v), 1);

  const expiringSoon = useMemo(() => wishlistDeals.filter(d => {
    const c = getDealCountdown(d.expiresIso, nowMs);
    return !c.expired && c.days === 0 && c.hours < 6;
  }), [wishlistDeals, nowMs]);

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
  function handleCopyDeal(d: Deal) {
    const text = `${d.emoji} ${d.name} — $${d.dealPrice} (was $${d.originalPrice}, ${d.discountPercent}% off)`;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleShareDeal(d: Deal) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?deal=${d.id}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyCode() {
    if (!prizeBubble?.code) return;
    navigator.clipboard.writeText(prizeBubble.code)
      .then(() => showToast('Code copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const todayIso = getTodayIso();
  const effectiveSpinsToday = lastSpinDate === todayIso ? spinsToday : 0;
  const spinsLeft = Math.max(0, maxSpinsToday - effectiveSpinsToday);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>LEISURE · SHOPPING & DEALS</p>
            <h2 className="text-title2">Deal Radar</h2>
          </div>
          <div className="pill press" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>
            🔥 {streak}-day streak
          </div>
        </div>

        <div className="flex flex-col items-center mb-8">
          <div className="relative" style={{ width: 220, height: 220 }}>
            <div className="absolute left-1/2 -top-1 z-20" style={{ transform: 'translateX(-50%)' }}>
              <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: `16px solid rgb(${GLOW})` }} />
            </div>
            <svg viewBox="0 0 220 220" width={220} height={220}
              style={{ transform: `rotate(${wheelRotation}deg)`, transition: 'transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' }}>
              {SEGMENTS.map((seg, i) => {
                const startAngle = i * SEGMENT_ANGLE - 90;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const r = 105;
                const cx = 110, cy = 110;
                const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
                const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
                const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
                const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
                const midAngle = startAngle + SEGMENT_ANGLE / 2;
                const labelX = cx + (r * 0.65) * Math.cos((midAngle * Math.PI) / 180);
                const labelY = cy + (r * 0.65) * Math.sin((midAngle * Math.PI) / 180);
                return (
                  <g key={i}>
                    <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={`rgba(${seg.color}, 0.85)`} stroke="var(--bg-base)" strokeWidth={2} />
                    <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="white"
                      transform={`rotate(${midAngle + 90} ${labelX} ${labelY})`}>
                      {seg.label}
                    </text>
                  </g>
                );
              })}
              <circle cx={110} cy={110} r={18} fill="var(--bg-base)" stroke="var(--border-hairline)" strokeWidth={2} />
            </svg>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning || spinsLeft === 0}
            className="btn-filled press mt-4 px-6 py-2.5 disabled:opacity-50"
          >
            {spinning ? 'Spinning…' : spinsLeft > 0 ? `🎡 Spin (${spinsLeft} left today)` : (isPro ? '⏰ Come back tomorrow' : '🔒 Spin used — Pro gets 2/day')}
          </button>

          {prizeBubble && (
            <div className="flex flex-col items-center mt-4 anim-scale-in">
              <span className="pill press text-sm font-bold" style={{ background: `rgba(${prizeBubble.color}, 0.18)`, color: `rgb(${prizeBubble.color})`, boxShadow: `0 0 16px rgba(${prizeBubble.color}, 0.4)` }}>
                🎉 {prizeBubble.label}
              </span>
              {prizeBubble.code && (
                <button onClick={handleCopyCode} className="ios-card-nested press text-xs px-3 py-1.5 mt-2" style={{ color: 'var(--text-secondary)' }}>
                  📋 Copy code: {prizeBubble.code}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="ios-card-nested p-4 mb-6 text-center">
          <p className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>${totalSavings.toFixed(2)}</p>
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>potential savings across your deals</p>
          {savingsByCategory.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-4 text-left">
              {savingsByCategory.map(([cat, val]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-caption w-20 flex-shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div className="h-full rounded-full flex items-center justify-end pr-2" style={{ width: `${Math.max((val / maxCategorySavings) * 100, 8)}%`, background: `rgb(${GLOW})`, boxShadow: `0 0 8px rgba(${GLOW}, 0.5)` }}>
                      <span className="text-[9px] font-bold text-white">${val.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {expiringSoon.length > 0 && (
          <div className="ios-card-nested p-3 mb-6 flex items-center gap-3" style={{ borderLeft: `3px solid rgb(255, 69, 58)` }}>
            <span className="text-lg flex-shrink-0">⏰</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              {expiringSoon.map(d => d.name).join(', ')} {expiringSoon.length === 1 ? 'expires' : 'expire'} in under 6 hours!
            </p>
          </div>
        )}

        <p className="text-footnote font-semibold mb-2">Today's deals</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {DEALS_PRESETS.map(d => {
            const c = getDealCountdown(d.expiresIso, nowMs);
            const inWishlist = wishlist.includes(d.id);
            return (
              <div key={d.id} className="ios-card-nested p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-footnote font-bold">{d.emoji} {d.name}</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{d.category}</p>
                  </div>
                  <span className="pill text-[10px] font-bold flex-shrink-0" style={{ background: `rgba(${d.color}, 0.18)`, color: `rgb(${d.color})` }}>
                    -{d.discountPercent}%
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-footnote font-bold" style={{ color: `rgb(${d.color})` }}>${d.dealPrice}</span>
                  <span className="text-caption line-through" style={{ color: 'var(--text-tertiary)' }}>${d.originalPrice}</span>
                </div>
                <p className="text-caption mb-3" style={{ color: c.expired ? 'rgb(255, 69, 58)' : 'var(--text-tertiary)' }}>
                  {c.expired ? '⏳ Expired' : `⏳ ${c.days > 0 ? `${c.days}d ` : ''}${c.hours}h ${c.minutes}m left`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => inWishlist ? removeFromWishlist(d.id) : addToWishlist(d.id)}
                    disabled={c.expired}
                    className="ios-card-nested press flex-1 text-xs py-2 disabled:opacity-40"
                    style={{ color: inWishlist ? `rgb(${d.color})` : 'var(--text-secondary)' }}
                  >
                    {inWishlist ? '✓ Saved' : '+ Save deal'}
                  </button>
                  <button onClick={() => handleCopyDeal(d)} className="press text-caption px-2" style={{ color: 'var(--text-tertiary)' }}>📋</button>
                  <button onClick={() => handleShareDeal(d)} className="press text-caption px-2" style={{ color: 'var(--text-tertiary)' }}>🔗</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-footnote font-semibold">Your saved deals {!isPro && `(${wishlist.length}/${MAX_WISHLIST_FREE})`}</p>
          <button
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="ios-card-nested press text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
            style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
          >
            {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
          </button>
        </div>
        {wishlistDeals.length === 0 ? (
          <div className="ios-card-nested p-6 text-center mb-6">
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Nothing saved yet — tap "+ Save deal" on anything above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mb-6">
            {wishlistDeals.map(d => {
              const isDragging = activeDragId === d.id;
              return (
                <div
                  key={d.id}
                  ref={el => { if (el) itemRefs.current.set(d.id, el); }}
                  className="ios-card-nested p-3 flex items-center gap-3"
                  style={{ opacity: isDragging ? 0.6 : 1, transform: isDragging ? 'scale(1.02)' : 'scale(1)', transition: 'opacity 0.15s, transform 0.15s' }}
                >
                  <span onPointerDown={() => startReorderDrag(d.id)} className="cursor-grab press text-lg" style={{ touchAction: 'none', color: 'var(--text-tertiary)' }}>⠿</span>
                  <span className="text-lg flex-shrink-0">{d.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-footnote font-semibold truncate">{d.name}</p>
                    <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>${d.dealPrice} · save ${(d.originalPrice - d.dealPrice).toFixed(2)}</p>
                  </div>
                  <button onClick={() => removeFromWishlist(d.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {!isPro && wishlist.length >= MAX_WISHLIST_FREE && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{ border: '1.5px solid rgba(var(--accent-orange), 0.4)', boxShadow: '0 0 20px rgba(var(--accent-orange), 0.1)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">⭐ You've hit the free limit</p>
              <p className="text-caption">Upgrade to Premium to save up to {MAX_WISHLIST_PRO} deals, get a bonus daily spin, and sync your streak across devices.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

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

      <ToolCommentSection seedComments={SHOPPING_DEALS_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
