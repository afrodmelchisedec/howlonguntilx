// FILE: src/components/pro-tools/HarvestSeasons.tsx
'use client';
import { useState, useRef, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { HARVEST_SEASONS_COMMENTS } from './harvestSeasonsComments';

interface ProduceItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  start: number;     // day-of-year, 1-365
  peakStart: number;
  peakEnd: number;
  end: number;
  custom?: boolean;
}
type Phase = 'peak' | 'ramping' | 'fading' | 'off';
interface Status { phase: Phase; daysToNext: number; label: string; score: number }
type Hemisphere = 'northern' | 'southern';

const GLOW = '154, 205, 50';
const PEAK_HIGHLIGHT = '255, 149, 0';

const FREE_MAX_BASKET = 5;
const PRO_MAX_BASKET = 15;

const CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function md(month: number, day: number): number { return CUM_DAYS[month - 1] + day; }

const CATALOG: ProduceItem[] = [
  { id: 'strawberries', name: 'Strawberries',     emoji: '🍓', color: '255, 107, 107', start: md(4, 15), peakStart: md(5, 15), peakEnd: md(6, 15), end: md(7, 15) },
  { id: 'watermelon',   name: 'Watermelon',       emoji: '🍉', color: '76, 175, 80',   start: md(6, 1),  peakStart: md(7, 1),  peakEnd: md(8, 15), end: md(9, 15) },
  { id: 'corn',         name: 'Corn',              emoji: '🌽', color: '255, 214, 10',  start: md(6, 15), peakStart: md(7, 15), peakEnd: md(8, 31), end: md(9, 30) },
  { id: 'tomatoes',     name: 'Tomatoes',          emoji: '🍅', color: '255, 90, 54',   start: md(6, 1),  peakStart: md(7, 15), peakEnd: md(9, 1),  end: md(10, 1) },
  { id: 'peaches',      name: 'Peaches',           emoji: '🍑', color: '255, 159, 10',  start: md(5, 15), peakStart: md(6, 15), peakEnd: md(8, 15), end: md(9, 1) },
  { id: 'cherries',     name: 'Cherries',          emoji: '🍒', color: '214, 40, 57',   start: md(5, 15), peakStart: md(6, 1),  peakEnd: md(7, 1),  end: md(7, 15) },
  { id: 'blueberries',  name: 'Blueberries',       emoji: '🫐', color: '100, 120, 255', start: md(6, 1),  peakStart: md(7, 1),  peakEnd: md(8, 1),  end: md(8, 31) },
  { id: 'zucchini',     name: 'Zucchini',          emoji: '🥒', color: '104, 159, 56',  start: md(6, 1),  peakStart: md(7, 1),  peakEnd: md(8, 15), end: md(9, 15) },
  { id: 'pumpkin',      name: 'Pumpkin',           emoji: '🎃', color: '255, 140, 0',   start: md(9, 1),  peakStart: md(10, 1), peakEnd: md(10, 31), end: md(11, 15) },
  { id: 'apples',       name: 'Apples',            emoji: '🍎', color: '229, 57, 53',   start: md(8, 15), peakStart: md(9, 15), peakEnd: md(10, 31), end: md(12, 1) },
  { id: 'asparagus',    name: 'Asparagus',         emoji: '🌱', color: '139, 195, 74',  start: md(3, 15), peakStart: md(4, 1),  peakEnd: md(5, 15), end: md(6, 1) },
  { id: 'cranberries',  name: 'Cranberries',       emoji: '🔴', color: '198, 40, 40',   start: md(9, 15), peakStart: md(10, 15), peakEnd: md(11, 15), end: md(12, 1) },
  { id: 'kale',         name: 'Kale',              emoji: '🥬', color: '85, 139, 47',   start: md(10, 1), peakStart: md(11, 1), peakEnd: md(2, 1),  end: md(3, 1) },
  { id: 'brussels',     name: 'Brussels Sprouts',  emoji: '🥦', color: '104, 159, 56',  start: md(10, 1), peakStart: md(11, 1), peakEnd: md(12, 15), end: md(1, 15) },
  { id: 'citrus',       name: 'Citrus',            emoji: '🍊', color: '255, 167, 38',  start: md(11, 15), peakStart: md(12, 15), peakEnd: md(2, 15), end: md(3, 15) },
  { id: 'figs',         name: 'Figs',              emoji: '🟣', color: '142, 68, 173',  start: md(8, 1),  peakStart: md(8, 15), peakEnd: md(9, 30), end: md(10, 15) },
  { id: 'persimmons',   name: 'Persimmons',        emoji: '🟠', color: '230, 126, 34',  start: md(10, 1), peakStart: md(10, 15), peakEnd: md(12, 1), end: md(12, 15) },
  { id: 'rhubarb',      name: 'Rhubarb',           emoji: '🌺', color: '233, 30, 99',   start: md(4, 1),  peakStart: md(4, 15), peakEnd: md(6, 1),  end: md(6, 15) },
  { id: 'squash',       name: 'Butternut Squash',  emoji: '🧡', color: '243, 156, 18',  start: md(9, 15), peakStart: md(10, 15), peakEnd: md(12, 1), end: md(12, 31) },
];

