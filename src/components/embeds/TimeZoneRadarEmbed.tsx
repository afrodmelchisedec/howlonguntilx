// FILE: src/components/embeds/TimeZoneRadarEmbed.tsx
'use client';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';

const GLOW = '83, 74, 217';
const TEAMMATE_COLOR = '100, 200, 255';

interface Participant { id: string; name: string; startHour: number; endHour: number; color: string; }

const RING_SIZE = 320;
const CX = 160;
const CY = 160;
const HEAT_RADIUS = 122;
const ORBIT_RADIUS_YOU = 100;
const ORBIT_RADIUS_MATE = 76;
const SLOT_COUNT = 48;

function normalizeHour(h: number): number { return ((h % 24) + 24) % 24; }
function hourToPoint(hour: number, radius: number) {
  const rawDeg = (hour / 24) * 360 - 90;
  const rad = (rawDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}
function pointToHour(x: number, y: number): number {
  const dx = x - CX, dy = y - CY;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let adjusted = angle + 90;
  if (adjusted < 0) adjusted += 360;
  return (adjusted / 360) * 24;
}
function arcPath(startHour: number, deltaHours: number, radius: number): string {
  const delta = deltaHours <= 0 ? 24 : deltaHours;
  const endHour = startHour + delta;
  const p1 = hourToPoint(startHour, radius);
  const p2 = hourToPoint(endHour, radius);
  const largeArc = delta > 12 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${radius} ${radius} 0 ${largeArc} 1 ${p2.x} ${p2.y}`;
}
function formatHour(h: number): string {
  let hh = normalizeHour(h);
  let hours = Math.floor(hh);
  let minutes = Math.round((hh - hours) * 60);
  if (minutes === 60) { minutes = 0; hours = (hours + 1) % 24; }
  const period = hours < 12 ? 'AM' : 'PM';
  let displayHour = hours % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}
function deltaOf(p: Participant): number {
  const d = ((p.endHour - p.startHour) + 24) % 24;
  return d === 0 ? 24 : d;
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

export function TimeZoneRadarEmbed() {
  const [participants, setParticipants] = useState<Participant[]>([
    { id: 'you', name: 'You', startHour: 14, endHour: 22, color: GLOW },
    { id: 'mate', name: 'Teammate', startHour: 4, endHour: 12, color: TEAMMATE_COLOR },
  ]);

  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; which: 'start' | 'end' } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [activeWhich, setActiveWhich] = useState<'start' | 'end' | null>(null);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragRef.current || !svgWrapperRef.current) return;
    const rect = svgWrapperRef.current.getBoundingClientRect();
    const scale = RING_SIZE / rect.width;
    const x = (clientX - rect.left) * scale;
    const y = (clientY - rect.top) * scale;
    let hour = pointToHour(x, y);
    hour = Math.round(hour * 2) / 2;
    hour = normalizeHour(hour);
    const { id, which } = dragRef.current;
    setParticipants(prev => prev.map(p => p.id === id
      ? { ...p, [which === 'start' ? 'startHour' : 'endHour']: hour }
      : p));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientX, e.clientY); }
    function onUp() { dragRef.current = null; setActiveDragId(null); setActiveWhich(null); }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  function startDrag(id: string, which: 'start' | 'end') {
    dragRef.current = { id, which };
    setActiveDragId(id);
    setActiveWhich(which);
  }

  const slotCounts = useMemo(() => {
    const counts = new Array(SLOT_COUNT).fill(0);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotHour = i * 0.5;
      for (const p of participants) {
        const delta = deltaOf(p);
        const norm = ((slotHour - p.startHour) + 24) % 24;
        if (norm < delta) counts[i] += 1;
      }
    }
    return counts;
  }, [participants]);

  const maxOverlap = Math.max(...slotCounts, 0);

  const bestRun = useMemo(() => {
    if (maxOverlap < 2) return null;
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (slotCounts[i] === maxOverlap) {
        if (curLen === 0) curStart = i;
        curLen += 1;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else { curLen = 0; }
    }
    if (bestStart === -1) return null;
    return { startHour: bestStart * 0.5, endHour: (bestStart + bestLen) * 0.5, count: maxOverlap };
  }, [slotCounts, maxOverlap]);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>MEETING OVERLAP</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Time Zone Radar</h3>

      <div ref={svgWrapperRef} style={{ position: 'relative', width: 260, height: 260, margin: '0 auto 12px' }}>
        <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} width={260} height={260} style={{ overflow: 'visible', touchAction: 'none' }}>
          <circle cx={CX} cy={CY} r={HEAT_RADIUS + 10} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {[0, 6, 12, 18].map(h => {
            const p = hourToPoint(h, HEAT_RADIUS + 26);
            const label = h === 0 ? '12A' : h === 6 ? '6A' : h === 12 ? '12P' : '6P';
            return <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fontWeight="700" fill="#8e8e93">{label}</text>;
          })}

          {slotCounts.map((count, i) => {
            const opacity = count === 0 ? 0.04 : 0.12 + 0.78 * (count / participants.length);
            return (
              <path key={i} d={arcPath(i * 0.5, 0.5, HEAT_RADIUS)} stroke={`rgba(255, 190, 60, ${opacity})`} strokeWidth={13} fill="none" />
            );
          })}

          {bestRun && (
            <path
              d={arcPath(bestRun.startHour, (bestRun.endHour - bestRun.startHour + 24) % 24 || 24, HEAT_RADIUS)}
              stroke="rgba(255, 215, 90, 0.95)" strokeWidth={15} fill="none" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,90,0.8))' }}
            />
          )}

          {participants.map((p) => {
            const radius = p.id === 'you' ? ORBIT_RADIUS_YOU : ORBIT_RADIUS_MATE;
            const delta = deltaOf(p);
            const startPt = hourToPoint(p.startHour, radius);
            const endPt = hourToPoint(p.startHour + delta, radius);
            const isDragging = activeDragId === p.id;
            return (
              <g key={p.id}>
                <path d={arcPath(p.startHour, delta, radius)} stroke={`rgb(${p.color})`} strokeWidth={isDragging ? 9 : 6} strokeLinecap="round" fill="none" />
                <circle cx={startPt.x} cy={startPt.y} r={isDragging && activeWhich === 'start' ? 11 : 8}
                  fill={`rgb(${p.color})`} stroke="white" strokeWidth={2}
                  style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={() => startDrag(p.id, 'start')} />
                <circle cx={endPt.x} cy={endPt.y} r={isDragging && activeWhich === 'end' ? 11 : 8}
                  fill={`rgb(${p.color})`} stroke="white" strokeWidth={2}
                  style={{ cursor: 'grab', touchAction: 'none' }} onPointerDown={() => startDrag(p.id, 'end')} />
              </g>
            );
          })}

          <circle cx={CX} cy={CY} r={36} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" />
          <text x={CX} y={CY - 4} textAnchor="middle" fontSize="17" fontWeight="800" fill="#f2f2f7">{maxOverlap}/{participants.length}</text>
          <text x={CX} y={CY + 12} textAnchor="middle" fontSize="8" fill="#8e8e93">overlap</text>
        </svg>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        {participants.map(p => (
          <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, background: `rgb(${p.color})` }} />
            {p.name} {formatHour(p.startHour)}–{formatHour(p.endHour)}
          </span>
        ))}
      </div>

      {bestRun && (
        <div style={{ textAlign: 'center', fontSize: 13, color: '#ffd75a', marginBottom: 8 }}>
          Best overlap: {formatHour(bestRun.startHour)}–{formatHour(bestRun.endHour)} UTC
        </div>
      )}

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: 0, textAlign: 'center' }}>
        Example schedules shown for preview — drag either arc's ends to see the overlap update live.
      </p>
    </div>
  );
}
