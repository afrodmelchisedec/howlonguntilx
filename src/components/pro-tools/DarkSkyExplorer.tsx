// FILE: src/components/pro-tools/DarkSkyExplorer.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { DARK_SKY_COMMENTS } from './darkSkyComments';

interface SkySpot { id: string; name: string; emoji: string; bortle: number }
interface NightInfo {
  dateStr: string;
  score: number;
  illum: number;
  phaseEmoji: string;
  phaseName: string;
  moonriseHour: number;
  event: { name: string; emoji: string } | null;
}

const GLOW = '110, 231, 183';
const STAR_W = 400;
const STAR_H = 150;

const FREE_NIGHTS = 7;
const PRO_NIGHTS = 30;
const MAX_SPOTS = 5;
const SPOT_EMOJIS = ['📍', '🏡', '🏔️', '🏜️', '🏖️', '⛺', '🌲', '🏕️'];

const MOON_SYNODIC = 29.530588;
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

const METEOR_SHOWERS: { name: string; month: number; day: number }[] = [
  { name: 'Quadrantids', month: 1, day: 4 },
  { name: 'Lyrids', month: 4, day: 22 },
  { name: 'Eta Aquariids', month: 5, day: 5 },
  { name: 'Perseids', month: 8, day: 12 },
  { name: 'Orionids', month: 10, day: 21 },
  { name: 'Leonids', month: 11, day: 17 },
  { name: 'Geminids', month: 12, day: 14 },
  { name: 'Ursids', month: 12, day: 22 },
];

const BORTLE_LABELS: Record<number, string> = {
  1: 'Excellent Dark Sky', 2: 'Typical Dark Sky', 3: 'Rural Sky', 4: 'Rural/Suburban Transition',
  5: 'Suburban Sky', 6: 'Bright Suburban Sky', 7: 'Suburban/Urban Transition', 8: 'City Sky', 9: 'Inner-City Sky',
};
const BORTLE_DESC: Record<number, string> = {
  1: 'Milky Way casts visible shadows, thousands of stars visible.',
  2: 'Milky Way highly structured, airglow visible near horizon.',
  3: 'Milky Way still shows good structure, some light domes visible.',
  4: 'Milky Way visible but lacking detail near the horizon.',
  5: 'Milky Way only visible near zenith, washed out elsewhere.',
  6: 'Milky Way barely visible near zenith on good nights.',
  7: 'Sky glows grayish-white, Milky Way invisible.',
  8: 'Sky glows orange-white, only bright stars and planets visible.',
  9: 'Entire sky is brightly lit, only the Moon, planets and a handful of stars visible.',
};
function bortleColor(b: number): string {
  if (b <= 2) return GLOW;
  if (b <= 4) return '129, 178, 255';
  if (b <= 6) return '255, 159, 10';
  return '255, 99, 99';
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 99991) * 10000;
  return x - Math.floor(x);
}
const ALL_STARS = Array.from({ length: 420 }, (_, i) => ({
  x: seededRandom(i * 3 + 1) * 100,
  y: seededRandom(i * 7 + 2) * 92,
  r: 0.5 + seededRandom(i * 11 + 3) * 1.4,
}));
function clarityIndex(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  return hash % 100;
}

