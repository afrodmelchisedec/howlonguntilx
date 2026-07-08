// FILE: src/components/pro-tools/FraudResponseClock.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { FRAUD_RESPONSE_COMMENTS } from './fraudResponseComments';

interface Marker { label: string; days: number; }
interface IncidentType {
  key: string;
  name: string;
  emoji: string;
  color: string;
  markers: [Marker, Marker];
  defaultSteps: string[];
}
interface Step { id: string; text: string; done: boolean; custom?: boolean; }
interface Incident {
  id: string;
  typeKey: string;
  label: string;
  discoveredDate: string; // ISO
  amount: number;
  customDays?: [number, number];
  steps: Step[];
}
type Phase = 'closed' | 'critical' | 'urgent' | 'monitoring';

const GLOW = '255, 59, 92';

const FREE_MAX_INCIDENTS = 2;
const PRO_MAX_INCIDENTS = 8;

const INCIDENT_TYPES: IncidentType[] = [
  {
    key: 'card', name: 'Card Fraud', emoji: '💳', color: '255, 59, 48',
    markers: [{ label: 'Report for reduced liability', days: 2 }, { label: 'Dispute window closes', days: 60 }],
    defaultSteps: ['Call your card issuer immediately', 'Freeze or lock the card in your banking app', 'Request a new card number', 'File a written dispute if required', 'Monitor your statement for the resolution'],
  },
  {
    key: 'identity', name: 'Identity Theft', emoji: '🪪', color: '191, 90, 242',
    markers: [{ label: 'File FTC identity theft report', days: 1 }, { label: 'Extended fraud alert window', days: 21 }],
    defaultSteps: ['File a report at IdentityTheft.gov', 'Place a fraud alert with one credit bureau', 'Review your credit reports for unfamiliar accounts', 'Consider a credit freeze', 'Update passwords on financial accounts'],
  },
  {
    key: 'phishing', name: 'Phishing / Wire', emoji: '🎣', color: '255, 159, 10',
    markers: [{ label: 'Request wire recall from bank', days: 1 }, { label: 'File IC3.gov complaint', days: 10 }],
    defaultSteps: ['Contact your bank to attempt a wire recall', 'Change passwords on any account you entered', 'Enable two-factor authentication', 'File a complaint at IC3.gov', 'Watch for follow-up phishing attempts'],
  },
  {
    key: 'check', name: 'Check Fraud', emoji: '🧾', color: '0, 122, 255',
    markers: [{ label: 'Report to your bank', days: 30 }, { label: 'Dispute window closes', days: 90 }],
    defaultSteps: ['Report the fraudulent check to your bank', 'Close the account if instructed', 'Request a stop payment if applicable', 'File a police report for the record', 'Order new checks with updated security features'],
  },
  {
    key: 'takeover', name: 'Account Takeover', emoji: '🔐', color: '52, 199, 89',
    markers: [{ label: 'Regain access & change passwords', days: 1 }, { label: 'Dispute unauthorized activity', days: 60 }],
    defaultSteps: ['Regain access to the account', 'Change your password and enable 2FA', 'Review recent activity for unauthorized changes', 'Notify contacts if messages were sent from your account', 'Dispute any unauthorized transactions'],
  },
];
function typeOf(key: string): IncidentType { return INCIDENT_TYPES.find(t => t.key === key) ?? INCIDENT_TYPES[0]; }
function nextTypeKey(key: string): string {
  const idx = INCIDENT_TYPES.findIndex(t => t.key === key);
  return INCIDENT_TYPES[(idx + 1) % INCIDENT_TYPES.length].key;
}

const CONTACTS = [
  { name: 'Your card issuer / bank', detail: 'Use the number on the back of your card or your banking app', copyValue: 'Call the number on the back of your card' },
  { name: 'IdentityTheft.gov', detail: 'FTC identity theft reporting & recovery plan', copyValue: 'https://identitytheft.gov' },
  { name: 'ReportFraud.ftc.gov', detail: 'FTC general fraud reporting', copyValue: 'https://reportfraud.ftc.gov' },
  { name: 'IC3.gov', detail: 'FBI Internet Crime Complaint Center — phishing & wire fraud', copyValue: 'https://ic3.gov' },
  { name: 'AnnualCreditReport.com', detail: 'Free official credit reports from all 3 bureaus', copyValue: 'https://annualcreditreport.com' },
];

