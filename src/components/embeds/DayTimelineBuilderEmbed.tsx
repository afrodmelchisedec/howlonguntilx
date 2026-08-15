// FILE: src/components/embeds/DayTimelineBuilderEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '138, 124, 255';
const DAY_MINUTES = 1440;
const MIN_DURATION = 15;
const SNAP_MINUTES = 15;

interface Category { key: string; name: string; emoji: string; color: string; }
interface Block { id: string; name: string; categoryKey: string; start: number; duration: number; }

const CATEGORIES: Category[] = [
  { key: 'work', name: 'Work', emoji: '💼', color: '100, 200, 255' },
  { key: 'health', name: 'Health', emoji: '🏋️', color: '88, 214, 113' },
  { key: 'personal', name: 'Personal', emoji: '🎨', color: '196, 132, 252' },
  { key: 'break', name: 'Break', emoji: '☕', color: '255, 159, 10' },
];
function categoryOf(key: string): Category { return CATEGORIES.find(c => c.key === key) ?? CATEGORIES[0]; }

const EXAMPLE_BLOCKS: Block[] = [
  { id: 'b1', name: 'Deep Work', categoryKey: 'work', start: 540, duration: 120 },
  { id: 'b2', name: 'Gym', categoryKey: 'health', start: 420, duration: 60 },
  { id: 'b3', name: 'Lunch', categoryKey: 'break', start: 750, duration: 45 },
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

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f7',
};

export function DayTimelineBuilderEmbed() {
  const [blocks, setBlocks] = useState<Block[]>(EXAMPLE_BLOCKS);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ id: string; mode: 'move' | 'resize'; grabOffset: number } | null>(null);

  function minuteAtClientX(clientX: number): number {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const raw = ratio * DAY_MINUTES;
    return Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES;
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
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX); }
    function onUp() { dragState.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handlePointerMove]);

  const totalAllocated = useMemo(() => blocks.reduce((a, b) => a + b.duration, 0), [blocks]);
  const overcommitted = totalAllocated > DAY_MINUTES;

  const sortedBlocks = useMemo(() => [...blocks].sort((a, b) => a.start - b.start), [blocks]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>FOCUS BLOCK BUILDER</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Day Timeline Builder</h3>
      <p style={{ fontSize: 12, color: '#8e8e93', margin: '0 0 16px' }}>
        {Math.round(totalAllocated / 60 * 10) / 10}h allocated of 24h
      </p>

      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', marginBottom: 18, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, transition: 'width 0.2s',
          width: `${Math.min(100, (totalAllocated / DAY_MINUTES) * 100)}%`,
          background: overcommitted ? 'rgb(255, 69, 58)' : `rgb(${GLOW})`,
        }} />
      </div>

      <div style={{ marginBottom: 4, fontSize: 12, color: '#d1d1d6' }}>Drag blocks to move · drag right edge to resize</div>
      <div ref={timelineRef} style={{ position: 'relative', width: '100%', height: 64, borderRadius: 16, background: 'rgba(255,255,255,0.06)', touchAction: 'none', userSelect: 'none' }}>
        {[0, 6, 12, 18, 24].map(h => (
          <div key={h} style={{ position: 'absolute', top: 0, height: '100%', left: `${(h / 24) * 100}%`, width: 1, background: '#1a1a1e', opacity: 0.6 }} />
        ))}
        {blocks.map(b => {
          const cat = categoryOf(b.categoryKey);
          return (
            <div
              key={b.id}
              onPointerDown={e => startMove(b.id, e.clientX)}
              style={{
                position: 'absolute', top: 4, bottom: 4, borderRadius: 12,
                display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden', cursor: 'grab',
                left: `${(b.start / DAY_MINUTES) * 100}%`,
                width: `${(b.duration / DAY_MINUTES) * 100}%`,
                background: `rgba(${cat.color}, 0.35)`,
                border: `1.5px solid rgb(${cat.color})`,
                touchAction: 'none',
              }}
              title={`${b.name}: ${formatTime(b.start)}–${formatTime(b.start + b.duration)}`}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: `rgb(${cat.color})`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {cat.emoji} {b.name}
              </span>
              <div
                onPointerDown={e => { e.stopPropagation(); startResize(b.id); }}
                style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: 12, cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
              >
                <div style={{ width: 2, height: 20, borderRadius: 999, background: `rgb(${cat.color})` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#8e8e93' }}>
        <span>12 AM</span>
        <span>12 PM</span>
        <span>12 AM</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 14 }}>
        {sortedBlocks.map(b => (
          <div key={b.id} style={{ fontSize: 12, color: '#d1d1d6', display: 'flex', justifyContent: 'space-between' }}>
            <span>{categoryOf(b.categoryKey).emoji} {b.name}</span>
            <span style={{ color: '#8e8e93' }}>{formatTime(b.start)}–{formatTime(b.start + b.duration)}</span>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '16px 0 0' }}>
        Example blocks shown for preview — drag a block to move it, or its right edge to resize, and watch allocation update live.
      </p>
    </div>
  );
}
