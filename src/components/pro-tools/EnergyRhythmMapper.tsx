// FILE: src/components/pro-tools/EnergyRhythmMapper.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { ENERGY_RHYTHM_COMMENTS } from './energyRhythmComments';

interface EnergyPoint { hour: number; value: number }
interface RhythmEntry { date: string; points: EnergyPoint[] }

const GLOW = '255, 138, 101';
const ZONE_COLORS = { focus: '88, 214, 113', light: '255, 159, 10', rest: '129, 178, 255' } as const;
const ZONE_LABEL = { focus: 'Deep Focus (75-100)', light: 'Light Tasks (40-74)', rest: 'Rest & Recharge (0-39)' } as const;

const FREE_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];
const PRO_HOURS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const HEATMAP_HOURS = PRO_HOURS;
const FREE_SNAP = 10;
const PRO_SNAP = 2;

const CHART_W = 400;
const CHART_H = 220;
const PLOT_TOP = 14;
const PLOT_BOTTOM = 190;

const PRESET_POST_LUNCH: EnergyPoint[] = [
  { hour: 0, value: 15 }, { hour: 3, value: 10 }, { hour: 6, value: 25 }, { hour: 8, value: 55 },
  { hour: 10, value: 80 }, { hour: 12, value: 85 }, { hour: 14, value: 60 }, { hour: 16, value: 70 },
  { hour: 18, value: 60 }, { hour: 20, value: 45 }, { hour: 22, value: 25 },
];
const PRESET_EARLY_BIRD: EnergyPoint[] = [
  { hour: 0, value: 20 }, { hour: 5, value: 35 }, { hour: 7, value: 75 }, { hour: 9, value: 90 },
  { hour: 12, value: 70 }, { hour: 15, value: 50 }, { hour: 18, value: 35 }, { hour: 21, value: 20 },
];
const PRESET_NIGHT_OWL: EnergyPoint[] = [
  { hour: 0, value: 55 }, { hour: 3, value: 35 }, { hour: 6, value: 20 }, { hour: 9, value: 30 },
  { hour: 12, value: 50 }, { hour: 15, value: 60 }, { hour: 18, value: 75 }, { hour: 21, value: 90 },
];
const PRESET_STEADY: EnergyPoint[] = [
  { hour: 0, value: 48 }, { hour: 6, value: 52 }, { hour: 12, value: 60 }, { hour: 18, value: 58 }, { hour: 21, value: 50 },
];
const PRESETS = [
  { key: 'earlyBird',    label: 'Early Bird',       emoji: '🌅', anchors: PRESET_EARLY_BIRD },
  { key: 'nightOwl',     label: 'Night Owl',        emoji: '🦉', anchors: PRESET_NIGHT_OWL },
  { key: 'postLunchDip', label: 'Post-Lunch Dip',   emoji: '🍽️', anchors: PRESET_POST_LUNCH },
  { key: 'steady',       label: 'Steady & Balanced', emoji: '🌊', anchors: PRESET_STEADY },
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
function resample(anchors: EnergyPoint[], hours: number[]): EnergyPoint[] {
  return hours.map(h => ({ hour: h, value: Math.round(interpolateAt(anchors, h)) }));
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
function detectCrashes(points: EnergyPoint[]): { from: number; to: number; drop: number }[] {
  const sorted = [...points].sort((a, b) => a.hour - b.hour);
  const out: { from: number; to: number; drop: number }[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i], b = sorted[i + 1];
    if (a.value - b.value >= 35 && (b.hour - a.hour) <= 3) out.push({ from: a.hour, to: b.hour, drop: a.value - b.value });
  }
  return out;
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
function isoDate(d: Date): string { return d.toISOString().slice(0, 10); }
function startOfToday(): Date { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
function computeStreak(history: RhythmEntry[]): number {
  const set = new Set(history.map(h => h.date));
  let cursor = startOfToday();
  if (!set.has(isoDate(cursor))) cursor = new Date(cursor.getTime() - 86400000);
  let streak = 0;
  while (set.has(isoDate(cursor))) { streak++; cursor = new Date(cursor.getTime() - 86400000); }
  return streak;
}
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.round((startOfToday().getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
function defaultPointsFor(isPro: boolean): EnergyPoint[] {
  return resample(PRESET_POST_LUNCH, isPro ? PRO_HOURS : FREE_HOURS);
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

function HeatmapRow({ entry, streakActive }: { entry: RhythmEntry; streakActive?: boolean }) {
  const avg = Math.round(averageEnergy(entry.points));
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption font-semibold flex-shrink-0" style={{ width: 56 }}>{dayLabel(entry.date)}</span>
      <div className="flex-1 flex gap-0.5 rounded-lg overflow-hidden">
        {HEATMAP_HOURS.map(h => {
          const v = interpolateAt(entry.points, h);
          const zone = getZone(v);
          return <div key={h} style={{ flex: 1, height: 20, background: `rgba(${ZONE_COLORS[zone]}, ${0.25 + (v / 100) * 0.65})` }} />;
        })}
      </div>
      <span className="text-caption font-bold tabular flex-shrink-0" style={{ width: 32, textAlign: 'right', color: `rgb(${GLOW})` }}>{avg}%</span>
    </div>
  );
}

export function EnergyRhythmMapper() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const HOURS = isPro ? PRO_HOURS : FREE_HOURS;
  const snapPercent = isPro ? PRO_SNAP : FREE_SNAP;

  const [points, setPoints] = useState<EnergyPoint[]>(() => defaultPointsFor(false));
  const [history, setHistory] = useState<RhythmEntry[]>([]);
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);
  const [highlightWindow, setHighlightWindow] = useState<{ start: number; end: number } | null>(null);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(45);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragHour = useRef<number | null>(null);

  useEffect(() => {
    const expected = HOURS.join(',');
    const current = points.map(p => p.hour).sort((a, b) => a - b).join(',');
    if (current !== expected) setPoints(defaultPointsFor(isPro));
  }, [isPro]);

  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/energy-rhythm-mapper')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          if (Array.isArray(data.config.points) && data.config.points.length === PRO_HOURS.length) setPoints(data.config.points);
          if (Array.isArray(data.config.history)) setHistory(data.config.history.slice(0, 30));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.hour - b.hour), [points]);
  const rhythmScore = useMemo(() => Math.round(averageEnergy(sortedPoints)), [sortedPoints]);
  const peak = useMemo(() => sortedPoints.reduce((m, p) => (p.value > m.value ? p : m), sortedPoints[0]), [sortedPoints]);
  const dip = useMemo(() => sortedPoints.reduce((m, p) => (p.value < m.value ? p : m), sortedPoints[0]), [sortedPoints]);
  const flowWindows = useMemo(() => computeAboveThresholdWindows(sortedPoints, 75), [sortedPoints]);
  const flowWindow = useMemo(
    () => (flowWindows.length ? flowWindows.reduce((m, w) => (w.end - w.start > m.end - m.start ? w : m)) : null),
    [flowWindows]
  );
  const crashes = useMemo(() => detectCrashes(sortedPoints), [sortedPoints]);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [rhythmScore]);

  const health: 'vibrant' | 'balanced' | 'low' | 'crash' =
    crashes.length > 0 ? 'crash' : rhythmScore >= 70 ? 'vibrant' : rhythmScore >= 50 ? 'balanced' : 'low';
  const healthLabel = {
    vibrant: '🔆 Vibrant day',
    balanced: '⚖️ Balanced day',
    low: '🪫 Low-energy day',
    crash: `⚠️ Energy crash near ${formatHour(crashes[0]?.from ?? 0)}`,
  }[health];
  const healthColor = { vibrant: '52, 199, 89', balanced: '255, 159, 10', low: '129, 178, 255', crash: '255, 69, 58' }[health];

  const streak = useMemo(() => computeStreak(history), [history]);
  const weeklyAvg = useMemo(
    () => (history.length ? Math.round(history.slice(0, 7).reduce((a, h) => a + averageEnergy(h.points), 0) / Math.min(7, history.length)) : null),
    [history]
  );

  // ---- drag to reshape curve ----
  function valueAtClientY(clientY: number): number {
    if (!svgRef.current) return 0;
    const rect = svgRef.current.getBoundingClientRect();
    const internalY = ((clientY - rect.top) / rect.height) * CHART_H;
    const raw = ((PLOT_BOTTOM - internalY) / (PLOT_BOTTOM - PLOT_TOP)) * 100;
    const clamped = Math.max(0, Math.min(100, raw));
    return Math.round(clamped / snapPercent) * snapPercent;
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
  }, [snapPercent]);

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

  function applyPreset(preset: typeof PRESETS[number]) {
    setPoints(resample(preset.anchors, HOURS));
    showToast(`Loaded ${preset.label} rhythm — drag to make it yours`, preset.emoji);
  }

  function suggestFlowWindow() {
    if (!flowWindow || flowWindow.end - flowWindow.start < 0.2) {
      showToast('No sustained high-energy window found — try raising a stretch above 75%', 'ℹ️');
      return;
    }
    setHighlightWindow(flowWindow);
    showToast(`Flow window: ${formatHour(flowWindow.start)}–${formatHour(flowWindow.end)} (${(flowWindow.end - flowWindow.start).toFixed(1)}h)`, '🧠');
    setTimeout(() => setHighlightWindow(null), 3000);
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save & start your streak', '⭐'); return; }
    setSavingConfig(true);
    try {
      const today = isoDate(startOfToday());
      const withoutToday = history.filter(h => h.date !== today);
      const nextHistory = [{ date: today, points }, ...withoutToday].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
      const res = await fetch('/api/tools/energy-rhythm-mapper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points, history: nextHistory }),
      });
      if (!res.ok) throw new Error('save failed');
      setHistory(nextHistory);
      showToast("Today's rhythm logged!", '🔥');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }
  function handleReset() {
    setPoints(defaultPointsFor(isPro));
    setHighlightWindow(null);
    showToast('Reset to default rhythm', '↺');
  }
  function requireAuth() { showToast('You need to sign up first', '🔒'); }
  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => (prev ? c - 1 : c + 1)); return !prev; });
  }
  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!', '🔗')).catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCopyRhythm() {
    const lines = [
      `Rhythm Score: ${rhythmScore}%`,
      `Peak: ${Math.round(peak.value)}% at ${formatHour(peak.hour)}  ·  Dip: ${Math.round(dip.value)}% at ${formatHour(dip.hour)}`,
      flowWindow ? `Flow window: ${formatHour(flowWindow.start)}–${formatHour(flowWindow.end)}` : 'No sustained flow window',
      ...(isPro && streak > 0 ? [`Current streak: ${streak} day${streak === 1 ? '' : 's'}`] : []),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Rhythm copied!', '📋')).catch(() => showToast('Could not copy', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const pathPoints = [...sortedPoints.map(p => ({ x: hourToX(p.hour), y: valueToY(p.value) })), { x: CHART_W, y: valueToY(sortedPoints[0].value) }];
  const linePath = buildSmoothPath(pathPoints);
  const areaPath = `${linePath} L${CHART_W},${PLOT_BOTTOM} L${pathPoints[0].x},${PLOT_BOTTOM} Z`;

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>HEALTH & WELLNESS</p>
            <h2 className="text-title2">Energy Rhythm Mapper</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>↺ Reset</button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? "Log today's rhythm and update your streak" : 'Upgrade to log & start a streak'}
            >
              {isPro ? '🔥' : '🔒'} {savingConfig ? 'Logging…' : 'Log today'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>{healthLabel}</div>
          </div>
        </div>

        <div className="ios-card-nested p-5 mb-6 flex items-center justify-between flex-wrap gap-4" style={{ background: `rgba(${GLOW}, 0.06)` }}>
          <div>
            <p className="text-caption mb-1">RHYTHM SCORE</p>
            <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>Your average energy across the whole day.</p>
          </div>
          <div className="text-largetitle tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${rhythmScore >= 70 ? '52, 199, 89' : rhythmScore >= 50 ? GLOW : '129, 178, 255'})` }}>
            {rhythmScore}%
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Peak energy', value: `${Math.round(peak.value)}% · ${formatHour(peak.hour)}` },
            { label: 'Lowest dip', value: `${Math.round(dip.value)}% · ${formatHour(dip.hour)}` },
            { label: 'Flow window', value: flowWindow && flowWindow.end - flowWindow.start >= 0.2 ? `${(flowWindow.end - flowWindow.start).toFixed(1)}h` : '—' },
            { label: 'Energy swing', value: `${Math.round(peak.value - dip.value)} pts` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>{stat.value}</div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-footnote font-semibold mb-2">Or start from a chronotype</p>
          <div className="flex gap-2 flex-wrap">
            {PRESETS.map(p => (
              <button key={p.key} onClick={() => applyPreset(p)} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
        </div>

        {crashes.length > 0 && (
          <div className="flex flex-col gap-2 mb-6">
            {crashes.map((c, i) => (
              <div key={i} className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
                <span className="text-lg flex-shrink-0">⚠️</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  Sudden dip between <strong>{formatHour(c.from)}</strong> and <strong>{formatHour(c.to)}</strong> — consider a break, snack, or short walk around then.
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Curve chart */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Drag any point up or down to reshape your day</p>
            <p className="text-caption">{snapPercent}% snap</p>
          </div>
          <div style={{ width: '100%', aspectRatio: `${CHART_W} / ${CHART_H}`, position: 'relative' }}>
            <svg ref={svgRef} viewBox={`0 0 ${CHART_W} ${CHART_H}`} width="100%" height="100%" preserveAspectRatio="none" style={{ touchAction: 'none', overflow: 'visible' }}>
              <defs>
                <linearGradient id="rhythmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`rgb(${GLOW})`} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={`rgb(${GLOW})`} stopOpacity="0" />
                </linearGradient>
              </defs>

              <rect x={0} y={PLOT_TOP} width={CHART_W} height={valueToY(75) - PLOT_TOP} fill={`rgb(${ZONE_COLORS.focus})`} opacity={0.07} />
              <rect x={0} y={valueToY(75)} width={CHART_W} height={valueToY(40) - valueToY(75)} fill={`rgb(${ZONE_COLORS.light})`} opacity={0.07} />
              <rect x={0} y={valueToY(40)} width={CHART_W} height={PLOT_BOTTOM - valueToY(40)} fill={`rgb(${ZONE_COLORS.rest})`} opacity={0.07} />

              {[0, 6, 12, 18, 24].map(h => (
                <line key={h} x1={hourToX(h)} x2={hourToX(h)} y1={PLOT_TOP} y2={PLOT_BOTTOM} stroke="var(--border-hairline)" strokeWidth={1} opacity={0.5} />
              ))}

              {highlightWindow && (
                <rect x={hourToX(highlightWindow.start)} y={PLOT_TOP} width={hourToX(highlightWindow.end) - hourToX(highlightWindow.start)} height={PLOT_BOTTOM - PLOT_TOP} fill={`rgb(${GLOW})`} opacity={0.18} className="anim-fade-up" />
              )}

              <path d={areaPath} fill="url(#rhythmFill)" className="transition-all duration-150" />
              <path d={linePath} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-150" />

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
                    <circle cx={x} cy={y} r={6} fill={`rgb(${ZONE_COLORS[zone]})`} stroke="white" strokeWidth={2} style={{ pointerEvents: 'none' }} />
                  </g>
                );
              })}

              {[0, 6, 12, 18, 24].map(h => (
                <text key={h} x={hourToX(h)} y={208} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">
                  {h === 0 || h === 24 ? '12AM' : h === 6 ? '6AM' : h === 12 ? '12PM' : '6PM'}
                </text>
              ))}
            </svg>

            {hoveredHour !== null && (() => {
              const p = sortedPoints.find(pt => pt.hour === hoveredHour);
              if (!p) return null;
              const zone = getZone(p.value);
              const leftPct = (hourToX(p.hour) / CHART_W) * 100;
              const topPct = (valueToY(p.value) / CHART_H) * 100;
              return (
                <div className="absolute z-30 pointer-events-none anim-fade-up" style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: 'translate(-50%, -120%)', width: 170 }}>
                  <div className="ios-card-nested p-3" style={{ boxShadow: '0 10px 28px rgba(0,0,0,0.4)', border: `1.5px solid rgb(${ZONE_COLORS[zone]})` }}>
                    <p className="text-footnote font-bold mb-0.5" style={{ color: `rgb(${ZONE_COLORS[zone]})` }}>{formatHour(p.hour)}</p>
                    <p className="text-title3 tabular mb-0.5">{Math.round(p.value)}%</p>
                    <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{ZONE_LABEL[zone]}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex flex-wrap gap-3">
            {(Object.keys(ZONE_COLORS) as (keyof typeof ZONE_COLORS)[]).map(z => (
              <span key={z} className="flex items-center gap-1.5 text-caption">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `rgb(${ZONE_COLORS[z]})` }} />
                {ZONE_LABEL[z]}
              </span>
            ))}
          </div>
          <button onClick={suggestFlowWindow} className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
            🧠 Suggest my Deep Work window
          </button>
        </div>

        {/* Rhythm History */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-footnote font-semibold">Rhythm History</p>
            {isPro && streak > 0 && <span className="pill text-[10px]" style={{ background: `rgba(${GLOW}, 0.15)`, color: `rgb(${GLOW})` }}>🔥 {streak}-day streak</span>}
          </div>
          {isPro ? (
            history.length > 0 ? (
              <div className="ios-card-nested p-3 flex flex-col gap-2">
                {history.slice(0, 7).map(entry => <HeatmapRow key={entry.date} entry={entry} />)}
                {weeklyAvg !== null && (
                  <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>Weekly average: <strong style={{ color: `rgb(${GLOW})` }}>{weeklyAvg}%</strong></p>
                )}
              </div>
            ) : (
              <div className="ios-card-nested p-6 text-center">
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Tap "Log today" to start your history and streak.</p>
              </div>
            )
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none ios-card-nested p-3 flex flex-col gap-2" style={{ filter: 'blur(3px)', opacity: 0.55 }}>
                <HeatmapRow entry={{ date: isoDate(new Date(Date.now() - 0)), points: PRESET_POST_LUNCH }} />
                <HeatmapRow entry={{ date: isoDate(new Date(Date.now() - 86400000)), points: PRESET_EARLY_BIRD }} />
                <HeatmapRow entry={{ date: isoDate(new Date(Date.now() - 2 * 86400000)), points: PRESET_STEADY }} />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center p-4">
                <span className="text-2xl">🔒</span>
                <p className="text-footnote font-bold">Start your Rhythm History & streak</p>
                <p className="text-caption max-w-xs">Upgrade to log each day, build a streak, and see your week at a glance.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end mb-6">
          <button onClick={handleCopyRhythm} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy rhythm</button>
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: 8 points, 10% snap</p>
              <p className="text-caption">Upgrade to Premium for 12-point resolution, 2% precision, daily logging, streaks, and your 7-day heatmap.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <ToolCommentSection seedComments={ENERGY_RHYTHM_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      <ToastHost toast={toast} />
    </div>
  );
}
