// FILE: src/components/embeds/RecipeBatchDialEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '255, 122, 60';

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 12;

const DIAL_SIZE = 220;
const CX = DIAL_SIZE / 2;
const CY = DIAL_SIZE / 2;
const KNOB_RADIUS = 80;

const ARC_START = 135;
const ARC_SWEEP = -270;

interface Ingredient { name: string; baseAmount: number; unit?: string; }
const RECIPE = {
  name: 'Spaghetti Carbonara',
  baseServings: 4,
  ingredients: [
    { name: 'Spaghetti', baseAmount: 400, unit: 'g' },
    { name: 'Eggs', baseAmount: 4 },
    { name: 'Pecorino cheese', baseAmount: 100, unit: 'g' },
    { name: 'Guanciale', baseAmount: 150, unit: 'g' },
    { name: 'Black pepper', baseAmount: 1, unit: 'tsp' },
  ] as Ingredient[],
};

function servingsToAngle(servings: number, max: number): number {
  const ratio = (servings - MIN_SERVINGS) / (max - MIN_SERVINGS);
  return ARC_START + ARC_SWEEP * ratio;
}
function angleToPoint(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY - radius * Math.sin(rad) };
}
function pointerToServings(clientX: number, clientY: number, rect: DOMRect, max: number): number {
  const scale = DIAL_SIZE / rect.width;
  const x = (clientX - rect.left) * scale;
  const y = (clientY - rect.top) * scale;
  const dx = x - CX;
  const dy = CY - y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let normalized = ARC_START - angle;
  if (normalized < 0) normalized += 360;
  if (normalized > 270) {
    normalized = normalized - 270 < 45 ? 270 : 0;
  }
  const ratio = normalized / 270;
  const raw = MIN_SERVINGS + ratio * (max - MIN_SERVINGS);
  return Math.round(raw);
}
function fmtAmount(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '').replace(/\.$/, '');
}

export function RecipeBatchDialEmbed() {
  const [servings, setServings] = useState(RECIPE.baseServings);
  const [dragging, setDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const multiplier = servings / RECIPE.baseServings;

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const next = pointerToServings(clientX, clientY, rect, MAX_SERVINGS);
    setServings(Math.max(MIN_SERVINGS, Math.min(next, MAX_SERVINGS)));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { if (dragging) handlePointerMove(e.clientX, e.clientY); }
    function onUp() { setDragging(false); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragging, handlePointerMove]);

  function startDrag(clientX: number, clientY: number) {
    setDragging(true);
    handlePointerMove(clientX, clientY);
  }

  const knobAngle = servingsToAngle(servings, MAX_SERVINGS);
  const knobPos = angleToPoint(knobAngle, KNOB_RADIUS);

  const tickMarks = useMemo(() => {
    const count = 11;
    return Array.from({ length: count }).map((_, i) => {
      const angle = ARC_START + (ARC_SWEEP * i) / (count - 1);
      return { angle, isMajor: i % 5 === 0 };
    });
  }, []);

  const showBatchTip = multiplier >= 3;

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>RECIPE BATCH-SCALE DIAL</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>{RECIPE.name}</p>

      <div style={{ position: 'relative', width: DIAL_SIZE, height: DIAL_SIZE, margin: '0 auto 16px' }}>
        <div ref={dialRef} onPointerDown={e => startDrag(e.clientX, e.clientY)}
          style={{ position: 'relative', width: '100%', height: '100%', touchAction: 'none', cursor: 'grab' }}>
          <svg width={DIAL_SIZE} height={DIAL_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
            {tickMarks.map((t, i) => {
              const inner = angleToPoint(t.angle, t.isMajor ? 68 : 74);
              const outer = angleToPoint(t.angle, 80);
              return <line key={i} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={t.isMajor ? `rgb(${GLOW})` : '#555'} strokeWidth={t.isMajor ? 2 : 1} />;
            })}
            <circle cx={CX} cy={CY} r={56} fill="#2a2a30" stroke="#3a3a40" strokeWidth={1.5} />
            <line x1={CX} y1={CY} x2={knobPos.x} y2={knobPos.y} stroke={`rgb(${GLOW})`} strokeWidth={3} strokeLinecap="round" />
            <circle cx={knobPos.x} cy={knobPos.y} r={11} fill={`rgb(${GLOW})`} stroke="white" strokeWidth={3} style={{ cursor: 'grab' }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{servings}</div>
            <div style={{ fontSize: 10, opacity: 0.6 }}>servings</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 12, opacity: 0.7, marginBottom: 12 }}>
        {fmtAmount(multiplier)}× the base recipe ({RECIPE.baseServings} servings)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: showBatchTip ? 12 : 4 }}>
        {RECIPE.ingredients.map(ing => (
          <div key={ing.name} style={{ display: 'flex', justifyContent: 'space-between', background: '#2a2a30', borderRadius: 8, padding: '7px 10px', fontSize: 12.5 }}>
            <span style={{ opacity: 0.85 }}>{ing.name}</span>
            <span style={{ fontWeight: 700, color: `rgb(${GLOW})` }}>{fmtAmount(ing.baseAmount * multiplier)}{ing.unit ? ` ${ing.unit}` : ''}</span>
          </div>
        ))}
      </div>

      {showBatchTip && (
        <div style={{ borderLeft: `3px solid rgb(${GLOW})`, background: `rgba(${GLOW}, 0.08)`, borderRadius: 8, padding: '10px 12px', fontSize: 11.5 }}>
          🍽️ Big batch! You may need a larger pot and extra cook time.
        </div>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example recipe shown for preview — drag the dial to scale every ingredient live.
      </p>
    </div>
  );
}
