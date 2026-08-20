// FILE: src/components/pro-tools/AmIPregnantTracker.tsx
'use client';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { CommentThread } from '@/components/community/CommentThread';
import { EmbedCodeButton } from '@/components/embeds/EmbedCodeButton';

const GLOW = '255, 138, 179'; // warm pink-coral
const DIAL_MIN = 21, DIAL_MAX = 35;
const START_DEG = -140, SWEEP_DEG = 280; // gap at bottom
const PRO_HISTORY_LIMIT = 30;

// Statistical hCG detectability curve — % chance of a positive test by day-past-ovulation (DPO).
// Approximate averages drawn from commonly-cited early-detection test research; not per-brand data.
const DPO_CURVE: { dpo: number; p: number }[] = [
  { dpo: -5, p: 0 }, { dpo: 0, p: 1 }, { dpo: 5, p: 2 }, { dpo: 7, p: 3 }, { dpo: 8, p: 6 },
  { dpo: 9, p: 10 }, { dpo: 10, p: 18 }, { dpo: 11, p: 28 }, { dpo: 12, p: 42 }, { dpo: 13, p: 58 },
  { dpo: 14, p: 74 }, { dpo: 15, p: 85 }, { dpo: 16, p: 91 }, { dpo: 17, p: 95 }, { dpo: 18, p: 97 },
  { dpo: 19, p: 98 }, { dpo: 20, p: 99 }, { dpo: 25, p: 99 },
];

const SYMPTOMS: { key: string; label: string; emoji: string; weight: number }[] = [
  { key: 'nausea',    label: 'Nausea',              emoji: '🤢', weight: 0.85 },
  { key: 'spotting',  label: 'Light spotting',      emoji: '🩸', weight: 0.75 },
  { key: 'tender',    label: 'Breast tenderness',   emoji: '💫', weight: 0.70 },
  { key: 'smell',     label: 'Smell sensitivity',   emoji: '👃', weight: 0.65 },
  { key: 'fatigue',   label: 'Fatigue',             emoji: '😴', weight: 0.60 },
  { key: 'aversion',  label: 'Food aversion',       emoji: '🍳', weight: 0.55 },
  { key: 'cramping',  label: 'Cramping',            emoji: '😖', weight: 0.40 },
  { key: 'moody',     label: 'Mood swings',         emoji: '🌗', weight: 0.35 },
];

interface CheckIn { date: string; dpo: number; symptoms: string[]; probability: number }

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

function detectionProbability(dpo: number): number {
  if (dpo <= DPO_CURVE[0].dpo) return DPO_CURVE[0].p;
  if (dpo >= DPO_CURVE[DPO_CURVE.length - 1].dpo) return DPO_CURVE[DPO_CURVE.length - 1].p;
  for (let i = 0; i < DPO_CURVE.length - 1; i++) {
    const a = DPO_CURVE[i], b = DPO_CURVE[i + 1];
    if (dpo >= a.dpo && dpo <= b.dpo) {
      const t = (dpo - a.dpo) / (b.dpo - a.dpo);
      return a.p + t * (b.p - a.p);
    }
  }
  return 0;
}

function zoneFor(p: number) {
  if (p < 20) return { label: 'Too early',  emoji: '🌑', color: '148, 148, 158' };
  if (p < 50) return { label: 'Possible',   emoji: '🌓', color: '255, 184, 108' };
  if (p < 85) return { label: 'Likely',     emoji: '🌔', color: GLOW };
  return           { label: 'Test now',   emoji: '🌕', color: '255, 214, 108' };
}

