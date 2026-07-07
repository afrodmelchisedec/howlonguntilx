// FILE: src/components/pro-tools/FoodFestivalPassport.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { FOOD_FESTIVAL_COMMENTS } from './foodFestivalComments';

interface Festival {
  id: string;
  name: string;
  emoji: string;
  cuisine: string;
  location: string;
  date: string; // ISO
  ticketPrice: number;
  foodBudget: number;
  attended: boolean;
}
interface Template {
  name: string;
  emoji: string;
  cuisine: string;
  location: string;
  daysFromNow: number;
  ticketPrice: number;
  foodBudget: number;
}

const GLOW = '255, 90, 54';

const FREE_MAX_FESTIVALS = 4;
const PRO_MAX_FESTIVALS = 15;
const FREE_DECK_SIZE = 6;
const PRO_DECK_SIZE = 10;
const SWIPE_THRESHOLD = 90;

const FESTIVAL_TEMPLATES: Template[] = [
  { name: 'Taste of Chicago',        emoji: '🌭', cuisine: 'American',           location: 'Chicago, IL',       daysFromNow: 21, ticketPrice: 0,  foodBudget: 60 },
  { name: 'Oktoberfest',             emoji: '🍺', cuisine: 'German',             location: 'Munich',            daysFromNow: 55, ticketPrice: 25, foodBudget: 120 },
  { name: 'La Tomatina',             emoji: '🍅', cuisine: 'Spanish',            location: 'Buñol, Spain',      daysFromNow: 80, ticketPrice: 15, foodBudget: 40 },
  { name: 'Night Market',            emoji: '🏮', cuisine: 'Asian Street Food',  location: 'Bangkok',           daysFromNow: 12, ticketPrice: 0,  foodBudget: 35 },
  { name: 'Chili Cook-Off',          emoji: '🌶️', cuisine: 'Tex-Mex',            location: 'Austin, TX',        daysFromNow: 34, ticketPrice: 10, foodBudget: 45 },
  { name: 'Cheese Rolling & Feast',  emoji: '🧀', cuisine: 'British',            location: 'Gloucester, UK',    daysFromNow: 48, ticketPrice: 0,  foodBudget: 30 },
  { name: 'Wine & Food Festival',    emoji: '🍷', cuisine: 'French',             location: 'Bordeaux',          daysFromNow: 65, ticketPrice: 40, foodBudget: 150 },
  { name: 'Ramen Festival',          emoji: '🍜', cuisine: 'Japanese',           location: 'Tokyo',              daysFromNow: 9,  ticketPrice: 0,  foodBudget: 50 },
  { name: 'BBQ Fest',                emoji: '🍖', cuisine: 'Southern BBQ',       location: 'Memphis, TN',       daysFromNow: 27, ticketPrice: 20, foodBudget: 70 },
  { name: 'Diwali Sweets Fair',      emoji: '🪔', cuisine: 'Indian',             location: 'Mumbai',            daysFromNow: 40, ticketPrice: 0,  foodBudget: 25 },
];

const CUISINE_SUGGESTIONS = ['American', 'Italian', 'Mexican', 'Japanese', 'Indian', 'Thai', 'French', 'Ethiopian', 'Korean', 'Vietnamese', 'Peruvian', 'Lebanese'];

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function computeDateFromOffset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

// ---- inline editable dollar amount ----
function EditableAmount({ value, onCommit, colorRgb }: { value: number; onCommit: (v: number) => void; colorRgb: string }) {
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
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 5)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular" title="Click to edit">
      {formatMoney(value)}
    </button>
  );
}

// ---- ticket-stub countdown ----
function TicketStub({ festival }: { festival: Festival }) {
  const [, forceTick] = useState(0);
  useEffect(() => { const t = setInterval(() => forceTick(x => x + 1), 1000); return () => clearInterval(t); }, []);
  const ms = Math.max(0, new Date(festival.date).getTime() - Date.now());
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;

  return (
    <div className="relative flex rounded-2xl overflow-hidden anim-fade-up" style={{ border: `1.5px solid rgba(${GLOW}, 0.4)`, boxShadow: `0 0 30px rgba(${GLOW}, 0.15)` }}>
      <div className="flex-1 p-5" style={{ background: `rgba(${GLOW}, 0.06)` }}>
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>NEXT FESTIVAL</p>
        <h3 className="text-title2 mb-1">{festival.emoji} {festival.name}</h3>
        <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>{festival.location} · {festival.cuisine}</p>
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <span className="text-largetitle tabular font-bold" style={{ color: `rgb(${GLOW})` }}>{d}</span>
            <span className="text-footnote ml-1">day{d === 1 ? '' : 's'}</span>
          </div>
          <span className="text-footnote tabular" style={{ color: 'var(--text-secondary)' }}>
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-center px-3" style={{ width: 60, background: `rgba(${GLOW}, 0.14)`, borderLeft: '2px dashed rgba(150,150,150,0.35)' }}>
        <div className="absolute -left-2.5 top-1/2 w-5 h-5 rounded-full" style={{ background: 'var(--bg-base)', transform: 'translateY(-50%)' }} />
        <span className="text-caption font-bold" style={{ writingMode: 'vertical-rl', color: `rgb(${GLOW})`, letterSpacing: '0.15em' }}>ADMIT ONE</span>
      </div>
    </div>
  );
}