function isoDaysAgo(days: number): string {
  const d = new Date(); d.setDate(d.getDate() - days); d.setHours(9, 0, 0, 0);
  return d.toISOString();
}
function buildDefaultSteps(type: IncidentType, doneCount = 0): Step[] {
  return type.defaultSteps.map((text, i) => ({ id: `step-${type.key}-${i}`, text, done: i < doneCount }));
}
function buildDefaultIncidents(): Incident[] {
  const type = typeOf('card');
  return [{
    id: 'inc-1', typeKey: 'card', label: "Card charge I don't recognize",
    discoveredDate: isoDaysAgo(5), amount: 340, steps: buildDefaultSteps(type, 1),
  }];
}

function formatMoney(n: number): string { return `$${Math.round(n).toLocaleString('en-US')}`; }
function formatDate(d: Date): string { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

function computeStatus(incident: Incident, type: IncidentType) {
  const discovered = new Date(incident.discoveredDate);
  const markerDates = type.markers.map((m, i) => {
    const d = new Date(discovered);
    d.setDate(d.getDate() + (incident.customDays?.[i] ?? m.days));
    return { label: m.label, date: d };
  });
  const now = new Date();
  const upcoming = markerDates.find(m => m.date.getTime() >= now.getTime());
  if (!upcoming) {
    return { phase: 'closed' as Phase, label: '🚨 Window likely closed — contact your bank now', daysToNext: null as number | null, markerDates, priority: 0 };
  }
  const daysToNext = Math.max(0, Math.ceil((upcoming.date.getTime() - now.getTime()) / 86400000));
  const phase: Phase = daysToNext <= 2 ? 'critical' : daysToNext <= 7 ? 'urgent' : 'monitoring';
  const label = `${upcoming.label} — ${daysToNext}d`;
  const priority = phase === 'critical' ? 1 : phase === 'urgent' ? 2 : 3;
  return { phase, label, daysToNext, markerDates, priority };
}
function phaseColor(phase: Phase): string {
  return { closed: '255, 59, 48', critical: '255, 59, 48', urgent: '255, 159, 10', monitoring: '52, 199, 89' }[phase];
}

// ---- inline editable text ----
function EditableText({ value, onCommit, colorRgb }: { value: string; onCommit: (v: string) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { const t = draft.trim(); onCommit(t.length > 0 ? t : value); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="text-footnote font-bold bg-transparent outline-none border-b"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(draft.length, 8)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(value); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 text-left" title="Click to rename">
      {value}
    </button>
  );
}
function EditableAmount({ value, onCommit, colorRgb }: { value: number; onCommit: (v: number) => void; colorRgb: string }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { onCommit(Math.max(0, Math.round(Number(draft.replace(/[^0-9.]/g, '')) || 0))); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="decimal"
        className="text-footnote font-bold bg-transparent outline-none border-b tabular"
        style={{ color: `rgb(${colorRgb})`, borderColor: `rgb(${colorRgb})`, width: `${Math.max(String(value).length + 2, 5)}ch` }}
      />
    );
  }
  return (
    <button onClick={() => { setDraft(String(value)); setEditing(true); }} className="text-footnote font-bold press underline decoration-dotted underline-offset-2 tabular" title="Click to edit">
      {formatMoney(value)}
    </button>
  );
}
function EditableDays({ value, onCommit, disabled }: { value: number; onCommit: (v: number) => void; disabled?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (editing) { inputRef.current?.focus(); inputRef.current?.select(); } }, [editing]);
  function commit() { onCommit(Math.max(0, Math.round(Number(draft) || 0))); setEditing(false); }
  if (editing) {
    return (
      <input
        ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false); } }}
        inputMode="numeric"
        className="text-caption font-bold bg-transparent outline-none border-b tabular"
        style={{ width: '3ch' }}
      />
    );
  }
  return (
    <button onClick={() => { if (disabled) return; setDraft(String(value)); setEditing(true); }} disabled={disabled}
      className="text-caption font-bold press underline decoration-dotted underline-offset-2 tabular disabled:no-underline disabled:opacity-70" title={disabled ? 'Upgrade to Pro to edit' : 'Click to edit days'}>
      {value}d{!disabled && ' ✏️'}
    </button>
  );
}

