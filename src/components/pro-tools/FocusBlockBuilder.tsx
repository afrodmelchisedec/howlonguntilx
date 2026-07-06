// FILE: src/components/pro-tools/FocusBlockBuilder.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { FOCUS_BLOCK_COMMENTS } from './focusBlockComments';

interface Category {
  key: string;
  name: string;
  emoji: string;
  color: string;
}
interface Block {
  id: string;
  name: string;
  categoryKey: string;
  start: number;    // minutes from midnight
  duration: number; // minutes
}

const GLOW = '138, 124, 255';
const DAY_MINUTES = 1440;
const MIN_DURATION = 15;
const MAX_BLOCKS = 10;
const FREE_MAX_BLOCKS = 4;
const FREE_SNAP_MINUTES = 15;
const PRO_SNAP_MINUTES = 5;

const CATEGORIES: Category[] = [
  { key: 'work',     name: 'Work',     emoji: '💼', color: '100, 200, 255' },
  { key: 'health',   name: 'Health',   emoji: '🏋️', color: '88, 214, 113' },
  { key: 'personal', name: 'Personal', emoji: '🎨', color: '196, 132, 252' },
  { key: 'break',    name: 'Break',    emoji: '☕', color: '255, 159, 10' },
  { key: 'sleep',    name: 'Sleep',    emoji: '😴', color: '120, 140, 200' },
  { key: 'social',   name: 'Social',   emoji: '🎉', color: '255, 122, 165' },
];
function categoryOf(key: string): Category {
  return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[0];
}
function nextCategoryKey(key: string): string {
  const idx = CATEGORIES.findIndex(c => c.key === key);
  return CATEGORIES[(idx + 1) % CATEGORIES.length].key;
}

const BLOCK_TEMPLATES: { name: string; categoryKey: string; duration: number; preferredStart: number }[] = [
  { name: 'Deep Work',   categoryKey: 'work',     duration: 120, preferredStart: 540 },
  { name: 'Gym',         categoryKey: 'health',   duration: 60,  preferredStart: 420 },
  { name: 'Lunch',       categoryKey: 'break',    duration: 45,  preferredStart: 750 },
  { name: 'Family Time', categoryKey: 'personal', duration: 90,  preferredStart: 1080 },
  { name: 'Sleep',       categoryKey: 'sleep',    duration: 480, preferredStart: 1350 },
  { name: 'Meetings',    categoryKey: 'work',     duration: 90,  preferredStart: 780 },
  { name: 'Social',      categoryKey: 'social',   duration: 90,  preferredStart: 1170 },
];

const DEFAULT_BLOCKS: Block[] = [
  { id: 'block-deep-work', name: 'Deep Work',   categoryKey: 'work',     start: 540,  duration: 120 },
  { id: 'block-gym',       name: 'Gym',         categoryKey: 'health',   start: 420,  duration: 60 },
  { id: 'block-lunch',     name: 'Lunch',       categoryKey: 'break',    start: 750,  duration: 45 },
  { id: 'block-family',    name: 'Family Time', categoryKey: 'personal', start: 1080, duration: 90 },
];

