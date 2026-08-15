// FILE: src/components/embeds/ReleaseQueueEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '255, 45, 85';

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  movie: { emoji: '🎬', color: '255, 69, 58' },
  show: { emoji: '📺', color: '0, 122, 255' },
  album: { emoji: '🎵', color: '255, 159, 10' },
};

interface WatchItem { id: string; title: string; typeKey: string; date: string; hype: number; }

function isoInDays(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); d.setHours(20, 0, 0, 0);
  return d.toISOString();
}

const EXAMPLE_ITEMS: WatchItem[] = [
  { id: 'w1', title: 'The Last Signal', typeKey: 'movie', date: isoInDays(18), hype: 65 },
  { id: 'w2', title: 'Crimson Hour', typeKey: 'show', date: isoInDays(5), hype: 80 },
  { id: 'w3', title: 'Midnight Static', typeKey: 'album', date: isoInDays(9), hype: 50 },
];

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
function formatCountdownLabel(dateStr: string): string {
  const days = daysUntil(dateStr);
  if (days <= 0) return '🍿 Today!';
  if (days === 1) return 'Tomorrow';
  return `in ${days}d`;
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

export function ReleaseQueueEmbed() {
  const [items, setItems] = useState<WatchItem[]>(EXAMPLE_ITEMS);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const draggingId = useRef<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleReorderMove = useCallback((clientY: number) => {
    const id = draggingId.current;
    if (!id) return;
    setItems(prev => {
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
    function onMove(e: PointerEvent) { if (draggingId.current) handleReorderMove(e.clientY); }
    function onUp() { draggingId.current = null; setActiveDragId(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handleReorderMove]);

  const nextItem = useMemo(
    () => [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [items]
  );

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>ENTERTAINMENT</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Release Queue</h3>
      {nextItem && (
        <p style={{ fontSize: 12, color: '#8e8e93', margin: '0 0 16px' }}>
          Next up: <span style={{ color: `rgb(${GLOW})` }}>{nextItem.title}</span> — {formatCountdownLabel(nextItem.date)}
        </p>
      )}

      <div>
        {items.map((item, i) => {
          const meta = TYPE_META[item.typeKey] ?? TYPE_META.movie;
          const isDragging = activeDragId === item.id;
          return (
            <div
              key={item.id}
              ref={el => { rowRefs.current[item.id] = el; }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#0a0e14', borderRadius: 12, padding: '10px 12px',
                marginBottom: 8, border: `1px solid rgba(${meta.color}, 0.3)`,
                opacity: isDragging ? 0.6 : 1,
                transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{meta.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: '#8e8e93' }}>{formatCountdownLabel(item.date)} · Hype {item.hype}%</div>
              </div>
              <div
                onPointerDown={() => { draggingId.current = item.id; setActiveDragId(item.id); }}
                style={{
                  cursor: 'grab', touchAction: 'none', color: '#6e6e73',
                  fontSize: 16, padding: '4px 6px', userSelect: 'none',
                }}
              >
                ⠿
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '12px 0 0' }}>
        Example queue shown for preview — drag any item's handle to reorder priority live.
      </p>
    </div>
  );
}