// ---- Risk Radar (5-axis spider chart) ----
const RADAR_CENTER = 150;
const RADAR_R = 95;
function axisUnit(i: number) { const a = (-90 + i * 72) * Math.PI / 180; return { x: Math.cos(a), y: Math.sin(a) }; }
function axisPoint(i: number, value: number) { const u = axisUnit(i); const r = (Math.max(0, Math.min(100, value)) / 100) * RADAR_R; return { x: RADAR_CENTER + u.x * r, y: RADAR_CENTER + u.y * r }; }
function polygonStr(values: number[]) { return values.map((v, i) => { const p = axisPoint(i, v); return `${p.x},${p.y}`; }).join(' '); }
function gridPolygon(fraction: number) { return Array.from({ length: 5 }).map((_, i) => { const p = axisPoint(i, fraction * 100); return `${p.x},${p.y}`; }).join(' '); }

function RiskRadar({ values, isPro, onDrag }: { values: number[]; isPro: boolean; onDrag: (axis: number, value: number) => void }) {
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
    <svg ref={svgRef} viewBox="0 0 300 300" width="100%" style={{ maxWidth: 300, display: 'block', margin: '0 auto', touchAction: 'none' }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPolygon(f)} fill="none" stroke="var(--border-hairline)" strokeWidth={1} opacity={0.6} />
      ))}
      {INCIDENT_TYPES.map((t, i) => {
        const p = axisPoint(i, 100);
        return <line key={t.key} x1={RADAR_CENTER} y1={RADAR_CENTER} x2={p.x} y2={p.y} stroke="var(--border-hairline)" strokeWidth={1} opacity={0.6} />;
      })}
      <polygon points={polygonStr(values)} fill={`rgba(${GLOW}, 0.25)`} stroke={`rgb(${GLOW})`} strokeWidth={2} />
      {INCIDENT_TYPES.map((t, i) => {
        const labelPt = axisPoint(i, 122);
        const handlePt = axisPoint(i, values[i]);
        return (
          <g key={t.key}>
            <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle" fontSize="16">{t.emoji}</text>
            <circle
              cx={handlePt.x} cy={handlePt.y} r={isPro ? 8 : 5}
              fill={isPro ? 'white' : `rgb(${t.color})`}
              stroke={`rgb(${t.color})`} strokeWidth={isPro ? 3 : 0}
              style={{ cursor: isPro ? 'grab' : 'default', touchAction: 'none' }}
              onPointerDown={() => { if (isPro) draggingAxis.current = i; }}
            />
          </g>
        );
      })}
    </svg>
  );
}

