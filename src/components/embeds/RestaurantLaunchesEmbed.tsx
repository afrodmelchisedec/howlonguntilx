// FILE: src/components/embeds/RestaurantLaunchesEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface Restaurant { id: string; name: string; emoji: string; cuisine: string; city: string; openDateIso: string; color: string; }
interface HypeBurst { id: string; restaurantId: string; amount: number; }

const GLOW = '255, 107, 53';
const HYPE_HORIZON_DAYS = 90;

function daysFromNowIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
}

const RESTAURANTS: Restaurant[] = [
  { id: 'r1', name: 'Ember & Ash', emoji: '🔥', cuisine: 'Steakhouse', city: 'Austin, TX', openDateIso: daysFromNowIso(4), color: '255, 107, 53' },
  { id: 'r2', name: 'Nori Bar', emoji: '🍣', cuisine: 'Japanese', city: 'Seattle, WA', openDateIso: daysFromNowIso(18), color: '100, 200, 255' },
  { id: 'r3', name: 'Casa Verde', emoji: '🌿', cuisine: 'Mexican', city: 'Denver, CO', openDateIso: daysFromNowIso(35), color: '88, 214, 113' },
  { id: 'r4', name: 'The Copper Fork', emoji: '🍴', cuisine: 'American', city: 'Nashville, TN', openDateIso: daysFromNowIso(60), color: '196, 132, 252' },
];

function getCountdown(iso: string, nowMs: number) {
  const target = new Date(iso).getTime();
  const diffMs = target - nowMs;
  const isOpen = diffMs <= 0;
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const daysUntil = diffMs / 86400000;
  const ringPercent = isOpen ? 100 : Math.max(0, Math.min(100, 100 - (daysUntil / HYPE_HORIZON_DAYS) * 100));
  return { isOpen, days, hours, ringPercent };
}

function RestaurantRing({ percent, color, size = 48 }: { percent: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#3a3a40" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`rgb(${color})`} strokeWidth={4}
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
      />
    </svg>
  );
}

export function RestaurantLaunchesEmbed() {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNowMs(Date.now()), 1000); return () => clearInterval(t); }, []);

  const [order, setOrder] = useState<string[]>(RESTAURANTS.map(r => r.id));
  const [hypeScores, setHypeScores] = useState<Record<string, number>>({ r1: 62, r2: 40, r3: 28, r4: 15 });
  const [hypeBursts, setHypeBursts] = useState<HypeBurst[]>([]);

  const draggingId = useRef<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  function getRestaurant(id: string) { return RESTAURANTS.find(r => r.id === id)!; }

  function handleHype(id: string) {
    const amount = 2 + Math.floor(Math.random() * 4);
    setHypeScores(prev => ({ ...prev, [id]: Math.min(100, (prev[id] ?? 0) + amount) }));
    const burstId = `${id}-${Date.now()}`;
    setHypeBursts(prev => [...prev, { id: burstId, restaurantId: id, amount }]);
    setTimeout(() => setHypeBursts(prev => prev.filter(b => b.id !== burstId)), 700);
  }

  const handleReorderPointerMove = useCallback((clientY: number) => {
    if (!draggingId.current) return;
    const idx = order.indexOf(draggingId.current);
    if (idx === -1) return;
    for (const [id, el] of itemRefs.current) {
      if (id === draggingId.current) continue;
      const rect = el.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const otherIdx = order.indexOf(id);
      if (otherIdx === -1) continue;
      if ((clientY < mid && otherIdx < idx) || (clientY > mid && otherIdx > idx)) {
        setOrder(prev => {
          const next = [...prev];
          const from = next.indexOf(draggingId.current!);
          const [item] = next.splice(from, 1);
          next.splice(otherIdx, 0, item);
          return next;
        });
        break;
      }
    }
  }, [order]);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (activeDragId) handleReorderPointerMove(e.clientY); }
    function onUp() { draggingId.current = null; setActiveDragId(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [activeDragId, handleReorderPointerMove]);

  function startReorderDrag(id: string) {
    draggingId.current = id;
    setActiveDragId(id);
  }

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>GRAND OPENING TRACKER</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Your watchlist</p>
      <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 14 }}>Drag ⠿ to reorder · tap 🔥 to hype</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {order.map(id => {
          const r = getRestaurant(id);
          const cd = getCountdown(r.openDateIso, nowMs);
          const hype = hypeScores[id] ?? 0;
          const burst = hypeBursts.find(b => b.restaurantId === id);
          return (
            <div
              key={id}
              ref={el => { if (el) itemRefs.current.set(id, el); else itemRefs.current.delete(id); }}
              style={{
                position: 'relative', display: 'flex', alignItems: 'center', gap: 10,
                background: '#2a2a30', borderRadius: 10, padding: '10px 10px',
                opacity: activeDragId === id ? 0.5 : 1,
                border: activeDragId === id ? `1px dashed rgb(${GLOW})` : '1px solid transparent',
              }}
            >
              <div
                onPointerDown={() => startReorderDrag(id)}
                style={{ cursor: 'grab', touchAction: 'none', fontSize: 14, opacity: 0.5, padding: '0 2px' }}
              >⠿</div>

              <RestaurantRing percent={cd.ringPercent} color={r.color} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700 }}>{r.emoji} {r.name}</div>
                <div style={{ fontSize: 10.5, opacity: 0.6 }}>{r.city} · {r.cuisine}</div>
                <div style={{ fontSize: 10.5, marginTop: 2, color: `rgb(${r.color})`, fontWeight: 700 }}>
                  {cd.isOpen ? '🎉 Now open!' : `${cd.days}d ${cd.hours}h`}
                </div>
              </div>

              <button
                onClick={() => handleHype(id)}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', cursor: 'pointer', color: `rgb(${GLOW})`, padding: 4 }}
              >
                <span style={{ fontSize: 15 }}>🔥</span>
                <span style={{ fontSize: 10, fontWeight: 700 }}>{hype}</span>
                {burst && (
                  <span style={{ position: 'absolute', top: -10, fontSize: 11, fontWeight: 700, color: `rgb(${GLOW})`, animation: 'none', opacity: 0.9 }}>
                    +{burst.amount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Example restaurants shown for preview — drag to reorder your watchlist, tap the flame to hype one up.
      </p>
    </div>
  );
}