function startOfToday(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(d: Date, n: number): Date { return new Date(d.getTime() + n * 86400000); }
function moonAge(date: Date): number {
  const diffDays = (date.getTime() - REF_NEW_MOON) / 86400000;
  let age = diffDays % MOON_SYNODIC;
  if (age < 0) age += MOON_SYNODIC;
  return age;
}
function moonIllumination(age: number): number {
  return Math.round(((1 - Math.cos((2 * Math.PI * age) / MOON_SYNODIC)) / 2) * 100);
}
function moonPhaseInfo(age: number): { emoji: string; name: string } {
  const f = age / MOON_SYNODIC;
  if (f < 0.03 || f > 0.97) return { emoji: '🌑', name: 'New Moon' };
  if (f < 0.22) return { emoji: '🌒', name: 'Waxing Crescent' };
  if (f < 0.28) return { emoji: '🌓', name: 'First Quarter' };
  if (f < 0.47) return { emoji: '🌔', name: 'Waxing Gibbous' };
  if (f < 0.53) return { emoji: '🌕', name: 'Full Moon' };
  if (f < 0.72) return { emoji: '🌖', name: 'Waning Gibbous' };
  if (f < 0.78) return { emoji: '🌗', name: 'Last Quarter' };
  return { emoji: '🌘', name: 'Waning Crescent' };
}
function nextShowerOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getFullYear();
  let candidate = new Date(year, month - 1, day);
  if (candidate < from) candidate = new Date(year + 1, month - 1, day);
  return candidate;
}
function eventOnDate(dateStr: string): { name: string; emoji: string } | null {
  const shower = METEOR_SHOWERS.find(s => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return s.month === m && s.day === d;
  });
  return shower ? { name: shower.name, emoji: '🌠' } : null;
}
function nextUpcomingEvent(from: Date): { name: string; date: string; days: number } {
  let best: { name: string; date: Date } | null = null;
  for (const s of METEOR_SHOWERS) {
    const d = nextShowerOccurrence(s.month, s.day, from);
    if (!best || d < best.date) best = { name: s.name, date: d };
  }
  return { name: best!.name, date: isoDate(best!.date), days: Math.round((best!.date.getTime() - from.getTime()) / 86400000) };
}
function computeNight(dateStr: string, bortle: number): NightInfo {
  const evalDate = new Date(dateStr + 'T22:00:00');
  const age = moonAge(evalDate);
  const illum = moonIllumination(age);
  const phase = moonPhaseInfo(age);
  const moonriseHour = Math.round(((6 + age * 0.826) % 24) * 10) / 10;
  const event = eventOnDate(dateStr);
  const moonPenalty = illum * 0.55;
  const bortlePenalty = (bortle - 1) * 6;
  const eventBonus = event ? 15 : 0;
  const clarity = clarityIndex(dateStr);
  const clarityFactor = 0.55 + (clarity / 100) * 0.45;
  const raw = (100 - moonPenalty - bortlePenalty + eventBonus) * clarityFactor;
  return {
    dateStr, score: Math.max(0, Math.min(100, Math.round(raw))), illum,
    phaseEmoji: phase.emoji, phaseName: phase.name, moonriseHour, event,
  };
}
function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((d.getTime() - startOfToday().getTime()) / 86400000);
  const weekday = diff === 0 ? 'Tonight' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${weekday} · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}
function formatHour(h: number): string {
  const hh = Math.floor(h) % 24, mm = Math.round((h % 1) * 60);
  const ampm = hh < 12 ? 'AM' : 'PM'; let h12 = hh % 12; if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}
function scoreColor(score: number): string {
  if (score >= 75) return GLOW;
  if (score >= 55) return '129, 178, 255';
  if (score >= 35) return '255, 159, 10';
  return '255, 99, 99';
}

