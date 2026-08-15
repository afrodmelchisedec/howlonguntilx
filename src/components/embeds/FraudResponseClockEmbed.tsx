// FILE: src/components/embeds/FraudResponseClockEmbed.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';

interface Marker { label: string; days: number; }
interface IncidentType { key: string; name: string; emoji: string; color: string; markers: [Marker, Marker]; }
interface Incident { id: string; typeKey: string; label: string; discoveredDate: string; amount: number; }
type Phase = 'closed' | 'critical' | 'urgent' | 'monitoring';

const GLOW = '255, 59, 92';

const INCIDENT_TYPES: IncidentType[] = [
  { key: 'card', name: 'Card Fraud', emoji: '💳', color: '255, 59, 48',
    markers: [{ label: 'Report for reduced liability', days: 2 }, { label: 'Dispute window closes', days: 60 }] },
  { key: 'identity', name: 'Identity Theft', emoji: '🪪', color: '191, 90, 242',
    markers: [{ label: 'File FTC identity theft report', days: 1 }, { label: 'Extended fraud alert window', days: 21 }] },
  { key: 'phishing', name: 'Phishing / Wire', emoji: '🎣', color: '255, 159, 10',
    markers: [{ label: 'Request wire recall from bank', days: 1 }, { label: 'File IC3.gov complaint', days: 10 }] },
  { key: 'check', name: 'Check Fraud', emoji: '🧾', color: '0, 122, 255',
    markers: [{ label: 'Report to your bank', days: 30 }, { label: 'Dispute window closes', days: 90 }] },
  { key: 'takeover', name: 'Account Takeover', emoji: '🔐', color: '52, 199, 89',
    markers: [{ label: 'Regain access & change passwords', days: 1 }, { label: 'Dispute unauthorized activity', days: 60 }] },
];
function typeOf(key: string): IncidentType { return INCIDENT_TYPES.find(t => t.key === key) ?? INCIDENT_TYPES[0]; }

function isoDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

const EXAMPLE_INCIDENTS: Incident[] = [
  { id: 'inc-1', typeKey: 'card', label: "Card charge I don't recognize", discoveredDate: isoDaysAgo(5), amount: 340 },
  { id: 'inc-2', typeKey: 'phishing', label: 'Suspicious wire request', discoveredDate: isoDaysAgo(1), amount: 1200 },
];

function formatMoney(n: number): string { return `$${Math.round(n).toLocaleString('en-US')}`; }

function computeStatus(incident: Incident, type: IncidentType) {
  const discovered = new Date(incident.discoveredDate);
  const markerDates = type.markers.map(m => {
    const d = new Date(discovered);
    d.setDate(d.getDate() + m.days);
    return { label: m.label, date: d };
  });
  const now = new Date();
  const upcoming = markerDates.find(m => m.date.getTime() >= now.getTime());
  if (!upcoming) {
    return { phase: 'closed' as Phase, label: 'Window likely closed', daysToNext: null as number | null };
  }
  const daysToNext = Math.max(0, Math.ceil((upcoming.date.getTime() - now.getTime()) / 86400000));
  const phase: Phase = daysToNext <= 2 ? 'critical' : daysToNext <= 7 ? 'urgent' : 'monitoring';
  return { phase, label: `${upcoming.label} — ${daysToNext}d`, daysToNext };
}
function phaseColor(phase: Phase): string {
  return { closed: '255, 59, 48', critical: '255, 59, 48', urgent: '255, 159, 10', monitoring: '52, 199, 89' }[phase];
}

// ---- Risk Radar (5-axis spider chart) ----
const RADAR_CENTER = 150;
const RADAR_R = 95;
function axisUnit(i: number) { const a = (-90 + i * 72) * Math.PI / 180; return { x: Math.cos(a), y: Math.sin(a) }; }
function axisPoint(i: number, value: number) { const u = axisUnit(i); const r = (Math.max(0, Math.min(100, value)) / 100) * RADAR_R; return { x: RADAR_CENTER + u.x * r, y: RADAR_CENTER + u.y * r }; }
function polygonStr(values: number[]) { return values.map((v, i) => { const p = axisPoint(i, v); return `${p.x},${p.y}`; }).join(' '); }
function gridPolygon(fraction: number) { return Array.from({ length: 5 }).map((_, i) => { const p = axisPoint(i, fraction * 100); return `${p.x},${p.y}`; }).join(' '); }

