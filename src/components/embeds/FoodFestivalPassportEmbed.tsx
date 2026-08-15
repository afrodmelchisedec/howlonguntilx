// FILE: src/components/embeds/FoodFestivalPassportEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface Festival { id: string; name: string; emoji: string; cuisine: string; location: string; date: string; ticketPrice: number; foodBudget: number; }
interface Template { name: string; emoji: string; cuisine: string; location: string; daysFromNow: number; ticketPrice: number; foodBudget: number; }

const GLOW = '255, 90, 54';
const SWIPE_THRESHOLD = 90;

const FESTIVAL_TEMPLATES: Template[] = [
  { name: 'Taste of Chicago', emoji: '🌭', cuisine: 'American', location: 'Chicago, IL', daysFromNow: 21, ticketPrice: 0, foodBudget: 60 },
  { name: 'Oktoberfest', emoji: '🍺', cuisine: 'German', location: 'Munich', daysFromNow: 55, ticketPrice: 25, foodBudget: 120 },
  { name: 'Night Market', emoji: '🏮', cuisine: 'Asian Street Food', location: 'Bangkok', daysFromNow: 12, ticketPrice: 0, foodBudget: 35 },
  { name: 'Chili Cook-Off', emoji: '🌶️', cuisine: 'Tex-Mex', location: 'Austin, TX', daysFromNow: 34, ticketPrice: 10, foodBudget: 45 },
  { name: 'Ramen Festival', emoji: '🍜', cuisine: 'Japanese', location: 'Tokyo', daysFromNow: 9, ticketPrice: 0, foodBudget: 50 },
];

function formatMoney(n: number): string { return `$${Math.round(n).toLocaleString('en-US')}`; }
function daysUntil(dateStr: string): number { return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000); }
function computeDateFromOffset(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(10, 0, 0, 0);
  return d.toISOString();
}

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
    <div style={{ position: 'relative', display: 'flex', borderRadius: 14, overflow: 'hidden', border: `1.5px solid rgba(${GLOW}, 0.4)`, boxShadow: `0 0 24px rgba(${GLOW}, 0.15)`, marginBottom: 16 }}>
      <div style={{ flex: 1, padding: 14, background: `rgba(${GLOW}, 0.08)` }}>
        <p style={{ fontSize: 10, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 3, fontWeight: 700 }}>NEXT FESTIVAL</p>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{festival.emoji} {festival.name}</p>
        <p style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>{festival.location} · {festival.cuisine}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{d}</span>
          <span style={{ fontSize: 11, opacity: 0.7, marginBottom: 3 }}>day{d === 1 ? '' : 's'}</span>
          <span style={{ fontSize: 11, opacity: 0.6, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </span>
        </div>
      </div>
      <div style={{ width: 48, background: `rgba(${GLOW}, 0.14)`, borderLeft: '2px dashed rgba(150,150,150,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, writingMode: 'vertical-rl', color: `rgb(${GLOW})`, letterSpacing: '0.15em' }}>ADMIT ONE</span>
      </div>
    </div>
  );
}

export function FoodFestivalPassportEmbed() {
  const [passport, setPassport] = useState<Festival[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [dragX, setDragX] = useState(0);
  const dragging = useRef(false);
  const startX = useRef(0);
  const dragXRef = useRef(0);

  const deckPool = useMemo(
    () => FESTIVAL_TEMPLATES.filter(t => !skipped.has(t.name) && !passport.some(f => f.name === t.name)),
    [skipped, passport]
  );
  const topCard = deckPool[0] ?? null;
  const nextUpCard = deckPool[1] ?? null;

  const nextFestival = useMemo(
    () => [...passport].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null,
    [passport]
  );
  const totalCommitted = passport.reduce((a, f) => a + f.ticketPrice + f.foodBudget, 0);

  function handleCardPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    startX.current = e.clientX;
  }
  const commitSwipe = useCallback((dir: 'left' | 'right') => {
    const card = deckPool[0];
    if (!card) return;
    if (dir === 'right') {
      setPassport(prev => [...prev, {
        id: `fest-${Date.now()}`, name: card.name, emoji: card.emoji, cuisine: card.cuisine,
        location: card.location, date: computeDateFromOffset(card.daysFromNow),
        ticketPrice: card.ticketPrice, foodBudget: card.foodBudget,
      }]);
    } else {
      setSkipped(prev => new Set(prev).add(card.name));
    }
    setDragX(0); dragXRef.current = 0;
  }, [deckPool]);

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

  const rotation = Math.max(-12, Math.min(12, dragX / 8));
  const swipeOpacity = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>FESTIVAL PASSPORT</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Swipe to discover food festivals</p>

      {nextFestival && <TicketStub festival={nextFestival} />}

      <div style={{ position: 'relative', height: 190, marginBottom: 14 }}>
        {topCard ? (
          <>
            {nextUpCard && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#2a2a30', transform: 'scale(0.95) translateY(6px)', opacity: 0.6 }} />
            )}
            <div
              onPointerDown={handleCardPointerDown}
              style={{
                position: 'absolute', inset: 0, borderRadius: 14, background: '#2a2a30',
                border: `1.5px solid rgba(${GLOW}, 0.3)`, padding: 18,
                transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
                cursor: 'grab', touchAction: 'none', userSelect: 'none',
                transition: dragging.current ? 'none' : 'transform 0.25s ease',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}
            >
              {dragX !== 0 && (
                <div style={{
                  position: 'absolute', top: 14, [dragX > 0 ? 'left' : 'right']: 14,
                  fontSize: 12, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  border: `2px solid ${dragX > 0 ? '#34c759' : '#ff453a'}`, color: dragX > 0 ? '#34c759' : '#ff453a',
                  opacity: swipeOpacity, transform: `rotate(${dragX > 0 ? -8 : 8}deg)`,
                }}>
                  {dragX > 0 ? 'ADD' : 'SKIP'}
                </div>
              )}
              <div>
                <p style={{ fontSize: 34, marginBottom: 6 }}>{topCard.emoji}</p>
                <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{topCard.name}</p>
                <p style={{ fontSize: 12, opacity: 0.6 }}>{topCard.location} · {topCard.cuisine}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                <span style={{ opacity: 0.7 }}>In {topCard.daysFromNow}d</span>
                <span style={{ color: `rgb(${GLOW})`, fontWeight: 700 }}>{formatMoney(topCard.ticketPrice + topCard.foodBudget)} est.</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, background: '#2a2a30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, opacity: 0.6, textAlign: 'center', padding: 20 }}>
            You've been through the whole deck! 🎉
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
        <button onClick={() => commitSwipe('left')} disabled={!topCard}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #ff453a', color: '#ff453a', background: 'transparent', fontSize: 18, cursor: topCard ? 'pointer' : 'default', opacity: topCard ? 1 : 0.3 }}>✕</button>
        <button onClick={() => commitSwipe('right')} disabled={!topCard}
          style={{ width: 44, height: 44, borderRadius: '50%', border: '1.5px solid #34c759', color: '#34c759', background: 'transparent', fontSize: 18, cursor: topCard ? 'pointer' : 'default', opacity: topCard ? 1 : 0.3 }}>✓</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 4 }}>
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: `rgb(${GLOW})` }}>{passport.length}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>In passport</div>
        </div>
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: `rgb(${GLOW})` }}>{formatMoney(totalCommitted)}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Committed</div>
        </div>
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example festivals shown for preview — drag the card right to add, left to skip.
      </p>
    </div>
  );
}