// ── Cycle-length drag dial ──────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function CycleDial({ value, onChange, glow }: { value: number; onChange: (v: number) => void; glow: string }) {
  const size = 148, cx = 74, cy = 74, r = 56;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const angleForValue = (v: number) => START_DEG + ((v - DIAL_MIN) / (DIAL_MAX - DIAL_MIN)) * SWEEP_DEG;
  const valueForAngle = (deg: number) => {
    const t = Math.max(0, Math.min(1, (deg - START_DEG) / SWEEP_DEG));
    return Math.round(DIAL_MIN + t * (DIAL_MAX - DIAL_MIN));
  };

  function angleFromPointer(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return START_DEG;
    const rect = svg.getBoundingClientRect();
    const scale = size / rect.width;
    const dx = (clientX - rect.left) * scale - cx;
    const dy = (clientY - rect.top) * scale - cy;
    let deg = Math.atan2(dx, -dy) * 180 / Math.PI;
    if (deg > 0 && deg >= (START_DEG + SWEEP_DEG) - 360 + 360 && deg <= 180) {
      // right-side gap
    }
    const end = START_DEG + SWEEP_DEG;
    if (deg > end - 360) { /* noop, handled below */ }
    // clamp into the visible arc, treating the bottom gap as a hard boundary
    if (deg >= 0) {
      if (deg > 180) deg -= 360;
    }
    if (deg > end) deg = end;
    if (deg < START_DEG) deg = START_DEG;
    return deg;
  }

  function handleMove(clientX: number, clientY: number) {
    const deg = angleFromPointer(clientX, clientY);
    onChange(valueForAngle(deg));
  }

  useEffect(() => {
    function move(e: PointerEvent) { if (dragging.current) handleMove(e.clientX, e.clientY); }
    function up() { dragging.current = false; }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, []);

  const knobDeg = angleForValue(value);
  const knob = polar(cx, cy, r, knobDeg);

  return (
    <div className="flex flex-col items-center">
      <svg
        ref={svgRef} width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={e => { dragging.current = true; handleMove(e.clientX, e.clientY); }}
      >
        <path d={arcPath(cx, cy, r, START_DEG, START_DEG + SWEEP_DEG)} fill="none" stroke="var(--border-hairline)" strokeWidth={10} strokeLinecap="round" />
        <path d={arcPath(cx, cy, r, START_DEG, knobDeg)} fill="none" stroke={`rgb(${glow})`} strokeWidth={10} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px rgba(${glow}, 0.5))` }} />
        <circle cx={knob.x} cy={knob.y} r={9} fill={`rgb(${glow})`} stroke="white" strokeWidth={2} style={{ cursor: 'grab' }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={26} fontWeight={800} fill={`rgb(${glow})`}>{value}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize={10} fill="var(--text-tertiary)">day cycle</text>
      </svg>
      <p className="text-caption mt-1" style={{ color: 'var(--text-tertiary)' }}>Drag the ring — most cycles run 21–35 days</p>
    </div>
  );
}

// ── Hormone Horizon wave ────────────────────────────────────────────────
function HormoneHorizon({ todayDpo, history, glow }: { todayDpo: number; history: CheckIn[]; glow: string }) {
  const minDpo = -3, maxDpo = 21;
  const W = 460, H = 150, PAD = 14;
  const xFor = (dpo: number) => PAD + ((dpo - minDpo) / (maxDpo - minDpo)) * (W - PAD * 2);
  const yFor = (p: number) => H - PAD - (p / 100) * (H - PAD * 2);

  const pts: { x: number; y: number }[] = [];
  for (let d = minDpo; d <= maxDpo; d += 0.5) pts.push({ x: xFor(d), y: yFor(detectionProbability(d)) });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${path} L ${xFor(maxDpo)},${H - PAD} L ${xFor(minDpo)},${H - PAD} Z`;

  const todayX = xFor(Math.max(minDpo, Math.min(maxDpo, todayDpo)));
  const todayY = yFor(detectionProbability(todayDpo));
  const thresholdY = yFor(85);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="hh-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${glow})`} stopOpacity={0.28} />
          <stop offset="100%" stopColor={`rgb(${glow})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={PAD} x2={W - PAD} y1={thresholdY} y2={thresholdY} stroke="rgb(255, 214, 108)" strokeDasharray="4 3" strokeWidth={1} opacity={0.55} />
      <text x={W - PAD} y={thresholdY - 4} fontSize={9} textAnchor="end" fill="rgb(255, 214, 108)">reliable zone</text>
      <path d={areaPath} fill="url(#hh-area)" />
      <path d={path} fill="none" stroke={`rgb(${glow})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Pro: trailing history dots */}
      {history.map(h => (
        <circle key={h.date} cx={xFor(h.dpo)} cy={yFor(h.probability)} r={3} fill={`rgb(${glow})`} opacity={0.45} />
      ))}

      {/* Today marker, breathing */}
      <circle cx={todayX} cy={todayY} r={7} fill={`rgb(${glow})`} stroke="white" strokeWidth={2} className="hh-pulse" />
      <text x={PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)">Ovulation</text>
      <text x={W - PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)" textAnchor="end">DPO {maxDpo}</text>
    </svg>
  );
}