export function FoodFestivalPassport() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxFestivals = isPro ? PRO_MAX_FESTIVALS : FREE_MAX_FESTIVALS;
  const deckSize = isPro ? PRO_DECK_SIZE : FREE_DECK_SIZE;

  const [passport, setPassport] = useState<Festival[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCuisine, setCustomCuisine] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customDateStr, setCustomDateStr] = useState('');
  const [customTicket, setCustomTicket] = useState('0');
  const [customBudget, setCustomBudget] = useState('50');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(31);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/food-festival-passport')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.festivals)) {
          setPassport(data.config.festivals.slice(0, PRO_MAX_FESTIVALS));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const deckPool = useMemo(
    () => FESTIVAL_TEMPLATES.slice(0, deckSize).filter(t => !skipped.has(t.name) && !passport.some(f => f.name === t.name)),
    [deckSize, skipped, passport]
  );

  const upcoming = useMemo(() => passport.filter(f => !f.attended).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [passport]);
  const nextFestival = upcoming[0] ?? null;
  const attendedCount = passport.filter(f => f.attended).length;

  const totalCommitted = useMemo(() => {
    const pool = isPro ? upcoming : upcoming.slice(0, 1);
    return pool.reduce((a, f) => a + f.ticketPrice + f.foodBudget, 0);
  }, [upcoming, isPro]);

  const weeksUntilFurthest = useMemo(() => {
    const pool = isPro ? upcoming : upcoming.slice(0, 1);
    if (pool.length === 0) return 1;
    const furthest = pool[pool.length - 1];
    return Math.max(1, Math.ceil(daysUntil(furthest.date) / 7));
  }, [upcoming, isPro]);

  const saveWeek = totalCommitted / weeksUntilFurthest;

  const cuisineBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const f of passport) counts[f.cuisine] = (counts[f.cuisine] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [passport]);
  const maxCuisineCount = Math.max(1, ...cuisineBreakdown.map(([, c]) => c));

  const health: 'empty' | 'urgent' | 'planned' =
    passport.length === 0 ? 'empty' : nextFestival && daysUntil(nextFestival.date) <= 14 ? 'urgent' : 'planned';
  const healthLabel = {
    empty: '🎟️ Passport empty — swipe to start',
    urgent: '🔥 Festival coming up fast',
    planned: '✅ Calendar looking good',
  }[health];
  const healthColor = { empty: '160, 160, 170', urgent: '255, 159, 10', planned: '52, 199, 89' }[health];

  const atFreeLimit = !isPro && passport.length >= FREE_MAX_FESTIVALS;

  // ---- swipe deck drag ----
  function handleCardPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
  }
  const commitSwipe = useCallback((dir: 'left' | 'right') => {
    const card = deckPool[0];
    if (!card) return;
    if (dir === 'right') {
      if (passport.length >= maxFestivals) {
        showToast(isPro ? `Passport full at ${maxFestivals}` : 'Upgrade to Pro to add more festivals', isPro ? '⚠️' : '⭐');
        setDragX(0); dragXRef.current = 0;
        return;
      }
      setPassport(prev => [...prev, {
        id: `fest-${Date.now()}`, name: card.name, emoji: card.emoji, cuisine: card.cuisine,
        location: card.location, date: computeDateFromOffset(card.daysFromNow),
        ticketPrice: card.ticketPrice, foodBudget: card.foodBudget, attended: false,
      }]);
      showToast(`${card.emoji} Added to your passport!`, '🎟️');
    } else {
      setSkipped(prev => new Set(prev).add(card.name));
    }
    setDragX(0); dragXRef.current = 0;
  }, [deckPool, passport.length, maxFestivals, isPro, showToast]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      const x = e.clientX - startX.current;
      dragXRef.current = x;
      setDragX(x);
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      if (dragXRef.current > SWIPE_THRESHOLD) commitSwipe('right');
      else if (dragXRef.current < -SWIPE_THRESHOLD) commitSwipe('left');
      else { setDragX(0); dragXRef.current = 0; }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [commitSwipe]);

  function toggleAttended(id: string) {
    setPassport(prev => prev.map(f => f.id === id ? { ...f, attended: !f.attended } : f));
  }
  function removeFestival(id: string) {
    setPassport(prev => prev.filter(f => f.id !== id));
  }
  function updateFestival(id: string, field: 'ticketPrice' | 'foodBudget', value: number) {
    setPassport(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add your own festival', '⭐'); return; }
    if (passport.length >= PRO_MAX_FESTIVALS) { showToast(`Passport full at ${PRO_MAX_FESTIVALS}`, '⚠️'); return; }
    setCustomName(''); setCustomCuisine(''); setCustomLocation('');
    const d = new Date(); d.setDate(d.getDate() + 30);
    setCustomDateStr(d.toISOString().slice(0, 10));
    setCustomTicket('0'); setCustomBudget('50');
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    const name = customName.trim() || 'My Festival';
    const cuisine = customCuisine.trim() || 'Mixed';
    const location = customLocation.trim() || 'TBD';
    const dateIso = new Date(`${customDateStr}T10:00:00`).toISOString();
    setPassport(prev => [...prev, {
      id: `fest-${Date.now()}`, name, emoji: '🎪', cuisine, location, date: dateIso,
      ticketPrice: Math.max(0, Math.round(Number(customTicket) || 0)),
      foodBudget: Math.max(0, Math.round(Number(customBudget) || 0)),
      attended: false,
    }]);
    setShowCustomForm(false);
    showToast('Custom festival added', '✨');
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your passport', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/food-festival-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ festivals: passport }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Passport saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function handleReset() {
    setPassport([]);
    setSkipped(new Set());
    setShowCustomForm(false);
    showToast('Passport cleared', '↺');
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
      `My Food Festival Passport (${attendedCount} attended, ${passport.length} total)`,
      ...upcoming.map(f => `- ${f.emoji} ${f.name} — ${formatDate(new Date(f.date))} · ${f.location} · ${formatMoney(f.ticketPrice + f.foodBudget)}`),
      `Total committed spend: ${formatMoney(totalCommitted)}`,
      `Save/week needed: ${formatMoney(saveWeek)}`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
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
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>FOOD FESTIVALS</p>
            <h2 className="text-title2">Festival Passport</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your passport to your account' : 'Upgrade to save your passport'}
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
            { label: 'Next festival', value: nextFestival ? `${daysUntil(nextFestival.date)}d` : '—' },
            { label: 'Stamped', value: `${attendedCount} / ${passport.length || 0}` },
            { label: 'Committed spend', value: formatMoney(totalCommitted) },
            { label: 'Save / week', value: formatMoney(saveWeek) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Ticket stub hero */}
        {nextFestival ? (
          <div className="mb-7"><TicketStub festival={nextFestival} /></div>
        ) : (
          <div className="ios-card-nested p-6 text-center mb-7">
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Swipe right on a festival below to see your first countdown ticket here.</p>
          </div>
        )}

        {/* Swipe deck */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Swipe to discover festivals</p>
            <p className="text-caption">{deckPool.length} left {!isPro && `(free deck: ${FREE_DECK_SIZE})`}</p>
          </div>
          <div className="relative" style={{ height: 190 }}>
            {deckPool.length === 0 ? (
              <div className="ios-card-nested h-full flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🍽️</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  {isPro ? "You've seen every festival in the deck — check back for more soon." : "You've seen the free deck — upgrade to Pro for 4 more festivals to discover."}
                </p>
              </div>
            ) : (
              deckPool.slice(0, 3).map((card, i) => {
                const isTop = i === 0;
                return (
                  <div
                    key={card.name}
                    onPointerDown={isTop ? handleCardPointerDown : undefined}
                    className="ios-card-nested absolute inset-0 p-5 flex flex-col justify-between"
                    style={{
                      zIndex: 10 - i,
                      transform: isTop ? `translateX(${dragX}px) rotate(${dragX / 18}deg)` : `scale(${1 - i * 0.04}) translateY(${i * 8}px)`,
                      opacity: isTop ? 1 : 0.75 - i * 0.15,
                      cursor: isTop ? 'grab' : 'default',
                      touchAction: 'none',
                      transition: dragging.current ? 'none' : 'transform 0.25s ease-out',
                      border: `1.5px solid rgba(${GLOW}, 0.3)`,
                    }}
                  >
                    <div>
                      <span className="text-3xl">{card.emoji}</span>
                      <h4 className="text-title3 mt-2 mb-1">{card.name}</h4>
                      <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{card.location} · {card.cuisine}</p>
                      <p className="text-caption mt-1">in {card.daysFromNow} days · {formatMoney(card.ticketPrice + card.foodBudget)} est.</p>
                    </div>
                    {isTop && dragX > 30 && <span className="text-headline font-bold" style={{ color: 'rgb(52, 199, 89)' }}>ADD →</span>}
                    {isTop && dragX < -30 && <span className="text-headline font-bold self-end" style={{ color: 'rgb(var(--accent-red))' }}>← SKIP</span>}
                  </div>
                );
              })
            )}
          </div>
          {deckPool.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-3">
              <button onClick={() => commitSwipe('left')} className="ios-card-nested press w-12 h-12 rounded-full flex items-center justify-center text-lg">👎</button>
              <button onClick={() => commitSwipe('right')} className="ios-card-nested press w-12 h-12 rounded-full flex items-center justify-center text-lg">👍</button>
            </div>
          )}
        </div>

        {/* Passport grid */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-footnote font-semibold">Your passport</p>
            <button onClick={openCustomForm} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '✨' : '🔒'} Add my own
            </button>
          </div>
          {passport.length === 0 ? (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Your passport is empty — swipe right on a festival above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {passport.map(f => (
                <div key={f.id} className="ios-card-nested p-3 relative overflow-hidden" style={{ filter: f.attended ? 'sepia(0.5) saturate(0.6)' : 'none' }}>
                  {f.attended && (
                    <div className="absolute top-3 right-3 pill text-[10px] font-bold" style={{ background: 'rgba(255,69,58,0.15)', color: 'rgb(255,69,58)', transform: 'rotate(-8deg)' }}>
                      ✅ ATTENDED
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{f.emoji}</span>
                    <span className="text-footnote font-bold">{f.name}</span>
                  </div>
                  <p className="text-caption mb-2">{f.location} · {f.cuisine} · {formatDate(new Date(f.date))}</p>
                  <div className="flex items-center justify-between flex-wrap gap-2 text-caption mb-3">
                    <span>Ticket <EditableAmount value={f.ticketPrice} onCommit={v => updateFestival(f.id, 'ticketPrice', v)} colorRgb={GLOW} /></span>
                    <span>Food <EditableAmount value={f.foodBudget} onCommit={v => updateFestival(f.id, 'foodBudget', v)} colorRgb={GLOW} /></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => toggleAttended(f.id)} className="ios-card-nested press text-xs px-2.5 py-1.5">
                      {f.attended ? '↺ Unmark' : 'I went! 🎉'}
                    </button>
                    <button onClick={() => removeFestival(f.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom festival form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ Add my own festival</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption">Name</span>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Mango Fest" maxLength={40}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Cuisine</span>
                <input value={customCuisine} onChange={e => setCustomCuisine(e.target.value)} placeholder="e.g. Peruvian" list="cuisine-suggestions" maxLength={30}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
                <datalist id="cuisine-suggestions">
                  {CUISINE_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                </datalist>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Location</span>
                <input value={customLocation} onChange={e => setCustomLocation(e.target.value)} placeholder="e.g. Lima, Peru" maxLength={40}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Date</span>
                <input type="date" value={customDateStr} onChange={e => setCustomDateStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Ticket price ($)</span>
                <input type="number" min={0} value={customTicket} onChange={e => setCustomTicket(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Food budget ($)</span>
                <input type="number" min={0} value={customBudget} onChange={e => setCustomBudget(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add to passport</button>
          </form>
        )}

        {/* Cuisine variety */}
        {cuisineBreakdown.length > 0 && (
          <div className="mb-7">
            <p className="text-footnote font-semibold mb-3">Cuisine variety</p>
            <div className="flex flex-col gap-2">
              {cuisineBreakdown.map(([cuisine, count]) => (
                <div key={cuisine} className="flex items-center gap-3">
                  <span className="text-caption w-28 flex-shrink-0 truncate">{cuisine}</span>
                  <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(count / maxCuisineCount) * 100}%`, background: `rgb(${GLOW})` }} />
                  </div>
                  <span className="text-caption tabular w-4 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ Passport full" : `🔒 Free plan: ${FREE_MAX_FESTIVALS} festivals, ${FREE_DECK_SIZE}-card deck`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_FESTIVALS} festivals, a {PRO_DECK_SIZE}-card deck, adding your own festivals, full budget projection, and saving your passport.</p>
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

      <ToolCommentSection seedComments={FOOD_FESTIVAL_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