function RiskRadar({ values, onDrag }: { values: number[]; onDrag: (axis: number, value: number) => void }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingAxis = useRef<number | null>(null);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (draggingAxis.current === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = 300 / rect.width, scaleY = 300 / rect.height;
    const localX = (clientX - rect.left) * scaleX;
    const localY = (clientY - rect.top) * scaleY;
    const u = axisUnit(draggingAxis.current);
    const proj = (localX - RADAR_CENTER) * u.x + (localY - RADAR_CENTER) * u.y;
    const clamped = Math.max(0, Math.min(RADAR_R, proj));
    onDrag(draggingAxis.current, Math.round((clamped / RADAR_R) * 100));
  }, [onDrag]);

  useEffect(() => {
    function onMove(e: PointerEvent) { handleMove(e.clientX, e.clientY); }
    function onUp() { draggingAxis.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [handleMove]);

  return (
    <svg ref={svgRef} viewBox="0 0 300 300" width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto', touchAction: 'none' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPolygon(f)} fill="none" stroke="#3a3a40" strokeWidth={1} opacity={0.6} />
      ))}
      {INCIDENT_TYPES.map((t, i) => {
        const p = axisPoint(i, 100);
        return <line key={t.key} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={p.x} y2={p.y} stroke="#3a3a40" strokeWidth={1} opacity={0.6} />;
      })}
      <polygon points={polygonStr(values)} fill={`rgba(${GLOW}, 0.25)`} stroke={`rgb(${GLOW})`} strokeWidth={2} />
      {INCIDENT_TYPES.map((t, i) => {
        const labelPt = axisPoint(i, 122);
        const handlePt = axisPoint(i, values[i]);
        return (
          <g key={t.key}>
            <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle" fontSize="16">{t.emoji}</text>
            <circle
              cx={handlePt.x} cy={handlePt.y} r={8}
              fill="white" stroke={`rgb(${t.color})`} strokeWidth={3}
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={() => { draggingAxis.current = i; }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function FraudResponseClockEmbed() {
  const [radarOverrides, setRadarOverrides] = useState<Record<string, number>>({});

  const withStatus = useMemo(
    () => EXAMPLE_INCIDENTS.map(inc => ({ incident: inc, type: typeOf(inc.typeKey), status: computeStatus(inc, typeOf(inc.typeKey)) })),
    []
  );
  const sorted = useMemo(
    () => [...withStatus].sort((a, b) => (a.status.daysToNext ?? -1) - (b.status.daysToNext ?? -1)),
    [withStatus]
  );
  const mostUrgent = sorted[0] ?? null;
  const totalAtRisk = EXAMPLE_INCIDENTS.reduce((a, i) => a + i.amount, 0);

  const autoRadarValues = useMemo(() => {
    return INCIDENT_TYPES.map(t => {
      const matching = withStatus.filter(w => w.type.key === t.key);
      if (matching.length === 0) return 12;
      let score = 30 + (matching.length - 1) * 25;
      if (matching.some(m => m.status.phase === 'critical' || m.status.phase === 'closed')) score += 25;
      return Math.min(100, score);
    });
  }, [withStatus]);
  const effectiveRadarValues = INCIDENT_TYPES.map((t, i) => radarOverrides[t.key] ?? autoRadarValues[i]);
  const overallRiskScore = Math.round(effectiveRadarValues.reduce((a, v) => a + v, 0) / effectiveRadarValues.length);

  function handleRadarDrag(axis: number, value: number) {
    setRadarOverrides(prev => ({ ...prev, [INCIDENT_TYPES[axis].key]: value }));
  }

  const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>FRAUD RESPONSE CLOCK</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Deadline countdowns & risk radar</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: `rgb(${GLOW})` }}>{overallRiskScore}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Overall risk</div>
        </div>
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 10, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: `rgb(${GLOW})` }}>{formatMoney(totalAtRisk)}</div>
          <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>Total at risk</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {sorted.map(({ incident, type, status }) => (
          <div key={incident.id} style={{ background: '#2a2a30', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 2 }}>
              <span>{type.emoji} {incident.label}</span>
              <span style={{ fontWeight: 700, color: `rgb(${phaseColor(status.phase)})` }}>
                {status.daysToNext !== null ? `${status.daysToNext}d` : 'Closed'}
              </span>
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.6 }}>{status.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>Risk radar</span>
          <span style={{ fontSize: 11, opacity: 0.6 }}>drag a point →</span>
        </div>
        <RiskRadar values={effectiveRadarValues} onDrag={handleRadarDrag} />
      </div>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 12, lineHeight: 1.4 }}>
        Example incidents shown for preview — drag the radar points to see the risk score update live.
      </p>
    </div>
  );
}