function formatTime(minutes: number): string {
  const m = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function overlapMinutes(a: Block, b: Block): number {
  return Math.max(0, Math.min(a.start + a.duration, b.start + b.duration) - Math.max(a.start, b.start));
}
function findFreeSlot(duration: number, existing: Block[], preferredStart: number): number {
  const fits = (start: number) => !existing.some(b => overlapMinutes({ id: '', name: '', categoryKey: '', start, duration }, b) > 0);
  if (preferredStart + duration <= DAY_MINUTES && fits(preferredStart)) return preferredStart;
  for (let start = 0; start <= DAY_MINUTES - duration; start += 15) {
    if (fits(start)) return start;
  }
  return -1;
}
function minutesFromTimeStr(str: string): number {
  const [h, m] = str.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 540;
  return h * 60 + m;
}
function timeStrFromMinutes(minutes: number): string {
  const m = Math.max(0, Math.min(1439, Math.round(minutes)));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

export function FocusBlockBuilder() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxBlocks = isPro ? MAX_BLOCKS : FREE_MAX_BLOCKS;
  const snapMinutes = isPro ? PRO_SNAP_MINUTES : FREE_SNAP_MINUTES;

  const [blocks, setBlocks] = useState<Block[]>(DEFAULT_BLOCKS);
  const [pulse, setPulse] = useState(false);
  const [now, setNow] = useState<number | null>(null);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState(CATEGORIES[0].key);
  const [customStartStr, setCustomStartStr] = useState('09:00');
  const [customDurationStr, setCustomDurationStr] = useState('60');

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(29);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; mode: 'move' | 'resize'; grabOffset: number } | null>(null);

  useEffect(() => {
    function tick() {
      const d = new Date();
      setNow(d.getHours() * 60 + d.getMinutes());
    }
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/focus-block-builder')
      .then(r => r.json())
      .then(data => {
        if (data.config && Array.isArray(data.config.blocks) && data.config.blocks.length > 0) {
          setBlocks(data.config.blocks.slice(0, MAX_BLOCKS));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const totalAllocated = useMemo(() => blocks.reduce((a, b) => a + b.duration, 0), [blocks]);
  const overcommitted = totalAllocated > DAY_MINUTES;
  const freeTime = Math.max(0, DAY_MINUTES - totalAllocated);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [totalAllocated]);

  const overlaps = useMemo(() => {
    const pairs: { a: Block; b: Block; minutes: number }[] = [];
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        const m = overlapMinutes(blocks[i], blocks[j]);
        if (m > 0) pairs.push({ a: blocks[i], b: blocks[j], minutes: m });
      }
    }
    return pairs;
  }, [blocks]);

  const densityPoints = useMemo(() => {
    const points: number[] = [];
    for (let t = 0; t <= DAY_MINUTES; t += 15) {
      points.push(blocks.filter(b => t >= b.start && t < b.start + b.duration).length);
    }
    return points;
  }, [blocks]);
  const busiestIndex = densityPoints.indexOf(Math.max(...densityPoints));
  const busiestCount = densityPoints[busiestIndex] ?? 0;

  const totalsByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const cat of CATEGORIES) totals[cat.key] = 0;
    for (const b of blocks) totals[b.categoryKey] = (totals[b.categoryKey] ?? 0) + b.duration;
    return totals;
  }, [blocks]);
  const scaleMax = Math.max(120, ...Object.values(totalsByCategory));

  const health: 'clear' | 'full' | 'over' =
    overcommitted ? 'over' : totalAllocated > DAY_MINUTES * 0.75 ? 'full' : 'clear';
  const healthLabel = {
    clear: '✅ Comfortable day',
    full: '⚠️ Fully booked',
    over: `🚨 Overcommitted by ${formatDuration(totalAllocated - DAY_MINUTES)}`,
  }[health];
  const healthColor = { clear: '52, 199, 89', full: '255, 159, 10', over: '255, 69, 58' }[health];

  const longestBlock = useMemo(
    () => blocks.length ? [...blocks].sort((a, b) => b.duration - a.duration)[0] : null,
    [blocks]
  );

  const atFreeLimit = !isPro && blocks.length >= FREE_MAX_BLOCKS;

  // ---- timeline drag ----
  function minuteAtClientX(clientX: number): number {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = ratio * DAY_MINUTES;
    return Math.round(raw / snapMinutes) * snapMinutes;
  }

  function startMove(id: string, clientX: number) {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    dragState.current = { id, mode: 'move', grabOffset: minuteAtClientX(clientX) - block.start };
  }
  function startResize(id: string) {
    dragState.current = { id, mode: 'resize', grabOffset: 0 };
  }

  const handlePointerMove = useCallback((clientX: number) => {
    const drag = dragState.current;
    if (!drag) return;
    const minute = minuteAtClientX(clientX);
    setBlocks(prev => prev.map(b => {
      if (b.id !== drag.id) return b;
      if (drag.mode === 'move') {
        const newStart = Math.max(0, Math.min(minute - drag.grabOffset, DAY_MINUTES - b.duration));
        return { ...b, start: newStart };
      } else {
        const newDuration = Math.max(MIN_DURATION, Math.min(minute - b.start, DAY_MINUTES - b.start));
        return { ...b, duration: newDuration };
      }
    }));
  }, [snapMinutes]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX); }
    function onUp() { dragState.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  function addBlock() {
    if (!isPro && blocks.length >= FREE_MAX_BLOCKS) { showToast('Upgrade to Pro to add more blocks', '⭐'); return; }
    if (blocks.length >= maxBlocks) { showToast(`You can have up to ${maxBlocks} blocks`, '⚠️'); return; }
    const usedNames = new Set(blocks.map(b => b.name));
    const template = BLOCK_TEMPLATES.find(t => !usedNames.has(t.name)) ?? {
      name: `Block ${blocks.length + 1}`, categoryKey: 'work', duration: 60, preferredStart: 600,
    };
    const slot = findFreeSlot(template.duration, blocks, template.preferredStart);
    if (slot === -1) {
      showToast('No free slot — placed at 12:00 AM, drag it to fit', '⚠️');
    }
    setBlocks(prev => [...prev, {
      id: `block-${Date.now()}`,
      name: template.name,
      categoryKey: template.categoryKey,
      start: slot === -1 ? 0 : slot,
      duration: template.duration,
    }]);
  }

  function openCustomForm() {
    if (!isPro) { showToast('Upgrade to Pro to add a custom block', '⭐'); return; }
    if (blocks.length >= MAX_BLOCKS) { showToast(`You can have up to ${MAX_BLOCKS} blocks`, '⚠️'); return; }
    setCustomName('');
    setCustomCategory(CATEGORIES[0].key);
    setCustomStartStr(timeStrFromMinutes(findFreeSlot(60, blocks, 600) === -1 ? 600 : findFreeSlot(60, blocks, 600)));
    setCustomDurationStr('60');
    setShowCustomForm(true);
  }

  function handleAddCustomBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!isPro) return;
    if (blocks.length >= MAX_BLOCKS) { showToast(`You can have up to ${MAX_BLOCKS} blocks`, '⚠️'); return; }
    const name = customName.trim() || 'Custom Block';
    const rawDuration = Math.max(MIN_DURATION, Math.round(Number(customDurationStr) || 60));
    const duration = Math.min(rawDuration, DAY_MINUTES);
    const rawStart = minutesFromTimeStr(customStartStr);
    const snappedStart = Math.round(rawStart / snapMinutes) * snapMinutes;
    const start = Math.max(0, Math.min(snappedStart, DAY_MINUTES - duration));
    setBlocks(prev => [...prev, {
      id: `block-${Date.now()}`,
      name,
      categoryKey: customCategory,
      start,
      duration,
    }]);
    setShowCustomForm(false);
    showToast('Custom block added', '✨');
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }
  function renameBlock(id: string, name: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, name } : b));
  }
  function cycleCategory(id: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, categoryKey: nextCategoryKey(b.categoryKey) } : b));
  }
  function nudgeDuration(id: string, delta: number) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newDuration = Math.max(MIN_DURATION, Math.min(b.duration + delta, DAY_MINUTES - b.start));
      return { ...b, duration: newDuration };
    }));
  }
  function nudgeStart(id: string, delta: number) {
    setBlocks(prev => prev.map(b => {
      if (b.id !== id) return b;
      const newStart = Math.max(0, Math.min(b.start + delta, DAY_MINUTES - b.duration));
      return { ...b, start: newStart };
    }));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/focus-block-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
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
    setBlocks(DEFAULT_BLOCKS);
    setShowCustomForm(false);
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

  function handleCopyPlan() {
    const sorted = [...blocks].sort((a, b) => a.start - b.start);
    const lines = [
      `Allocated: ${formatDuration(totalAllocated)} of 24h  ·  Free: ${formatDuration(freeTime)}`,
      ...sorted.map(b => `- ${categoryOf(b.categoryKey).emoji} ${b.name}: ${formatTime(b.start)}–${formatTime(b.start + b.duration)} (${formatDuration(b.duration)})`),
    ];
    if (overlaps.length > 0) {
      lines.push('Overlaps:');
      overlaps.forEach(o => lines.push(`- ${o.a.name} & ${o.b.name} overlap for ${formatDuration(o.minutes)}`));
    }
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Plan copied!', '📋'))
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
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>FOCUS BLOCK BUILDER</p>
            <h2 className="text-title2">Day Timeline</h2>
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
              title={isPro ? 'Save this day to your account' : 'Upgrade to save your setup'}
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
            { label: 'Hours allocated', value: formatDuration(totalAllocated) },
            { label: 'Free time left', value: overcommitted ? '0m' : formatDuration(freeTime) },
            { label: 'Blocks', value: String(blocks.length) },
            { label: 'Longest block', value: longestBlock ? formatDuration(longestBlock.duration) : '—' },
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

        {/* Overcommitted capacity bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-footnote font-semibold">Day capacity</p>
            <p className="text-caption tabular">{formatDuration(totalAllocated)} / 24h</p>
          </div>
          <div className="h-4 rounded-full overflow-hidden relative" style={{ background: 'var(--border-hairline)' }}>
            <div
              className="h-full rounded-full transition-all duration-300 flex items-center justify-center"
              style={{
                width: `${Math.min(100, (totalAllocated / DAY_MINUTES) * 100)}%`,
                background: overcommitted ? 'rgb(255, 69, 58)' : `rgb(${GLOW})`,
                boxShadow: overcommitted ? '0 0 12px rgba(255, 69, 58, 0.6)' : `0 0 10px rgba(${GLOW}, 0.5)`,
              }}
            >
              {overcommitted && <span className="text-[9px] font-bold text-white whitespace-nowrap">OVERCOMMITTED</span>}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag blocks to move · drag the right edge to resize</p>
            <p className="text-caption">{isPro ? `${PRO_SNAP_MINUTES}-min snap` : `${FREE_SNAP_MINUTES}-min snap`}</p>
          </div>
          <div ref={timelineRef} className="relative w-full rounded-2xl select-none" style={{ height: 64, background: 'var(--border-hairline)', touchAction: 'none' }}>
            {[0, 3, 6, 9, 12, 15, 18, 21, 24].map(h => (
              <div key={h} className="absolute top-0 h-full" style={{ left: `${(h / 24) * 100}%`, width: 1, background: 'var(--bg-base)', opacity: 0.5 }} />
            ))}
            {now !== null && (
              <div className="absolute top-0 h-full z-20 flex flex-col items-center" style={{ left: `${(now / DAY_MINUTES) * 100}%` }}>
                <div className="h-full" style={{ width: 2, background: `rgb(${GLOW})`, boxShadow: `0 0 6px rgba(${GLOW}, 0.8)` }} />
              </div>
            )}
            {blocks.map(b => {
              const cat = categoryOf(b.categoryKey);
              return (
                <div
                  key={b.id}
                  onPointerDown={e => startMove(b.id, e.clientX)}
                  className="absolute top-1 bottom-1 rounded-xl flex items-center px-2 overflow-hidden cursor-grab"
                  style={{
                    left: `${(b.start / DAY_MINUTES) * 100}%`,
                    width: `${(b.duration / DAY_MINUTES) * 100}%`,
                    background: `rgba(${cat.color}, 0.35)`,
                    border: `1.5px solid rgb(${cat.color})`,
                    touchAction: 'none',
                    zIndex: 10,
                  }}
                  title={`${b.name}: ${formatTime(b.start)}–${formatTime(b.start + b.duration)}`}
                >
                  <span className="text-[10px] font-bold whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: `rgb(${cat.color})` }}>
                    {cat.emoji} {b.name}
                  </span>
                  <div
                    onPointerDown={e => { e.stopPropagation(); startResize(b.id); }}
                    className="absolute top-0 right-0 h-full w-3 cursor-ew-resize flex items-center justify-center"
                    style={{ touchAction: 'none' }}
                  >
                    <div className="w-0.5 h-5 rounded-full" style={{ background: `rgb(${cat.color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-caption">12 AM</span>
            <span className="text-caption">12 PM</span>
            <span className="text-caption">12 AM</span>
          </div>
        </div>

        {/* Overlap density strip */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-footnote font-semibold">Overlap density</p>
            <p className="text-caption">busiest: {formatTime(busiestIndex * 15)} · ×{busiestCount}</p>
          </div>
          <svg viewBox="0 0 400 28" width="100%" height="28" preserveAspectRatio="none">
            {densityPoints.map((count, i) => {
              if (i === densityPoints.length - 1) return null;
              const x = (i / (densityPoints.length - 1)) * 400;
              const w = 400 / (densityPoints.length - 1) + 0.5;
              const color = count >= 3 ? '255, 69, 58' : count === 2 ? '255, 159, 10' : count === 1 ? GLOW : null;
              if (!color) return null;
              return <rect key={i} x={x} y={0} width={w} height={28} fill={`rgba(${color}, ${count === 1 ? 0.25 : 0.6})`} />;
            })}
          </svg>
        </div>

        {/* Overlap warnings */}
        {overlaps.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {overlaps.map((o, i) => (
              <div key={i} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">⏱️</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  <strong>{o.a.name}</strong> and <strong>{o.b.name}</strong> overlap for <strong>{formatDuration(o.minutes)}</strong>.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Category bar chart */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-3">Hours by category</p>
          <div className="flex items-end gap-3 justify-between" style={{ height: 140 }}>
            {CATEGORIES.map(cat => {
              const minutes = totalsByCategory[cat.key] ?? 0;
              const pct = Math.min(100, (minutes / scaleMax) * 100);
              return (
                <div key={cat.key} className="flex-1 flex flex-col items-center justify-end gap-1.5" style={{ height: '100%' }}>
                  <span className="text-caption font-bold tabular" style={{ color: `rgb(${cat.color})` }}>
                    {minutes > 0 ? formatDuration(minutes) : '—'}
                  </span>
                  <div
                    className="w-full rounded-t-lg transition-all duration-500 ease-out"
                    style={{
                      height: `${pct}%`,
                      minHeight: minutes > 0 ? 6 : 0,
                      background: `rgb(${cat.color})`,
                      boxShadow: minutes > 0 ? `0 0 10px rgba(${cat.color}, 0.4)` : 'none',
                    }}
                  />
                  <span className="text-lg">{cat.emoji}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Block cards */}
        <div className="flex flex-col gap-2 mb-4">
          {blocks.length === 0 && (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Your day is wide open — add a block to get started.</p>
            </div>
          )}
          {[...blocks].sort((a, b) => a.start - b.start).map(b => {
            const cat = categoryOf(b.categoryKey);
            return (
              <div key={b.id} className="ios-card-nested p-3 flex flex-col gap-2" style={{ borderLeft: `3px solid rgb(${cat.color})` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => cycleCategory(b.id)} className="text-lg press" title="Click to change category">{cat.emoji}</button>
                    <EditableBlockName value={b.name} onCommit={v => renameBlock(b.id, v)} colorRgb={cat.color} />
                    <span className="pill text-[10px]" style={{ background: `rgba(${cat.color}, 0.15)`, color: `rgb(${cat.color})` }}>{cat.name}</span>
                  </div>
                  <button onClick={() => removeBlock(b.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                </div>
                <div className="flex items-center justify-between flex-wrap gap-3 text-footnote">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-secondary)' }}>Start</span>
                    <button onClick={() => nudgeStart(b.id, -snapMinutes)} className="ios-card-nested press w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">−</button>
                    <span className="font-bold tabular" style={{ color: `rgb(${cat.color})` }}>{formatTime(b.start)}</span>
                    <button onClick={() => nudgeStart(b.id, snapMinutes)} className="ios-card-nested press w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">+</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                    <button onClick={() => nudgeDuration(b.id, -snapMinutes)} className="ios-card-nested press w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">−</button>
                    <span className="font-bold tabular" style={{ color: `rgb(${cat.color})` }}>{formatDuration(b.duration)}</span>
                    <button onClick={() => nudgeDuration(b.id, snapMinutes)} className="ios-card-nested press w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={addBlock}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro || blocks.length < FREE_MAX_BLOCKS ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: blocks.length >= maxBlocks ? 0.5 : 1 }}
            >
              {isPro || blocks.length < FREE_MAX_BLOCKS ? '+' : '🔒'} Add block
            </button>
            <button
              onClick={openCustomForm}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: isPro && blocks.length >= MAX_BLOCKS ? 0.5 : 1 }}
              title={isPro ? 'Create a fully custom block' : 'Upgrade to Pro to add a custom block'}
            >
              {isPro ? '✨' : '🔒'} Custom block
            </button>
          </div>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
            📋 Copy plan
          </button>
        </div>

        {/* Custom block form (Pro only) */}
        {showCustomForm && isPro && (
          <form onSubmit={handleAddCustomBlock} className="ios-card-nested p-4 mb-6 flex flex-col gap-3 anim-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-footnote font-semibold">✨ New custom block</p>
              <button type="button" onClick={() => setShowCustomForm(false)} className="press text-caption" style={{ color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-caption">Name</span>
                <input
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  placeholder="e.g. Therapy"
                  maxLength={30}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none"
                  style={{ border: '1px solid var(--border-hairline)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Category</span>
                <select
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none"
                  style={{ border: '1px solid var(--border-hairline)' }}
                >
                  {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.emoji} {c.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Start time</span>
                <input
                  type="time"
                  value={customStartStr}
                  onChange={e => setCustomStartStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular"
                  style={{ border: '1px solid var(--border-hairline)' }}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-caption">Duration (minutes)</span>
                <input
                  type="number"
                  min={MIN_DURATION}
                  step={snapMinutes}
                  value={customDurationStr}
                  onChange={e => setCustomDurationStr(e.target.value)}
                  className="rounded-xl px-3 py-2 text-footnote bg-transparent outline-none tabular"
                  style={{ border: '1px solid var(--border-hairline)' }}
                />
              </label>
            </div>
            <button type="submit" className="btn-filled press text-sm">Add block</button>
          </form>
        )}

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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : '🔒 Free plan: 4 blocks, 15-min snap'}</p>
              <p className="text-caption">Upgrade to Premium for up to {MAX_BLOCKS} blocks, {PRO_SNAP_MINUTES}-minute drag precision, fully custom-named blocks, and saving your day.</p>
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
      <ToolCommentSection seedComments={FOCUS_BLOCK_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}

// ---- inline editable block name ----
function EditableBlockName({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
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