// ── Symptom bubble cloud ────────────────────────────────────────────────
function SymptomBubbleCloud({ selected, onToggle, glow }: { selected: Set<string>; onToggle: (k: string) => void; glow: string }) {
  return (
    <div className="flex flex-wrap gap-2.5 justify-center">
      {SYMPTOMS.map(s => {
        const active = selected.has(s.key);
        const pad = 0.55 + s.weight * 0.4;
        return (
          <button
            key={s.key}
            onClick={() => onToggle(s.key)}
            className="press rounded-full font-semibold transition-all"
            style={{
              padding: `${pad}rem ${pad * 1.7}rem`,
              fontSize: `${0.78 + s.weight * 0.12}rem`,
              background: active ? `rgb(${glow})` : `rgba(${glow}, 0.08)`,
              color: active ? 'white' : `rgb(${glow})`,
              border: `1.5px solid rgba(${glow}, ${active ? 0.9 : 0.3})`,
              transform: active ? 'scale(1.06)' : 'scale(1)',
              boxShadow: active ? `0 6px 18px rgba(${glow}, 0.35)` : 'none',
            }}
          >
            <span className="mr-1">{s.emoji}</span>{s.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Probability needle gauge ────────────────────────────────────────────
function ProbabilityGauge({ percent, glow }: { percent: number; glow: string }) {
  const W = 220, H = 130, cx = 110, cy = 118, r = 90;
  const zones = [
    { from: -140, to: -70,  color: '148, 148, 158' },
    { from: -70,  to: 0,    color: '255, 184, 108' },
    { from: 0,    to: 70,   color: glow },
    { from: 70,   to: 140,  color: '255, 214, 108' },
  ];
  const needleDeg = -140 + (Math.max(0, Math.min(100, percent)) / 100) * 280;
  const tip = polar(cx, cy, r - 14, needleDeg);
  const zone = zoneFor(percent);

  return (
    <div className="flex flex-col items-center">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {zones.map((z, i) => (
          <path key={i} d={arcPath(cx, cy, r, z.from, z.to)} fill="none" stroke={`rgb(${z.color})`} strokeWidth={14} strokeLinecap="butt" opacity={0.85} />
        ))}
        <line x1={cx} y1={cy} x2={tip.x} y2={tip.y} stroke={`rgb(${glow})`} strokeWidth={3} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px rgba(${glow}, 0.6))`, transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <circle cx={cx} cy={cy} r={7} fill={`rgb(${glow})`} stroke="white" strokeWidth={2} />
      </svg>
      <p className="text-title2 font-bold tabular -mt-2" style={{ color: `rgb(${zone.color})` }}>{Math.round(percent)}%</p>
      <p className="text-footnote font-semibold flex items-center gap-1">{zone.emoji} {zone.label}</p>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────
export function AmIPregnantTracker() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const [lastPeriod, setLastPeriod] = useState(isoDay(new Date(Date.now() - 14 * 86400000)));
  const [cycleLength, setCycleLength] = useState(28);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifyOnTestDay, setNotifyOnTestDay] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(63);

  // Pro: restore saved streak on load.
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/am-i-pregnant-tracker')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setLastPeriod(data.config.lastPeriod ? String(data.config.lastPeriod).slice(0, 10) : lastPeriod);
          setCycleLength(data.config.cycleLength ?? 28);
          setHistory(data.config.history ?? []);
          setNotifyOnTestDay(!!data.config.notifyOnTestDay);
          if (data.config.shareLink) setShareLink(data.config.shareLink);
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const ovulationDate = useMemo(() => {
    const start = new Date(lastPeriod + 'T00:00:00');
    return new Date(start.getTime() + (cycleLength - 14) * 86400000);
  }, [lastPeriod, cycleLength]);

  const todayDpo = useMemo(() => daysBetween(ovulationDate, new Date()), [ovulationDate]);

  const symptomBonus = useMemo(() => {
    const sum = Array.from(selectedSymptoms).reduce((s, k) => s + (SYMPTOMS.find(x => x.key === k)?.weight ?? 0), 0);
    return Math.min(18, sum * 6);
  }, [selectedSymptoms]);

  const probability = Math.min(99, Math.max(0, detectionProbability(todayDpo) + symptomBonus));

  const testReadyDate = useMemo(() => new Date(ovulationDate.getTime() + 15 * 86400000).toISOString(), [ovulationDate]);
  const testReady = todayDpo >= 15;

  const countdown = useCountdown(testReady ? null : testReadyDate);

  function toggleSymptom(key: string) {
    setSelectedSymptoms(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleCheckIn() {
    if (!isPro) { showToast('Upgrade to Pro to save your daily check-ins', '⭐'); return; }
    setSaving(true);
    try {
      const entry: CheckIn = { date: isoDay(new Date()), dpo: todayDpo, symptoms: Array.from(selectedSymptoms), probability };
      const nextHistory = [...history.filter(h => h.date !== entry.date), entry].slice(-PRO_HISTORY_LIMIT);
      const res = await fetch('/api/tools/am-i-pregnant-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPeriod, cycleLength, history: nextHistory, notifyOnTestDay }),
      });
      if (!res.ok) throw new Error('save failed');
      setHistory(nextHistory);
      showToast('Today\'s check-in saved to your streak', '📌');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleNotify() {
    if (!isPro) { showToast('Upgrade to Pro for test-day reminders', '⭐'); return; }
    const next = !notifyOnTestDay;
    setNotifyOnTestDay(next);
    try {
      const res = await fetch('/api/tools/am-i-pregnant-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPeriod, cycleLength, history, notifyOnTestDay: next, shareLink }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast(next ? 'You will be notified when a test is reliable' : 'Reminder turned off', next ? '🔔' : '🔕');
    } catch {
      setNotifyOnTestDay(!next);
      showToast('Could not save — try again', '⚠️');
    }
  }

  async function handleGenerateShareLink() {
    if (!isPro) { showToast('Upgrade to Pro to share Bump Watch', '⭐'); return; }
    const token = shareLink ?? Math.random().toString(36).slice(2, 10);
    const fullUrl = `${window.location.origin}/tools/am-i-pregnant-probability-tracker/watch/${token}`;
    try {
      const res = await fetch('/api/tools/am-i-pregnant-tracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPeriod, cycleLength, history, notifyOnTestDay, shareLink: token }),
      });
      if (!res.ok) throw new Error('save failed');
      setShareLink(token);
      await navigator.clipboard.writeText(fullUrl);
      showToast('Bump Watch link copied!', '🔗');
    } catch {
      showToast('Could not create link — try again', '⚠️');
    }
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
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const zone = zoneFor(probability);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>FAMILY</p>
            <h2 className="text-title2">Am I Pregnant? Probability Tracker</h2>
          </div>
          <button
            onClick={handleCheckIn}
            disabled={saving}
            className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
            style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
            title={isPro ? 'Save today\'s check-in to your streak' : 'Upgrade to save your daily streak'}
          >
            {isPro ? '📌' : '🔒'} {saving ? 'Saving…' : 'Check in'}
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center mb-6">
          <div>
            <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>First day of last period</label>
            <input
              type="date" value={lastPeriod}
              onChange={e => setLastPeriod(e.target.value)}
              className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none"
            />
            <p className="text-caption mt-3" style={{ color: 'var(--text-tertiary)' }}>
              Estimated ovulation: <span className="font-semibold" style={{ color: `rgb(${GLOW})` }}>{ovulationDate.toLocaleDateString()}</span>
            </p>
            <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
              You're roughly <span className="font-semibold" style={{ color: `rgb(${GLOW})` }}>{Math.max(0, todayDpo)} days</span> past ovulation.
            </p>
          </div>
          <div className="flex justify-center">
            <CycleDial value={cycleLength} onChange={setCycleLength} glow={GLOW} />
          </div>
        </div>

        {/* Hormone Horizon */}
        <div className="ios-card-nested p-4 mb-6">
          <p className="text-footnote font-semibold mb-2">Hormone Horizon — detection odds by day</p>
          <HormoneHorizon todayDpo={todayDpo} history={isPro ? history : []} glow={GLOW} />
          {!isPro && (
            <p className="text-caption text-center mt-2" style={{ color: 'var(--text-tertiary)' }}>
              🔒 Only today shows. <button onClick={handleCheckIn} className="underline font-semibold" style={{ color: `rgb(${GLOW})` }}>Go Pro</button> to build a real trailing history.
            </p>
          )}
        </div>

        {/* Gauge + countdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          <div className="ios-card-nested p-5 flex items-center justify-center">
            <ProbabilityGauge percent={probability} glow={GLOW} />
          </div>
          <div className="ios-card-nested p-5 flex flex-col items-center justify-center text-center">
            <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              {testReady ? 'A TEST IS STATISTICALLY RELIABLE NOW' : 'TIME UNTIL A RELIABLE TEST'}
            </p>
            {testReady ? (
              <span className="text-largetitle" style={{ color: `rgb(${GLOW})` }}>🌕</span>
            ) : (
              <div className="flex items-center justify-center gap-2">
                {[{ v: countdown.days, l: 'd' }, { v: countdown.hours, l: 'h' }, { v: countdown.minutes, l: 'm' }].map(u => (
                  <div key={u.l} className="ios-card-nested px-2.5 py-1.5 text-center min-w-[48px]">
                    <div className="text-headline font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{u.v}</div>
                    <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{u.l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Symptom bubbles */}
        <div className="mb-6">
          <p className="text-footnote font-semibold mb-3 text-center">
            How are you feeling today? {!isPro && <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>(logged today only — Pro saves the trend)</span>}
          </p>
          <SymptomBubbleCloud selected={selectedSymptoms} onToggle={toggleSymptom} glow={GLOW} />
        </div>

        {/* Notify + Bump Watch share (Pro) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleToggleNotify}
            className="ios-card-nested press flex items-center gap-2.5 p-3 text-left"
            style={{ opacity: isPro ? 1 : 0.55 }}
          >
            <span className="text-base flex-shrink-0">{isPro ? (notifyOnTestDay ? '🔔' : '🔕') : '🔒'}</span>
            <span className="text-footnote flex-1">Notify me the day a test is reliable</span>
          </button>
          <button onClick={handleGenerateShareLink} className="ios-card-nested press flex items-center gap-2.5 p-3 text-left" style={{ opacity: isPro ? 1 : 0.55 }}>
            <span className="text-base flex-shrink-0">{isPro ? '🔗' : '🔒'}</span>
            <span className="text-footnote flex-1">{shareLink ? 'Copy Bump Watch link again' : 'Generate a Bump Watch link'}</span>
          </button>
        </div>

        {!isPro && (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: today only, no saved streak</p>
              <p className="text-caption">Upgrade to build a real history, get test-day reminders, and share Bump Watch.</p>
            </div>
            <button onClick={handleCheckIn} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $9.99/mo</button>
          </div>
        )}

        <div className="ios-card-nested p-4 mb-2 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            This estimates statistical detection odds for a typical cycle, adjusted informally by self-reported symptoms — it cannot confirm or rule out pregnancy for any individual. Only an actual test, and if needed a clinician, can do that.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>🔗 <span className="text-footnote font-semibold">Share</span></button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>💬 <span className="text-footnote font-semibold">Comment</span></button>
        </div>
      </div>

      <div className="flex justify-center mt-4 mb-4">
        <EmbedCodeButton slug="am-i-pregnant-probability-tracker" title="Am I Pregnant? Probability Tracker" glow={GLOW} />
      </div>

      <CommentThread subjectType="tool" subjectId="am-i-pregnant-probability-tracker" glow={GLOW} />
      <ToastHost toast={toast} />

      <style dangerouslySetInnerHTML={{ __html: `
        .hh-pulse { animation: hhPulse 1.8s ease-in-out infinite; }
        @keyframes hhPulse {
          0%, 100% { r: 7; filter: drop-shadow(0 0 3px rgba(${GLOW}, 0.6)); }
          50% { r: 9; filter: drop-shadow(0 0 8px rgba(${GLOW}, 0.9)); }
        }
        @media (prefers-reduced-motion: reduce) { .hh-pulse { animation: none; } }
      `}} />
    </div>
  );
}

// ── Ticking countdown hook (same pattern as Life Expectancy Calculator) ──
function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetIso) { setParts({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
    const target = new Date(targetIso).getTime();
    function tick() {
      const msLeft = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(msLeft / 86400000),
        hours: Math.floor((msLeft % 86400000) / 3600000),
        minutes: Math.floor((msLeft % 3600000) / 60000),
        seconds: Math.floor((msLeft % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}