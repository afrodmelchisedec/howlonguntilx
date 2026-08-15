// FILE: src/components/embeds/DarkSkyExplorerEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect } from 'react';

const GLOW = '110, 231, 183';
const STAR_W = 400;
const STAR_H = 150;

const BORTLE_LABELS: Record<number, string> = {
  1: 'Excellent Dark Sky', 2: 'Typical Dark Sky', 3: 'Rural Sky', 4: 'Rural/Suburban Transition',
  5: 'Suburban Sky', 6: 'Bright Suburban Sky', 7: 'Suburban/Urban Transition', 8: 'City Sky', 9: 'Inner-City Sky',
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
const ALL_STARS = Array.from({ length: 300 }, (_, i) => ({
  x: seededRandom(i * 3 + 1) * 100,
  y: seededRandom(i * 7 + 2) * 92,
  r: 0.5 + seededRandom(i * 11 + 3) * 1.4,
}));

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

export function DarkSkyExplorerEmbed() {
  const [bortle, setBortle] = useState(5);
  const [hovering, setHovering] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingSlider = useRef(false);

  const starCount = Math.round(20 + (9 - bortle) * 30);
  const visibleStars = ALL_STARS.slice(0, starCount);
  const milkyWayOpacity = bortle <= 3 ? ((4 - bortle) / 3) * 0.45 : 0;

  function bortleAtClientX(clientX: number): number {
    if (!sliderRef.current) return bortle;
    const rect = sliderRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 8) + 1;
  }
  function applyBortle(value: number) {
    setBortle(Math.max(1, Math.min(9, value)));
  }
  function startDrag(clientX: number) {
    draggingSlider.current = true;
    setHovering(true);
    applyBortle(bortleAtClientX(clientX));
  }
  const handleMove = useCallback((clientX: number) => {
    if (draggingSlider.current) applyBortle(bortleAtClientX(clientX));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleMove(e.clientX); }
    function onUp() { draggingSlider.current = false; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleMove]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>NATURE, SPACE & SKY</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Dark Sky Explorer</h3>

      <div style={{ position: 'relative', height: STAR_H, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(to bottom, #05060a, #0d0e17)', marginBottom: 16 }}>
        <svg viewBox={`0 0 ${STAR_W} ${STAR_H}`} width="100%" height="100%" preserveAspectRatio="none">
          {milkyWayOpacity > 0 && (
            <ellipse cx={STAR_W / 2} cy={STAR_H / 2} rx={STAR_W * 0.7} ry={STAR_H * 0.35} fill={`rgba(${GLOW}, ${milkyWayOpacity})`} transform={`rotate(-18 ${STAR_W / 2} ${STAR_H / 2})`} />
          )}
          {visibleStars.map((s, i) => (
            <circle key={i} cx={(s.x / 100) * STAR_W} cy={(s.y / 100) * STAR_H} r={s.r} fill="white" opacity={0.5 + s.r * 0.3} />
          ))}
        </svg>
        <div style={{ position: 'absolute', bottom: 8, left: 10 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: `rgb(${bortleColor(bortle)})`, margin: 0 }}>{starCount} stars visible</p>
        </div>
      </div>

      <div ref={sliderRef} onPointerDown={e => startDrag(e.clientX)} style={{ position: 'relative', height: 12, borderRadius: 999, background: 'rgba(255,255,255,0.1)', touchAction: 'none', marginTop: 40 }}>
        <div
          style={{
            position: 'absolute', bottom: '100%', marginBottom: 10, left: `${((bortle - 1) / 8) * 100}%`,
            transform: 'translateX(-50%)', width: 170, textAlign: 'center',
          }}
        >
          <div style={{ background: '#0a0e14', borderRadius: 10, padding: '6px 10px', border: `1.5px solid rgb(${bortleColor(bortle)})` }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: `rgb(${bortleColor(bortle)})`, margin: 0 }}>Bortle {bortle} · {BORTLE_LABELS[bortle]}</p>
          </div>
        </div>
        <div
          style={{
            position: 'absolute', top: '50%', left: `${((bortle - 1) / 8) * 100}%`, width: 30, height: 30,
            transform: 'translate(-50%, -50%)', borderRadius: 999, background: 'white',
            border: `4px solid rgb(${bortleColor(bortle)})`, cursor: 'grab', touchAction: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#8e8e93' }}>
        <span>Dark sky</span>
        <span>City sky</span>
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '18px 0 0' }}>
        Example starfield shown for preview — drag the light-pollution slider to see the sky reveal live.
      </p>
    </div>
  );
}
