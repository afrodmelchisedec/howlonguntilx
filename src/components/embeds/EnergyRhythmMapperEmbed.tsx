'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface EnergyPoint { hour: number; value: number }

const GLOW = '255, 138, 101';
const ZONE_COLORS = { focus: '88, 214, 113', light: '255, 159, 10', rest: '129, 178, 255' } as const;

const HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const SNAP = 10;

const CHART_W = 380;
const CHART_H = 200;
const PLOT_TOP = 12;
const PLOT_BOTTOM = 172;

const INITIAL_POINTS: EnergyPoint[] = [
  { hour: 0, value: 15 }, { hour: 3, value: 10 }, { hour: 6, value: 25 }, { hour: 9, value: 70 },
  { hour: 12, value: 85 }, { hour: 15, value: 60 }, { hour: 18, value: 55 }, { hour: 21, value: 25 },
];

function buildExtended(points: EnergyPoint[]): EnergyPoint[] {
  const sorted = [...points].sort((a, b) => a.hour - b.hour);
  return [...sorted, { hour: 24, value: sorted[0].value }];
}
function interpolateAt(points: EnergyPoint[], hour: number): number {
  const ext = buildExtended(points);
  for (let i = 0; i < ext.length - 1; i++) {
    const a = ext[i], b = ext[i + 1];
    if (hour >= a.hour && hour <= b.hour) {
      const t = b.hour === a.hour ? 0 : (hour - a.hour) / (b.hour - a.hour);
      return a.value + t * (b.value - a.value);
    }
  }
  return ext[ext.length - 1].value;
}
function averageEnergy(points: EnergyPoint[]): number {
  const ext = buildExtended(points);
  let area = 0;
  for (let i = 0; i < ext.length - 1; i++) {
    const a = ext[i], b = ext[i + 1];
    area += (b.hour - a.hour) * (a.value + b.value) / 2;
  }
  return area / 24;
}
function computeAboveThresholdWindows(points: EnergyPoint[], threshold: number): { start: number; end: number }[] {
  const ext = buildExtended(points);
  const raw: { start: number; end: number }[] = [];
  for (let i = 0; i < ext.length - 1; i++) {
    const a = ext[i], b = ext[i + 1];
    if (a.value >= threshold && b.value >= threshold) raw.push({ start: a.hour, end: b.hour });
    else if (a.value >= threshold && b.value < threshold) {
      const t = a.hour + ((a.value - threshold) / (a.value - b.value)) * (b.hour - a.hour);
      raw.push({ start: a.hour, end: t });
    } else if (a.value < threshold && b.value >= threshold) {
      const t = a.hour + ((threshold - a.value) / (b.value - a.value)) * (b.hour - a.hour);
      raw.push({ start: t, end: b.hour });
    }
  }
  const merged: { start: number; end: number }[] = [];
  for (const w of raw) {
    const last = merged[merged.length - 1];
    if (last && w.start - last.end < 0.01) last.end = w.end;
    else merged.push({ ...w });
  }
  return merged;
}
function formatHour(h: number): string {
  const totalMinutes = Math.round((((h % 24) + 24) % 24) * 60);
  const hour24 = Math.floor(totalMinutes / 60) % 24;
  const minute = totalMinutes % 60;
  const ampm = hour24 < 12 ? 'AM' : 'PM';
  let hour12 = hour24 % 12; if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${ampm}`;
}
function getZone(value: number): 'focus' | 'light' | 'rest' {
  return value >= 75 ? 'focus' : value >= 40 ? 'light' : 'rest';
}
function buildSmoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i], p1 = pts[i + 1];
    const midX = (p0.x + p1.x) / 2, midY = (p0.y + p1.y) / 2;
    d += ` Q ${p0.x},${p0.y} ${midX},${midY}`;
  }
  d += ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}
function valueToY(v: number): number { return PLOT_BOTTOM - (v / 100) * (PLOT_BOTTOM - PLOT_TOP); }
function hourToX(h: number): number { return (h / 24) * CHART_W; }

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f2',
};

export function EnergyRhythmMapperEmbed() {
  const [points, setPoints] = useState<EnergyPoint[]>(INITIAL_POINTS);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [highlightWindow, setHighlightWindow] = useState<{ start: number; end: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragHour = useRef<number | null>(null);

  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.hour - b.hour), [points]);
  const rhythmScore = useMemo(() => Math.round(averageEnergy(sortedPoints)), [sortedPoints]);
  const peak = useMemo(() => sortedPoints.reduce((m, p) => (p.value > m.value ? p : m), sortedPoints[0]), [sortedPoints]);
  const dip = useMemo(() => sortedPoints.reduce((m, p) => (p.value < m.value ? p : m), sortedPoints[0]), [sortedPoints]);
  const flowWindows = useMemo(() => computeAboveThresholdWindows(sortedPoints, 75), [sortedPoints]);
  const flowWindow = useMemo(
    () => (flowWindows.length ? flowWindows.reduce((m, w) => (w.end - w.start > m.end - m.start ? w : m)) : null),
    [flowWindows]
  );

  function valueAtClientY(clientY: number): number {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const internalY = ((clientY - rect.top) / rect.height) * CHART_H;
    const raw = ((PLOT_BOTTOM - internalY) / (PLOT_BOTTOM - PLOT_TOP)) * 100;
    const clamped = Math.max(0, Math.min(100, raw));
    return Math.round(clamped / SNAP) * SNAP;
  }
  function startDrag(hour: number, clientY: number) {
    dragHour.current = hour;
    setHoveredHour(hour);
    const value = valueAtClientY(clientY);
    setPoints(prev => prev.map(p => (p.hour === hour ? { ...p, value } : p)));
  }
  const handlePointerMove = useCallback((clientY: number) => {
    if (dragHour.current === null) return;
    const value = valueAtClientY(clientY);
    setPoints(prev => prev.map(p => (p.hour === dragHour.current ? { ...p, value } : p)));
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) { handlePointerMove(e.clientY); }
    function onUp() { dragHour.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove]);

  function suggestFlowWindow() {
    if (!flowWindow || flowWindow.end - flowWindow.start < 0.2) return;
    setHighlightWindow(flowWindow);
    setTimeout(() => setHighlightWindow(null), 2200);
  }

  const pathPoints = [...sortedPoints.map(p => ({ x: hourToX(p.hour), y: valueToY(p.value) })), { x: CHART_W, y: valueToY(sortedPoints[0].value) }];
  const linePath = buildSmoothPath(pathPoints);
  const areaPath = `${linePath} L${CHART_W},${PLOT_BOTTOM} L${pathPoints[0].x},${PLOT_BOTTOM} Z`;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: `rgb(${GLOW})`, margin: '0 0 4px' }}>HEALTH & WELLNESS</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 14px' }}>Energy Rhythm Mapper</h3>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: `rgb(${GLOW})` }}>{rhythmScore}%</span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>avg rhythm score</span>
      </div>

      <p style={{ fontSize: 12, opacity: 0.75, margin: '0 0 8px' }}>Drag any point up or down to reshape your day</p>

      <div style={{ width: '100%', aspectRatio: `${CHART_W} / ${CHART_H}`, position: 'relative' }}>
        <svg ref={svgRef} viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ touchAction: 'none', overflow: 'visible' }}>
          <defs>
            <linearGradient id="rhythmFillEmbed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={`rgb(${GLOW})`} stopOpacity="0.35" />
              <stop offset="100%" stopColor={`rgb(${GLOW})`} stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x={0} y={PLOT_TOP} width={CHART_W} height={valueToY(75) - PLOT_TOP} fill={`rgb(${ZONE_COLORS.focus})`} opacity={0.08} />
          <rect x={0} y={valueToY(75)} width={CHART_W} height={valueToY(40) - valueToY(75)} fill={`rgb(${ZONE_COLORS.light})`} opacity={0.08} />
          <rect x={0} y={valueToY(40)} width={CHART_W} height={PLOT_BOTTOM - valueToY(40)} fill={`rgb(${ZONE_COLORS.rest})`} opacity={0.08} />

          {[0, 6, 12, 18, 24].map(h => (
            <line key={h} x1={hourToX(h)} x2={hourToX(h)} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          ))}

          {highlightWindow && (
            <rect x={hourToX(highlightWindow.start)} y={PLOT_TOP} width={hourToX(highlightWindow.end) - hourToX(highlightWindow.start)} height={PLOT_BOTTOM - PLOT_TOP} fill={`rgb(${GLOW})`} opacity={0.18} />
          )}

          <path d={areaPath} fill="url(#rhythmFillEmbed)" />
          <path d={linePath} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />

          {sortedPoints.map(p => {
            const zone = getZone(p.value);
            const x = hourToX(p.hour), y = valueToY(p.value);
            const isActive = hoveredHour === p.hour;
            return (
              <g key={p.hour}>
                <circle
                  cx={x} cy={y} r={16} fill="transparent"
                  onPointerDown={e => startDrag(p.hour, e.clientY)}
                  onMouseEnter={() => setHoveredHour(p.hour)}
                  onMouseLeave={() => { if (dragHour.current === null) setHoveredHour(null); }}
                  style={{ cursor: 'ns-resize', touchAction: 'none' }}
                />
                {isActive && <circle cx={x} cy={y} r={11} fill="none" stroke={`rgb(${ZONE_COLORS[zone]})`} strokeWidth={2} opacity={0.5} />}
                <circle cx={x} cy={y} r={6} fill={`rgb(${ZONE_COLORS[zone]})`} stroke="#1a1a1e" strokeWidth={2} style={{ pointerEvents: 'none' }} />
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 16, margin: '14px 0 4px', fontSize: 12 }}>
        <span style={{ opacity: 0.85 }}>Peak: <strong>{Math.round(peak.value)}%</strong> at {formatHour(peak.hour)}</span>
        <span style={{ opacity: 0.85 }}>Dip: <strong>{Math.round(dip.value)}%</strong> at {formatHour(dip.hour)}</span>
      </div>

      <button
        onClick={suggestFlowWindow}
        style={{
          width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10, border: 'none',
          background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})`, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        🧠 {flowWindow && flowWindow.end - flowWindow.start >= 0.2 ? `Show flow window: ${formatHour(flowWindow.start)}–${formatHour(flowWindow.end)}` : 'No sustained flow window yet'}
      </button>

      <p style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.55, marginTop: 14, marginBottom: 0 }}>
        Example day shown for preview — drag any point on the curve to see your rhythm score, peak, and flow window update live.
      </p>
    </div>
  );
}