export function FraudResponseClock() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxIncidents = isPro ? PRO_MAX_INCIDENTS : FREE_MAX_INCIDENTS;

  const [incidents, setIncidents] = useState<Incident[]>(buildDefaultIncidents);
  const [radarOverrides, setRadarOverrides] = useState<Record<string, number>>({});
  const [newStepText, setNewStepText] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(23);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/fraud-response-clock')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.incidents)) setIncidents(data.config.incidents.slice(0, PRO_MAX_INCIDENTS));
          if (data.config.radarOverrides) setRadarOverrides(data.config.radarOverrides);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const withStatus = useMemo(() => incidents.map(inc => ({ incident: inc, type: typeOf(inc.typeKey), status: computeStatus(inc, typeOf(inc.typeKey)) })), [incidents, tick]);
  const sorted = useMemo(() => [...withStatus].sort((a, b) => a.status.priority - b.status.priority || (a.status.daysToNext ?? -1) - (b.status.daysToNext ?? -1)), [withStatus]);

  const mostUrgent = sorted[0] ?? null;
  const totalAtRisk = incidents.reduce((a, i) => a + i.amount, 0);
  const stepsTotal = incidents.reduce((a, i) => a + i.steps.length, 0);
  const stepsDone = incidents.reduce((a, i) => a + i.steps.filter(s => s.done).length, 0);

  const autoRadarValues = useMemo(() => INCIDENT_TYPES.map(t => {
    const matching = withStatus.filter(w => w.type.key === t.key);
    if (matching.length === 0) return 12;
    let score = 30 + (matching.length - 1) * 25;
    if (matching.some(m => m.status.phase === 'critical' || m.status.phase === 'closed')) score += 25;
    return Math.min(100, score);
  }), [withStatus]);
  const effectiveRadarValues = INCIDENT_TYPES.map((t, i) => isPro && radarOverrides[t.key] != null ? radarOverrides[t.key] : autoRadarValues[i]);
  const overallRiskScore = Math.round(effectiveRadarValues.reduce((a, v) => a + v, 0) / effectiveRadarValues.length);

  const health: 'critical' | 'urgent' | 'monitoring' | 'protected' =
    incidents.length === 0 ? 'protected' :
    mostUrgent && (mostUrgent.status.phase === 'critical' || mostUrgent.status.phase === 'closed') ? 'critical' :
    mostUrgent && mostUrgent.status.phase === 'urgent' ? 'urgent' : 'monitoring';
  const healthLabel = {
    critical: '🚨 Act now — deadline critical',
    urgent: '⚠️ Deadline approaching',
    monitoring: '👁️ Monitoring',
    protected: '🛡️ No active incidents',
  }[health];
  const healthColor = { critical: '255, 59, 48', urgent: '255, 159, 10', monitoring: GLOW, protected: '52, 199, 89' }[health];

  const atFreeLimit = !isPro && incidents.length >= FREE_MAX_INCIDENTS;

  function addIncident() {
    if (incidents.length >= maxIncidents) {
      showToast(isPro ? `You can track up to ${maxIncidents} incidents` : 'Upgrade to Pro to track more incidents', isPro ? '⚠️' : '⭐');
      return;
    }
    const used = new Set(incidents.map(i => i.typeKey));
    const nextKey = INCIDENT_TYPES.find(t => !used.has(t.key))?.key ?? nextTypeKey(incidents[incidents.length - 1]?.typeKey ?? 'card');
    const type = typeOf(nextKey);
    setIncidents(prev => [...prev, {
      id: `inc-${Date.now()}`, typeKey: nextKey, label: type.name, discoveredDate: isoDaysAgo(0), amount: 0, steps: buildDefaultSteps(type),
    }]);
  }
  function removeIncident(id: string) { setIncidents(prev => prev.filter(i => i.id !== id)); }
  function renameIncident(id: string, label: string) { setIncidents(prev => prev.map(i => i.id === id ? { ...i, label } : i)); }
  function updateAmount(id: string, amount: number) { setIncidents(prev => prev.map(i => i.id === id ? { ...i, amount } : i)); }
  function updateDiscoveredDate(id: string, dateStr: string) {
    const d = new Date(`${dateStr}T09:00:00`);
    setIncidents(prev => prev.map(i => i.id === id ? { ...i, discoveredDate: d.toISOString() } : i));
  }
  function cycleIncidentType(id: string) {
    setIncidents(prev => prev.map(i => {
      if (i.id !== id) return i;
      const newKey = nextTypeKey(i.typeKey);
      return { ...i, typeKey: newKey, customDays: undefined, steps: buildDefaultSteps(typeOf(newKey)) };
    }));
  }
  function updateCustomDays(id: string, markerIndex: 0 | 1, days: number) {
    setIncidents(prev => prev.map(i => {
      if (i.id !== id) return i;
      const type = typeOf(i.typeKey);
      const base: [number, number] = i.customDays ?? [type.markers[0].days, type.markers[1].days];
      const next: [number, number] = [...base] as [number, number];
      next[markerIndex] = days;
      return { ...i, customDays: next };
    }));
  }
  function toggleStep(incidentId: string, stepId: string) {
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, steps: i.steps.map(s => s.id === stepId ? { ...s, done: !s.done } : s) } : i));
  }
  function addCustomStep(incidentId: string) {
    if (!isPro) { showToast('Upgrade to Pro to add custom steps', '⭐'); return; }
    const text = (newStepText[incidentId] ?? '').trim();
    if (!text) return;
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, steps: [...i.steps, { id: `step-custom-${Date.now()}`, text, done: false, custom: true }] } : i));
    setNewStepText(prev => ({ ...prev, [incidentId]: '' }));
  }
  function removeStep(incidentId: string, stepId: string) {
    setIncidents(prev => prev.map(i => i.id === incidentId ? { ...i, steps: i.steps.filter(s => s.id !== stepId) } : i));
  }
  function handleRadarDrag(axisIndex: number, value: number) {
    if (!isPro) return;
    const key = INCIDENT_TYPES[axisIndex].key;
    setRadarOverrides(prev => ({ ...prev, [key]: value }));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your tracker', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/fraud-response-clock', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidents, radarOverrides }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }
  function handleReset() {
    setIncidents(buildDefaultIncidents());
    setRadarOverrides({});
    showToast('Reset to defaults', '↺');
  }
  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyContact(value: string) {
    navigator.clipboard.writeText(value).then(() => showToast('Copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCopyPlan() {
    const lines = [
      `Fraud response summary (${incidents.length} incident${incidents.length === 1 ? '' : 's'}, ${formatMoney(totalAtRisk)} at risk):`,
      ...sorted.map(({ incident, type, status }) => `- ${type.emoji} ${incident.label}: ${status.label} · ${incident.steps.filter(s => s.done).length}/${incident.steps.length} steps done`),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Plan copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>FINANCIAL FRAUD</p>
            <h2 className="text-title2">Fraud Response Clock</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save your tracker to your account' : 'Upgrade to save your tracker'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Most urgent', value: mostUrgent ? (mostUrgent.status.daysToNext !== null ? `${mostUrgent.status.daysToNext}d` : 'Closed') : '—', color: mostUrgent ? phaseColor(mostUrgent.status.phase) : GLOW },
            { label: 'Active incidents', value: `${incidents.length} / ${maxIncidents}` },
            { label: 'Overall risk score', value: `${overallRiskScore}%` },
            { label: 'Total at risk', value: formatMoney(totalAtRisk) },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular" style={{ color: `rgb(${stat.color ?? GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Risk Radar */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Risk Radar</p>
            <p className="text-caption">{isPro ? 'drag any axis to self-assess' : 'auto-computed from your incidents 🔒'}</p>
          </div>
          <RiskRadar values={effectiveRadarValues} isPro={isPro} onDrag={handleRadarDrag} />
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {INCIDENT_TYPES.map((t, i) => (
              <span key={t.key} className="text-caption">{t.emoji} {t.name}: <strong style={{ color: `rgb(${t.color})` }}>{effectiveRadarValues[i]}%</strong></span>
            ))}
          </div>
        </div>

        {/* Incident cards */}
        <div className="flex flex-col gap-3 mb-4">
          {sorted.length === 0 && (
            <div className="ios-card-nested p-6 text-center">
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No incidents tracked — hopefully it stays that way. Add one below if you need to.</p>
            </div>
          )}
          {sorted.map(({ incident, type, status }) => {
            const doneCount = incident.steps.filter(s => s.done).length;
            const stepPct = incident.steps.length > 0 ? Math.round((doneCount / incident.steps.length) * 100) : 0;
            const days: [number, number] = incident.customDays ?? [type.markers[0].days, type.markers[1].days];
            return (
              <div key={incident.id} className="ios-card-nested p-4 flex flex-col gap-3" style={{ borderLeft: `3px solid rgb(${phaseColor(status.phase)})` }}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => cycleIncidentType(incident.id)} className="text-lg press" title="Click to change type">{type.emoji}</button>
                    <EditableText value={incident.label} onCommit={v => renameIncident(incident.id, v)} colorRgb={type.color} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-footnote font-bold" style={{ color: `rgb(${phaseColor(status.phase)})` }}>{status.label}</span>
                    <button onClick={() => removeIncident(incident.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3 text-caption">
                  <label className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-secondary)' }}>Discovered</span>
                    <input type="date" value={new Date(incident.discoveredDate).toISOString().slice(0, 10)} onChange={e => updateDiscoveredDate(incident.id, e.target.value)}
                      className="rounded-lg px-2 py-1 text-caption bg-transparent outline-none tabular" style={{ border: '1px solid var(--border-hairline)' }} />
                  </label>
                  <span>Amount at risk <EditableAmount value={incident.amount} onCommit={v => updateAmount(incident.id, v)} colorRgb={type.color} /></span>
                </div>

                {/* deadline markers */}
                <div className="flex flex-col gap-1.5">
                  {type.markers.map((m, mi) => {
                    const d = new Date(incident.discoveredDate);
                    d.setDate(d.getDate() + days[mi]);
                    const passed = d.getTime() < Date.now();
                    return (
                      <div key={mi} className="flex items-center justify-between text-caption">
                        <span style={{ color: passed ? 'rgb(255, 59, 48)' : 'var(--text-secondary)' }}>{passed ? '✗' : '○'} {m.label} — {formatDate(d)}</span>
                        <EditableDays value={days[mi]} onCommit={v => updateCustomDays(incident.id, mi as 0 | 1, v)} disabled={!isPro} />
                      </div>
                    );
                  })}
                </div>

                {/* checklist */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-caption font-semibold">Action checklist</span>
                    <span className="text-caption tabular">{doneCount}/{incident.steps.length}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border-hairline)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${stepPct}%`, background: `rgb(${type.color})` }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {incident.steps.map(step => (
                      <label key={step.id} className="flex items-center gap-2 text-caption cursor-pointer">
                        <input type="checkbox" checked={step.done} onChange={() => toggleStep(incident.id, step.id)} />
                        <span style={{ textDecoration: step.done ? 'line-through' : 'none', color: step.done ? 'var(--text-tertiary)' : 'var(--text-secondary)', flex: 1 }}>{step.text}</span>
                        {step.custom && <button onClick={() => removeStep(incident.id, step.id)} className="press" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>}
                      </label>
                    ))}
                  </div>
                  {isPro && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        value={newStepText[incident.id] ?? ''}
                        onChange={e => setNewStepText(prev => ({ ...prev, [incident.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') addCustomStep(incident.id); }}
                        placeholder="Add a custom step…"
                        className="flex-1 rounded-lg px-2 py-1 text-caption bg-transparent outline-none"
                        style={{ border: '1px solid var(--border-hairline)' }}
                      />
                      <button onClick={() => addCustomStep(incident.id)} className="ios-card-nested press text-xs px-2.5 py-1.5">+ Add</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-7">
          <button
            onClick={addIncident}
            className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5"
            style={{ color: incidents.length < maxIncidents ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: incidents.length >= maxIncidents ? 0.5 : 1 }}
          >
            {atFreeLimit ? '🔒' : '+'} Add incident
          </button>
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
        </div>

        {/* Emergency contacts */}
        <div className="mb-7">
          <p className="text-footnote font-semibold mb-3">📞 Emergency contacts</p>
          <div className="flex flex-col gap-2">
            {CONTACTS.map(c => (
              <div key={c.name} className="ios-card-nested p-3 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-footnote font-bold">{c.name}</p>
                  <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{c.detail}</p>
                </div>
                <button onClick={() => handleCopyContact(c.copyValue)} className="ios-card-nested press text-xs px-2.5 py-1.5 flex-shrink-0">📋 Copy</button>
              </div>
            ))}
          </div>
        </div>

        {/* Free-tier banner */}
        {!isPro && (
          <div
            className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
            style={{
              border: atFreeLimit ? '1.5px solid rgba(var(--accent-orange), 0.4)' : '1px solid var(--border-hairline)',
              boxShadow: atFreeLimit ? '0 0 20px rgba(var(--accent-orange), 0.1)' : 'none',
            }}
          >
            <div>
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : `🔒 Free plan: ${FREE_MAX_INCIDENTS} incidents, fixed deadlines`}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_INCIDENTS} incidents, editable deadline windows, custom checklist steps, a self-assessed Risk Radar, and saving your tracker.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      <ToolCommentSection seedComments={FRAUD_RESPONSE_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
