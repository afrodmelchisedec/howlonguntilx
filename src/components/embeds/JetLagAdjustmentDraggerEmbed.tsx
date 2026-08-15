// FILE: src/components/embeds/JetLagAdjustmentDraggerEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

type Ring = 'home' | 'dest' | null;

const GLOW = '64, 201, 196';
const HOME_RING_COLOR = '196, 132, 252';
const DEST_RING_COLOR = '255, 122, 165';
const ADVANCE_COLOR = '100, 200, 255';
const DELAY_COLOR = '255, 159, 10';

const RATE_ADVANCE = 60;
const RATE_DELAY = 90;
const SNAP_MINUTES = 30;

const DEFAULT_HOME_BEDTIME = 23 * 60;
const DEFAULT_DEST_BEDTIME = 21 * 60 + 30;

const R_OUTER = 90;
const R_INNER = 64;
const CIRC_OUTER = 2 * Math.PI * R_OUTER;
const CIRC_INNER = 2 * Math.PI * R_INNER;

function angleForMinutes(min: number): number {
  return (min / 1440) * 360 - 90;
}
function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function clientPointToMinutes(clientX: number, clientY: number, rect: DOMRect, snap: number): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = clientX - cx;
  const dy = clientY - cy;
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  deg = ((deg % 360) + 360) % 360;
  let minutes = (deg / 360) * 1440;
  minutes = Math.round(minutes / snap) * snap;
  return ((minutes % 1440) + 1440) % 1440;
}
function formatTime(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(mm).padStart(2, '0')} ${ampm}`;
}
function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
function angularForward(from: number, to: number): number {
  return ((to - from) % 1440 + 1440) % 1440;
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

export function JetLagAdjustmentDraggerEmbed() {
  const [homeBedtime, setHomeBedtime] = useState(DEFAULT_HOME_BEDTIME);
  const [destBedtime, setDestBedtime] = useState(DEFAULT_DEST_BEDTIME);
  const [draggingRing, setDraggingRing] = useState<Ring>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const diffForward = useMemo(() => angularForward(homeBedtime, destBedtime), [homeBedtime, destBedtime]);
  const diffBackward = 1440 - diffForward;
  const direction: 'advance' | 'delay' | 'none' = diffForward === 0 ? 'none' : diffBackward <= diffForward ? 'advance' : 'delay';
  const shiftMinutes = direction === 'advance' ? diffBackward : direction === 'delay' ? diffForward : 0;
  const rate = direction === 'advance' ? RATE_ADVANCE : RATE_DELAY;
  const daysNeeded = shiftMinutes === 0 ? 0 : Math.ceil(shiftMinutes / rate);
  const directionColor = direction === 'advance' ? ADVANCE_COLOR : direction === 'delay' ? DELAY_COLOR : GLOW;

  const handleRingPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRing || !ringRef.current) return;
    const rect = ringRef.current.getBoundingClientRect();
    const minutes = clientPointToMinutes(clientX, clientY, rect, SNAP_MINUTES);
    if (draggingRing === 'home') setHomeBedtime(minutes);
    else setDestBedtime(minutes);
  }, [draggingRing]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleRingPointerMove(e.clientX, e.clientY); }
    function onUp() { setDraggingRing(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handleRingPointerMove]);

  const homeProgress = homeBedtime / 1440;
  const destProgress = destBedtime / 1440;
  const homePoint = pointOnCircle(100, 100, R_OUTER, angleForMinutes(homeBedtime));
  const destPoint = pointOnCircle(100, 100, R_INNER, angleForMinutes(destBedtime));

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>JET-LAG ADJUSTMENT DRAGGER</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Sleep-Shift Planner</h3>

      <div ref={ringRef} style={{ position: 'relative', width: 200, height: 200, margin: '0 auto 12px' }}>
        <svg viewBox="0 0 200 200" width={200} height={200} style={{ touchAction: 'none' }}>
          {Array.from({ length: 24 }).map((_, h) => {
            const angle = angleForMinutes(h * 60);
            const major = h % 6 === 0;
            const p1 = pointOnCircle(100, 100, major ? 96 : 93, angle);
            const p2 = pointOnCircle(100, 100, 99, angle);
            return <line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#6e6e73" strokeWidth={major ? 1.5 : 1} opacity={major ? 0.6 : 0.3} />;
          })}
          <circle cx={100} cy={100} r={R_OUTER} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
          <circle cx={100} cy={100} r={R_INNER} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
          <circle cx={100} cy={100} r={R_OUTER} fill="none" stroke={`rgb(${HOME_RING_COLOR})`} strokeWidth={8}
            strokeDasharray={`${homeProgress * CIRC_OUTER} ${CIRC_OUTER}`} strokeLinecap="round" transform="rotate(-90 100 100)" opacity={0.85} />
          <circle cx={100} cy={100} r={R_INNER} fill="none" stroke={`rgb(${DEST_RING_COLOR})`} strokeWidth={8}
            strokeDasharray={`${destProgress * CIRC_INNER} ${CIRC_INNER}`} strokeLinecap="round" transform="rotate(-90 100 100)" opacity={0.85} />
          <line x1={homePoint.x} y1={homePoint.y} x2={destPoint.x} y2={destPoint.y} stroke={`rgb(${directionColor})`} strokeWidth={2} strokeDasharray="4 3" opacity={0.6} />
          <circle cx={homePoint.x} cy={homePoint.y} r={11} fill="white" stroke={`rgb(${HOME_RING_COLOR})`} strokeWidth={3.5}
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={() => setDraggingRing('home')} />
          <circle cx={destPoint.x} cy={destPoint.y} r={11} fill="white" stroke={`rgb(${DEST_RING_COLOR})`} strokeWidth={3.5}
            style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={() => setDraggingRing('dest')} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: `rgb(${directionColor})` }}>
            {direction === 'none' ? '0h' : formatDuration(shiftMinutes)}
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: `rgb(${directionColor})` }}>
            {direction === 'advance' ? 'ADVANCE' : direction === 'delay' ? 'DELAY' : 'ALIGNED'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: `rgb(${HOME_RING_COLOR})` }} />
          Home {formatTime(homeBedtime)}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: `rgb(${DEST_RING_COLOR})` }} />
          Destination {formatTime(destBedtime)}
        </span>
      </div>

      <div style={{ textAlign: 'center', fontSize: 13, color: '#8e8e93', marginBottom: 12 }}>
        {daysNeeded === 0 ? '✅ Already aligned' : `Needs ${daysNeeded} day${daysNeeded === 1 ? '' : 's'} to fully adjust`}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: 0, textAlign: 'center' }}>
        Example bedtimes shown for preview — drag either dot around the ring to see the shift plan update live.
      </p>
    </div>
  );
}