const DEFAULT_BASKET_IDS = ['strawberries', 'tomatoes', 'pumpkin'];
const DEFAULT_BASKET: ProduceItem[] = CATALOG.filter(c => DEFAULT_BASKET_IDS.includes(c.id)).map(c => ({ ...c }));

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

function inRange(doy: number, start: number, end: number): boolean {
  if (start <= end) return doy >= start && doy <= end;
  return doy >= start || doy <= end;
}
function forwardDist(from: number, to: number): number {
  let diff = to - from;
  if (diff < 0) diff += 365;
  return diff;
}
function currentDoy(): number {
  const d = new Date();
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}
function shiftDoy(doy: number, offset: number): number {
  let v = doy + offset;
  v = ((v - 1) % 365 + 365) % 365 + 1;
  return v;
}
function bandSegments(startDoy: number, endDoy: number): { left: number; width: number }[] {
  const s = (startDoy / 365) * 100;
  const e = (endDoy / 365) * 100;
  if (s <= e) return [{ left: s, width: e - s }];
  return [{ left: s, width: 100 - s }, { left: 0, width: e }];
}
function computeStatus(item: ProduceItem, doy: number): Status {
  if (inRange(doy, item.peakStart, item.peakEnd)) {
    const daysToNext = forwardDist(doy, item.peakEnd);
    return { phase: 'peak', daysToNext, label: daysToNext === 0 ? '🔥 Last day of peak' : `🔥 Peak — ${daysToNext}d left`, score: 100 };
  }
  if (inRange(doy, item.start, item.end)) {
    if (inRange(doy, item.start, item.peakStart)) {
      const total = forwardDist(item.start, item.peakStart) || 1;
      const done = forwardDist(item.start, doy);
      const daysToNext = forwardDist(doy, item.peakStart);
      return { phase: 'ramping', daysToNext, label: `Peak in ${daysToNext}d`, score: Math.round(100 * (done / total)) };
    }
    const total = forwardDist(item.peakEnd, item.end) || 1;
    const done = forwardDist(item.peakEnd, doy);
    const daysToNext = forwardDist(doy, item.end);
    return { phase: 'fading', daysToNext, label: `Ends in ${daysToNext}d`, score: Math.max(0, Math.round(100 * (1 - done / total))) };
  }
  const daysToNext = forwardDist(doy, item.start);
  return { phase: 'off', daysToNext, label: `Starts in ${daysToNext}d`, score: 0 };
}
function phaseColor(phase: Phase, itemColor: string): string {
  if (phase === 'peak') return PEAK_HIGHLIGHT;
  if (phase === 'off') return '160, 160, 170';
  return itemColor;
}
function toDateInputStr(d: Date): string { return d.toISOString().slice(0, 10); }
function addDays(base: Date, days: number): Date { const d = new Date(base); d.setDate(d.getDate() + days); return d; }
function dateStrToDoy(str: string): number {
  const parts = str.split('-').map(Number);
  return md(parts[1], parts[2]);
}