function EditableSpotName({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { const t = draft.trim(); onCommit(t.length > 0 ? t : value); setEditing(false); }
  if (editing) {
    return (
      <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-xs font-bold bg-transparent outline-none border-b" style={{ borderColor: `rgb(${GLOW})`, width: `${Math.max(draft.length, 5)}ch` }} />
    );
  }
  return <button onClick={() => { setDraft(value); setEditing(true); }} className="text-xs font-bold press" title="Click to rename">{value}</button>;
}

export function DarkSkyExplorer() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const nightCount = isPro ? PRO_NIGHTS : FREE_NIGHTS;

  const [freeBortle, setFreeBortle] = useState(5);
  const [spots, setSpots] = useState<SkySpot[]>([
    { id: 'spot-home', name: 'My Backyard', emoji: '🏡', bortle: 6 },
    { id: 'spot-cabin', name: 'Mountain Cabin', emoji: '🏔️', bortle: 3 },
  ]);
  const [activeSpotId, setActiveSpotId] = useState('spot-home');
  const [selectedDate, setSelectedDate] = useState(isoDate(startOfToday()));
  const [pulse, setPulse] = useState(false);
  const [hoveringSlider, setHoveringSlider] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(38);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingSlider = useRef(false);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/dark-sky-explorer')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.spots) && data.config.spots.length > 0) setSpots(data.config.spots.slice(0, MAX_SPOTS));
          if (data.config.activeSpotId) setActiveSpotId(data.config.activeSpotId);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const activeSpot = useMemo(() => spots.find(s => s.id === activeSpotId) ?? spots[0], [spots, activeSpotId]);
  const bortle = isPro ? (activeSpot?.bortle ?? 5) : freeBortle;

  useEffect(() => { setPulse(true); const t = setTimeout(() => setPulse(false), 200); return () => clearTimeout(t); }, [bortle]);

  const nights = useMemo(() => {
    const today = startOfToday();
    return Array.from({ length: nightCount }, (_, i) => computeNight(isoDate(addDays(today, i)), bortle));
  }, [nightCount, bortle]);

  const selectedNight = useMemo(() => nights.find(n => n.dateStr === selectedDate) ?? nights[0], [nights, selectedDate]);
  const bestNight = useMemo(() => nights.reduce((m, n) => (n.score > m.score ? n : m), nights[0]), [nights]);
  const tonightNight = nights[0];
  const nextEvent = useMemo(() => nextUpcomingEvent(startOfToday()), []);

  const weekAvg = useMemo(() => Math.round(nights.slice(0, 7).reduce((a, n) => a + n.score, 0) / Math.min(7, nights.length)), [nights]);
  const health: 'prime' | 'good' | 'fair' | 'poor' | 'shower' =
    nextEvent.days <= 3 ? 'shower' : weekAvg >= 70 ? 'prime' : weekAvg >= 50 ? 'good' : weekAvg >= 30 ? 'fair' : 'poor';
  const healthLabel = {
    prime: '✨ Prime stargazing week', good: '🌌 Good viewing week', fair: '🌤️ Fair viewing week',
    poor: '🌕 Moon-washed week', shower: `🌠 ${nextEvent.name} peaks in ${nextEvent.days}d`,
  }[health];
  const healthColor = { prime: GLOW, good: '129, 178, 255', fair: '255, 159, 10', poor: '255, 99, 99', shower: '255, 200, 87' }[health];

  const starCount = Math.round(20 + (9 - bortle) * 45);
  const visibleStars = ALL_STARS.slice(0, starCount);
  const milkyWayOpacity = bortle <= 3 ? ((4 - bortle) / 3) * 0.45 : 0;

  // ---- Bortle slider (fixed 1-9 domain — never derived from data) ----
  function bortleAtClientX(clientX: number): number {
    if (!sliderRef.current) return bortle;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 8) + 1;
  }
  function applyBortle(value: number) {
    const clamped = Math.max(1, Math.min(9, value));
    if (isPro) setSpots(prev => prev.map(s => s.id === activeSpotId ? { ...s, bortle: clamped } : s));
    else setFreeBortle(clamped);
  }
  function startDrag(clientX: number) { draggingSlider.current = true; setHoveringSlider(true); applyBortle(bortleAtClientX(clientX)); }
  const handleMove = useCallback((clientX: number) => { if (draggingSlider.current) applyBortle(bortleAtClientX(clientX)); }, [isPro, activeSpotId]);
  useEffect(() => {
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { draggingSlider.current = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleMove]);

  function switchSpot(id: string) { setActiveSpotId(id); showToast(`Switched to ${spots.find(s => s.id === id)?.name}`, '📍'); }
  function addSpot() {
    if (!isPro) { showToast('Upgrade to Pro to save multiple Sky Spots', '⭐'); return; }
    if (spots.length >= MAX_SPOTS) { showToast(`You can save up to ${MAX_SPOTS} spots`, '⚠️'); return; }
    const emoji = SPOT_EMOJIS[spots.length % SPOT_EMOJIS.length];
    const id = `spot-${Date.now()}`;
    setSpots(prev => [...prev, { id, name: `New Spot ${prev.length + 1}`, emoji, bortle: 5 }]);
    setActiveSpotId(id);
  }
  function removeSpot(id: string) {
    if (spots.length <= 1) { showToast('Keep at least one Sky Spot', 'ℹ️'); return; }
    setSpots(prev => {
      const next = prev.filter(s => s.id !== id);
      if (activeSpotId === id) setActiveSpotId(next[0].id);
      return next;
    });
  }
  function renameSpot(id: string, name: string) { setSpots(prev => prev.map(s => s.id === id ? { ...s, name } : s)); }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your Sky Spots', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/dark-sky-explorer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spots, activeSpotId }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Sky Spots saved!', '💾');
    } catch { showToast('Could not save — try again', '⚠️'); } finally { setSavingConfig(false); }
  }
  function handleReset() { setFreeBortle(5); setSelectedDate(isoDate(startOfToday())); showToast('Reset to defaults', '↺'); }
  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() { if (!session) { requireAuth(); return; } setToolLiked(p => { setToolLikeCount(c => p ? c - 1 : c + 1); return !p; }); }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyPlan() {
    const lines = [
      `Sky Spot: ${activeSpot?.name ?? 'My Location'} (Bortle ${bortle} · ${BORTLE_LABELS[bortle]})`,
      `${formatDateLabel(selectedNight.dateStr)}: Score ${selectedNight.score}/100`,
      `Moon: ${selectedNight.phaseEmoji} ${selectedNight.phaseName}, ${selectedNight.illum}% illuminated, rises ~${formatHour(selectedNight.moonriseHour)}`,
      selectedNight.event ? `Event: ${selectedNight.event.emoji} ${selectedNight.event.name} peaks tonight` : `Next event: ${nextEvent.name} in ${nextEvent.days} days`,
      `Best night in view: ${formatDateLabel(bestNight.dateStr)} (${bestNight.score}/100)`,
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() { if (!session) { requireAuth(); return; } document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>NATURE, SPACE & SKY</p>
            <h2 className="text-title2">Dark Sky Explorer</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button onClick={handleSaveConfig} disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your Sky Spots' : 'Upgrade to save your Sky Spots'}>
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        {/* Sky Spots */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Your Sky Spots</p>
            <button onClick={addSpot} className="press text-xs flex items-center gap-1" style={{ color: isPro ? `rgb(${GLOW})` : 'var(--text-tertiary)' }}>
              {isPro ? '+ Add spot' : '🔒 Add spot'}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(isPro ? spots : [{ id: 'default', name: 'My Location', emoji: '📍', bortle: freeBortle }]).map(s => (
              <div key={s.id} className="ios-card-nested px-3 py-2 flex items-center gap-2" style={{
                border: s.id === activeSpotId || !isPro ? `1.5px solid rgb(${GLOW})` : '1px solid var(--border-hairline)',
                background: s.id === activeSpotId || !isPro ? `rgba(${GLOW}, 0.08)` : 'transparent',
              }}>
                <button onClick={() => isPro && switchSpot(s.id)} className="press flex items-center gap-1.5" style={{ cursor: isPro ? 'pointer' : 'default' }}>
                  <span>{s.emoji}</span>
                  {isPro ? <EditableSpotName value={s.name} onCommit={v => renameSpot(s.id, v)} /> : <span className="text-xs font-bold">{s.name}</span>}
                </button>
                {isPro && spots.length > 1 && s.id === activeSpotId && (
                  <button onClick={() => removeSpot(s.id)} className="press text-[10px]" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Starfield preview + Bortle slider */}
        <div className="mb-3">
          <div className="rounded-2xl overflow-hidden relative mb-3" style={{ background: 'linear-gradient(180deg, #05050f 0%, #0c0c1e 100%)', height: STAR_H }}>
            <svg viewBox={`0 0 ${STAR_W} ${STAR_H}`} width="100%" height="100%" preserveAspectRatio="none">
              {milkyWayOpacity > 0 && (
                <ellipse cx={STAR_W / 2} cy={STAR_H / 2} rx={STAR_W * 0.7} ry={STAR_H * 0.35} fill={`rgba(${GLOW}, ${milkyWayOpacity})`} transform={`rotate(-18 ${STAR_W / 2} ${STAR_H / 2})`} />
              )}
              {visibleStars.map((s, i) => (
                <circle key={i} cx={(s.x / 100) * STAR_W} cy={(s.y / 100) * STAR_H} r={s.r} fill="white" opacity={0.5 + s.r / 3} className="transition-opacity duration-300" />
              ))}
            </svg>
            <div className="absolute top-2 right-3 text-right">
              <p className="text-2xl leading-none">{selectedNight.phaseEmoji}</p>
              <p className="text-[10px] font-semibold text-white" style={{ opacity: 0.8 }}>{selectedNight.illum}% lit</p>
            </div>
            <div className="absolute bottom-2 left-3">
              <p className="text-[11px] font-bold" style={{ color: `rgb(${bortleColor(bortle)})` }}>{starCount} stars visible</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag to set your sky's light pollution (Bortle Scale)</p>
          </div>
          <div className="relative" style={{ paddingTop: 34 }}>
            <div
              className="absolute anim-fade-up"
              style={{ left: `${((bortle - 1) / 8) * 100}%`, top: 0, transform: 'translateX(-50%)', width: 190 }}
            >
              <div className="ios-card-nested p-2.5 text-center" style={{ border: `1.5px solid rgb(${bortleColor(bortle)})`, boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }}>
                <p className="text-footnote font-bold" style={{ color: `rgb(${bortleColor(bortle)})` }}>Bortle {bortle} · {BORTLE_LABELS[bortle]}</p>
                {hoveringSlider && <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>{BORTLE_DESC[bortle]}</p>}
              </div>
            </div>
            <div
              ref={sliderRef}
              className="relative h-4 rounded-full"
              style={{ background: 'linear-gradient(90deg, rgba(110,231,183,0.5), rgba(129,178,255,0.5), rgba(255,159,10,0.5), rgba(255,99,99,0.5))', touchAction: 'none' }}
              onPointerDown={e => startDrag(e.clientX)}
              onMouseEnter={() => setHoveringSlider(true)}
              onMouseLeave={() => { if (!draggingSlider.current) setHoveringSlider(false); }}
            >
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="absolute top-1/2 rounded-full" style={{ left: `${(i / 8) * 100}%`, width: 2, height: 8, background: 'rgba(0,0,0,0.25)', transform: 'translate(-50%, -50%)' }} />
              ))}
              <div
                className="absolute top-1/2 rounded-full transition-all duration-100"
                style={{
                  left: `${((bortle - 1) / 8) * 100}%`, width: 32, height: 32, transform: 'translate(-50%, -50%)',
                  background: 'white', border: `4px solid rgb(${bortleColor(bortle)})`, boxShadow: `0 2px 12px rgba(${bortleColor(bortle)}, 0.6)`, cursor: 'grab', touchAction: 'none',
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-caption">1 · Excellent</span>
              <span className="text-caption">9 · Inner-City</span>
            </div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-7">
          {[
            { label: "Tonight's score", value: `${tonightNight.score}/100` },
            { label: 'Best night', value: `${bestNight.score}/100` },
            { label: 'Moon tonight', value: `${tonightNight.illum}%` },
            { label: 'Next event', value: `${nextEvent.days}d` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Forecast strip */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">{nightCount}-night forecast — tap a night for details</p>
            <p className="text-caption">avg {weekAvg}%</p>
          </div>
          <div className="flex gap-1 items-end overflow-x-auto pb-1" style={{ height: 90 }}>
            {nights.map(n => {
              const isSelected = n.dateStr === selectedDate;
              const isBest = n.dateStr === bestNight.dateStr;
              return (
                <button key={n.dateStr} onClick={() => setSelectedDate(n.dateStr)} className="flex flex-col items-center justify-end press flex-shrink-0" style={{ width: nightCount > 14 ? 20 : 40, height: '100%' }}>
                  {isBest && <span className="text-[9px]">✨</span>}
                  <div className="w-full rounded-t-md transition-all duration-300" style={{
                    height: `${Math.max(6, n.score * 0.55)}px`,
                    background: `rgb(${scoreColor(n.score)})`,
                    opacity: isSelected ? 1 : 0.55,
                    boxShadow: isSelected ? `0 0 8px rgba(${scoreColor(n.score)}, 0.6)` : 'none',
                    border: isSelected ? '2px solid white' : 'none',
                  }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected night detail */}
        <div className="ios-card-nested p-4 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <p className="text-headline">{formatDateLabel(selectedNight.dateStr)}</p>
            <span className="pill text-xs font-bold" style={{ background: `rgba(${scoreColor(selectedNight.score)}, 0.15)`, color: `rgb(${scoreColor(selectedNight.score)})` }}>
              {selectedNight.score}/100
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-footnote">
            <p>{selectedNight.phaseEmoji} {selectedNight.phaseName} · {selectedNight.illum}% lit</p>
            <p>🌙 Moonrise ~{formatHour(selectedNight.moonriseHour)}</p>
            <p>{selectedNight.event ? `${selectedNight.event.emoji} ${selectedNight.event.name} peaks tonight` : '✨ No major event tonight'}</p>
            <p style={{ color: 'var(--text-secondary)' }}>{selectedNight.illum > 50 ? 'Best after the Moon sets' : 'Good visibility most of the night'}</p>
          </div>
        </div>

        {nextEvent.days > (isPro ? PRO_NIGHTS : FREE_NIGHTS) && (
          <div className="ios-card-nested p-3 mb-6 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(255, 200, 87)' }}>
            <span className="text-lg flex-shrink-0">🌠</span>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              Next celestial event: <strong>{nextEvent.name}</strong> peaks in <strong>{nextEvent.days} days</strong> — outside your current forecast window.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end mb-6">
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: 7-night forecast, 1 unsaved spot</p>
              <p className="text-caption">Upgrade to Premium for a 30-night forecast, up to {MAX_SPOTS} saved Sky Spots, every event, and saving your setup.</p>
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

      <ToolCommentSection seedComments={DARK_SKY_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