const CUSTOM_COLORS = ['154, 205, 50', '255, 122, 165', '100, 200, 255', '196, 132, 252', '255, 159, 10'];

export function HarvestSeasons() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxBasket = isPro ? PRO_MAX_BASKET : FREE_MAX_BASKET;

  const [basket, setBasket] = useState<ProduceItem[]>(DEFAULT_BASKET);
  const [hemisphere, setHemisphere] = useState<Hemisphere>('northern');
  const [searchQuery, setSearchQuery] = useState('');
  const [tick, setTick] = useState(0);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState('🌾');
  const [customStart, setCustomStart] = useState('');
  const [customPeakStart, setCustomPeakStart] = useState('');
  const [customPeakEnd, setCustomPeakEnd] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(24);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/harvest-seasons')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.items)) setBasket(data.config.items.slice(0, PRO_MAX_BASKET));
          if (data.config.hemisphere) setHemisphere(data.config.hemisphere);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const doy = useMemo(() => currentDoy(), [tick]);
  const offset = (isPro && hemisphere === 'southern') ? 182 : 0;

  const effectiveBasket = useMemo(() => basket.map(item => ({
    ...item,
    start: shiftDoy(item.start, offset),
    peakStart: shiftDoy(item.peakStart, offset),
    peakEnd: shiftDoy(item.peakEnd, offset),
    end: shiftDoy(item.end, offset),
  })), [basket, offset]);

  const withStatus = useMemo(() => effectiveBasket.map(item => ({ item, status: computeStatus(item, doy) })), [effectiveBasket, doy]);

  const sortedBasket = useMemo(() => [...withStatus].sort((a, b) => {
    if (a.status.phase === 'peak' && b.status.phase !== 'peak') return -1;
    if (b.status.phase === 'peak' && a.status.phase !== 'peak') return 1;
    return a.status.daysToNext - b.status.daysToNext;
  }), [withStatus]);

  const peakCount = withStatus.filter(w => w.status.phase === 'peak').length;
  const startingSoonCount = withStatus.filter(w => (w.status.phase === 'off' || w.status.phase === 'ramping') && w.status.daysToNext <= 14).length;
  const avgFreshness = basket.length ? Math.round(withStatus.reduce((a, w) => a + w.status.score, 0) / basket.length) : 0;

  const health: 'peak' | 'soon' | 'quiet' = peakCount > 0 ? 'peak' : startingSoonCount > 0 ? 'soon' : 'quiet';
  const healthLabel = {
    peak: `🔥 ${peakCount} at peak right now`,
    soon: `🌱 ${startingSoonCount} starting soon`,
    quiet: '📦 Nothing peaking right now',
  }[health];
  const healthColor = { peak: PEAK_HIGHLIGHT, soon: GLOW, quiet: '160, 160, 170' }[health];

  const peakAlerts = useMemo(() => {
    if (!isPro) return [];
    return withStatus
      .filter(w => (w.status.phase === 'ramping' || w.status.phase === 'off') && w.status.daysToNext <= 7)
      .sort((a, b) => a.status.daysToNext - b.status.daysToNext);
  }, [withStatus, isPro]);

  const basketIds = useMemo(() => new Set(basket.map(b => b.id)), [basket]);
  const catalogFiltered = useMemo(
    () => CATALOG.filter(c => !basketIds.has(c.id) && c.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [basketIds, searchQuery]
  );

  const atFreeLimit = !isPro && basket.length >= FREE_MAX_BASKET;

  function addProduce(item: ProduceItem) {
    if (basket.length >= maxBasket) {
      showToast(isPro ? `Basket full at ${maxBasket}` : 'Upgrade to Pro to track more produce', isPro ? '⚠️' : '⭐');
      return;
    }
    setBasket(prev => [...prev, { ...item }]);
  }
  function removeProduce(id: string) {
    setBasket(prev => prev.filter(b => b.id !== id));
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add your own produce', '⭐'); return; }
    if (basket.length >= PRO_MAX_BASKET) { showToast(`Basket full at ${PRO_MAX_BASKET}`, '⚠️'); return; }
    const today = new Date();
    setCustomName(''); setCustomEmoji('🌾');
    setCustomStart(toDateInputStr(today));
    setCustomPeakStart(toDateInputStr(addDays(today, 14)));
    setCustomPeakEnd(toDateInputStr(addDays(today, 45)));
    setCustomEnd(toDateInputStr(addDays(today, 60)));
    setShowCustomForm(true);
  }
  function handleAddCustom(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    const name = customName.trim() || 'My Produce';
    const color = CUSTOM_COLORS[basket.length % CUSTOM_COLORS.length];
    setBasket(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name, emoji: customEmoji.trim() || '🌾', color, custom: true,
      start: dateStrToDoy(customStart),
      peakStart: dateStrToDoy(customPeakStart),
      peakEnd: dateStrToDoy(customPeakEnd),
      end: dateStrToDoy(customEnd),
    }]);
    setShowCustomForm(false);
    showToast('Custom produce added', '✨');
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your basket', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/harvest-seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: basket, hemisphere }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Basket saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function handleReset() {
    setBasket(DEFAULT_BASKET.map(i => ({ ...i })));
    setHemisphere('northern');
    setShowCustomForm(false);
    showToast('Basket reset', '↺');
  }

  function setHemisphereGuarded(h: Hemisphere) {
    if (!isPro) { showToast('Upgrade to Pro to switch hemispheres', '⭐'); return; }
    setHemisphere(h);
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
      `This week's harvest picks (${hemisphere === 'southern' ? 'Southern' : 'Northern'} Hemisphere):`,
      ...sortedBasket.map(({ item, status }) => `- ${item.emoji} ${item.name}: ${status.label} (${status.score}% fresh)`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Shopping list copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
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
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>HARVEST SEASONS</p>
            <h2 className="text-title2">Season Basket</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your basket to your account' : 'Upgrade to save your basket'}
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
            { label: 'At peak now', value: String(peakCount) },
            { label: 'Starting soon', value: String(startingSoonCount) },
            { label: 'Basket items', value: `${basket.length} / ${maxBasket}` },
            { label: 'Avg freshness', value: `${avgFreshness}%` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hemisphere toggle */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <p className="text-footnote font-semibold">Season Timeline</p>
          <div className="flex gap-1.5">
            {(['northern', 'southern'] as Hemisphere[]).map(h => (
              <button
                key={h}
                onClick={() => setHemisphereGuarded(h)}
                className="press px-3 py-1.5 rounded-full text-xs font-semibold capitalize flex items-center gap-1"
                style={{
                  background: hemisphere === h ? `rgb(${GLOW})` : 'var(--bg-base)',
                  color: hemisphere === h ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border-hairline)',
                  opacity: !isPro && h === 'southern' ? 0.6 : 1,
                }}
              >
                {h === 'northern' ? '🌍' : '🌏'} {h}{!isPro && h === 'southern' ? ' 🔒' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Season Timeline Strip */}
        <div className="mb-7">
          <div className="relative h-5 mb-1">
            {MONTH_LABELS.map((m, i) => (
              <span key={i} className="absolute text-caption" style={{ left: `${(i / 12) * 100}%` }}>{m}</span>
            ))}
          </div>
          <div ref={stripRef} className="relative" style={{ paddingBottom: 4 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="absolute top-0 bottom-0" style={{ left: `${(i / 12) * 100}%`, width: 1, background: 'var(--border-hairline)', opacity: 0.4 }} />
            ))}
            <div className="absolute top-0 bottom-0 z-20" style={{ left: `${(doy / 365) * 100}%`, width: 2, background: `rgb(${GLOW})`, boxShadow: `0 0 6px rgba(${GLOW}, 0.8)` }} />
            <div className="flex flex-col gap-1.5 relative" style={{ paddingTop: 2 }}>
              {effectiveBasket.map(item => {
                const seasonSegs = bandSegments(item.start, item.end);
                const peakSegs = bandSegments(item.peakStart, item.peakEnd);
                return (
                  <div key={item.id} className="relative h-8">
                    <div className="absolute inset-0 rounded-full" style={{ background: 'var(--border-hairline)' }} />
                    {seasonSegs.map((seg, i) => (
                      <div key={`s${i}`} className="absolute top-0 h-full rounded-full" style={{ left: `${seg.left}%`, width: `${seg.width}%`, background: `rgba(${item.color}, 0.3)` }} />
                    ))}
                    {peakSegs.map((seg, i) => (
                      <div key={`p${i}`} className="absolute top-0 h-full rounded-full" style={{ left: `${seg.left}%`, width: `${seg.width}%`, background: `rgb(${item.color})`, boxShadow: `0 0 8px rgba(${item.color}, 0.6)` }} />
                    ))}
                    <span className="absolute left-1.5 top-1/2 text-[10px] font-bold whitespace-nowrap" style={{ transform: 'translateY(-50%)', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
                      {item.emoji} {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Basket cards with freshness meters */}
        <div className="flex flex-col gap-2 mb-6">
          {sortedBasket.length === 0 && (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Your basket is empty — add produce below to start tracking.</p>
            </div>
          )}
          {sortedBasket.map(({ item, status }) => {
            const c = phaseColor(status.phase, item.color);
            return (
              <div key={item.id} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${item.color})` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-footnote font-bold">{item.name}</span>
                    {item.custom && <span className="pill text-[9px]" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>custom</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-footnote font-bold" style={{ color: `rgb(${c})` }}>{status.label}</span>
                    <button onClick={() => removeProduce(item.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-hairline)' }}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${status.score}%`, background: `rgb(${c})` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Add produce */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-footnote font-semibold">Add produce to your basket</p>
            <button onClick={openCustomForm} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
              {isPro ? '✨' : '🔒'} Add my own
            </button>
          </div>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search produce…"
            className="w-full rounded-xl px-3 py-2 text-footnote bg-transparent outline-none mb-3"
            style={{ border: '1px solid var(--border-hairline)' }}
          />
          <div className="flex flex-wrap gap-2">
            {catalogFiltered.map(item => (
              <button
                key={item.id}
                onClick={() => addProduce(item)}
                className="ios-card-nested press px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5"
                style={{ opacity: basket.length >= maxBasket ? 0.5 : 1 }}
              >
                {item.emoji} {item.name}
              </button>
            ))}
            {catalogFiltered.length === 0 && (
              <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>No matches — try a different search or add your own.</p>
            )}
          </div>
        </div>

        {/* Custom produce form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustom} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ Add my own produce</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption">Name</span>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Backyard Figs" maxLength={30}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Emoji</span>
                <input value={customEmoji} onChange={e => setCustomEmoji(e.target.value)} maxLength={2}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Season starts</span>
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Peak starts</span>
                <input type="date" value={customPeakStart} onChange={e => setCustomPeakStart(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Peak ends</span>
                <input type="date" value={customPeakEnd} onChange={e => setCustomPeakEnd(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Season ends</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add to basket</button>
          </form>
        )}

        {/* Peak Alert banner (Pro) */}
        {peakAlerts.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {peakAlerts.map(({ item, status }) => (
              <div key={item.id} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: `3px solid rgb(${PEAK_HIGHLIGHT})` }}>
                <span className="text-lg flex-shrink-0">🔔</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{item.emoji} {item.name}</strong> {status.phase === 'ramping' ? 'hits peak' : 'season starts'} in <strong>{status.daysToNext}d</strong>.
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end mb-7">
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy shopping list</button>
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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ Basket full" : `🔒 Free plan: ${FREE_MAX_BASKET} items, Northern Hemisphere only`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_BASKET} items, the Southern Hemisphere toggle, adding your own produce, Peak Alerts, and saving your basket.</p>
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

      <ToolCommentSection seedComments={HARVEST_SEASONS_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
