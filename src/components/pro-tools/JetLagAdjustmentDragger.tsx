// FILE: src/components/pro-tools/JetLagAdjustmentDragger.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { JETLAG_COMMENTS } from './jetlagComments';

type Ring = 'home' | 'dest' | null;
type Direction = 'advance' | 'delay' | 'none';

const GLOW = '64, 201, 196';
const HOME_RING_COLOR = '196, 132, 252';
const DEST_RING_COLOR = '255, 122, 165';
const ADVANCE_COLOR = '100, 200, 255';
const DELAY_COLOR = '255, 159, 10';

const RATE_ADVANCE = 60;  // minutes/day the clock can safely advance (earlier)
const RATE_DELAY = 90;    // minutes/day the clock can safely delay (later)

const FREE_MAX_PREP_DAYS = 5;
const PRO_MAX_PREP_DAYS = 14;
const FREE_SNAP_MINUTES = 30;
const PRO_SNAP_MINUTES = 5;

const DEFAULT_HOME_BEDTIME = 23 * 60;        // 11:00 PM
const DEFAULT_DEST_BEDTIME = 21 * 60 + 30;   // 9:30 PM
const DEFAULT_PREP_DAYS = 4;

const R_OUTER = 120;
const R_INNER = 85;
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

export function JetLagAdjustmentDragger() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const maxPrepDays = isPro ? PRO_MAX_PREP_DAYS : FREE_MAX_PREP_DAYS;
  const snapMinutes = isPro ? PRO_SNAP_MINUTES : FREE_SNAP_MINUTES;

  const [homeBedtime, setHomeBedtime] = useState(DEFAULT_HOME_BEDTIME);
  const [destBedtime, setDestBedtime] = useState(DEFAULT_DEST_BEDTIME);
  const [prepDays, setPrepDays] = useState(DEFAULT_PREP_DAYS);
  const [draggingRing, setDraggingRing] = useState<Ring>(null);
  const [pulse, setPulse] = useState(false);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(37);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const ringRef = useRef<HTMLDivElement>(null);

  // Clamp on mount and whenever tier changes
  useEffect(() => {
    setPrepDays(prev => Math.min(prev, maxPrepDays));
  }, [maxPrepDays]);

  // Load saved config for Pro users on mount
  useEffect(() => {
    if (!isPro || configLoaded) return;
    fetch('/api/tools/jetlag-adjustment-dragger')
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setHomeBedtime(data.config.homeBedtime);
          setDestBedtime(data.config.destBedtime);
          setPrepDays(Math.min(data.config.prepDays, PRO_MAX_PREP_DAYS));
        }
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, [isPro, configLoaded]);

  const diffForward = useMemo(() => angularForward(homeBedtime, destBedtime), [homeBedtime, destBedtime]);
  const diffBackward = 1440 - diffForward;
  const direction: Direction = diffForward === 0 ? 'none' : diffBackward <= diffForward ? 'advance' : 'delay';
  const shiftMinutes = direction === 'advance' ? diffBackward : direction === 'delay' ? diffForward : 0;
  const rate = direction === 'advance' ? RATE_ADVANCE : RATE_DELAY;
  const daysNeeded = shiftMinutes === 0 ? 0 : Math.ceil(shiftMinutes / rate);
  const directionColor = direction === 'advance' ? ADVANCE_COLOR : direction === 'delay' ? DELAY_COLOR : GLOW;

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 200);
    return () => clearTimeout(t);
  }, [shiftMinutes, direction]);

  const health: 'aligned' | 'safe' | 'tight' | 'danger' =
    daysNeeded === 0 ? 'aligned' : daysNeeded <= prepDays ? 'safe' : prepDays === 0 ? 'danger' : 'tight';
  const healthLabel = {
    aligned: '✅ Already aligned',
    safe: '✅ Fully adjusted before departure',
    tight: '⚠️ Partial adjustment only',
    danger: '🚨 No prep time scheduled',
  }[health];
  const healthColor = { aligned: '52, 199, 89', safe: '52, 199, 89', tight: '255, 159, 10', danger: '255, 69, 58' }[health];

  const shownSteps = Math.min(daysNeeded, prepDays);
  const schedule = useMemo(() => {
    const rows: { daysBefore: number; bedtime: number }[] = [];
    for (let j = 0; j <= shownSteps; j++) {
      const applied = Math.min(j * rate, shiftMinutes);
      const bedtime = direction === 'advance'
        ? (((homeBedtime - applied) % 1440) + 1440) % 1440
        : (((homeBedtime + applied) % 1440) + 1440) % 1440;
      rows.push({ daysBefore: shownSteps - j, bedtime });
    }
    return rows;
  }, [shownSteps, rate, direction, homeBedtime, shiftMinutes]);

  const partialShiftRemaining = Math.max(0, shiftMinutes - shownSteps * rate);
  const atFreeLimit = !isPro && (prepDays >= FREE_MAX_PREP_DAYS || daysNeeded > FREE_MAX_PREP_DAYS);

  // ---- ring drag ----
  const handleRingPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!draggingRing || !ringRef.current) return;
    const rect = ringRef.current.getBoundingClientRect();
    const minutes = clientPointToMinutes(clientX, clientY, rect, snapMinutes);
    if (draggingRing === 'home') setHomeBedtime(minutes);
    else setDestBedtime(minutes);
  }, [draggingRing, snapMinutes]);

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

  function adjustPrepDays(delta: number) {
    const next = prepDays + delta;
    if (next < 0) return;
    if (!isPro && next > FREE_MAX_PREP_DAYS) {
      showToast(`Upgrade to Pro to prep more than ${FREE_MAX_PREP_DAYS} days out`, '⭐');
      return;
    }
    setPrepDays(Math.min(next, maxPrepDays));
  }

  async function handleSaveConfig() {
    if (!isPro) { showToast('Upgrade to save your setup', '⭐'); return; }
    setSavingConfig(true);
    try {
      const res = await fetch('/api/tools/jetlag-adjustment-dragger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeBedtime, destBedtime, prepDays }),
      });
      if (!res.ok) throw new Error('save failed');
      showToast('Setup saved!', '💾');
    } catch {
      showToast('Could not save — try again', '⚠️');
    } finally {
      setSavingConfig(false);
    }
  }

  function handleReset() {
    setHomeBedtime(DEFAULT_HOME_BEDTIME);
    setDestBedtime(DEFAULT_DEST_BEDTIME);
    setPrepDays(DEFAULT_PREP_DAYS);
    showToast('Reset to defaults', '↺');
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  function handleLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => {
      setToolLikeCount(c => prev ? c - 1 : c + 1);
      return !prev;
    });
  }

  function handleShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }

  function handleCopySchedule() {
    const lines = [
      direction === 'none'
        ? 'No timezone shift needed'
        : `${direction === 'advance' ? 'Advance' : 'Delay'} bedtime by ${formatDuration(shiftMinutes)}`,
      `Home bedtime: ${formatTime(homeBedtime)}  →  Destination bedtime: ${formatTime(destBedtime)}`,
      ...schedule.map(row => `${row.daysBefore === 0 ? 'Departure day' : `Day -${row.daysBefore}`}: ${formatTime(row.bedtime)}`),
    ];
    if (partialShiftRemaining > 0) lines.push(`Remaining after arrival: ${formatDuration(Math.round(partialShiftRemaining))}`);
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => showToast('Schedule copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const homePoint = pointOnCircle(150, 150, R_OUTER, angleForMinutes(homeBedtime));
  const destPoint = pointOnCircle(150, 150, R_INNER, angleForMinutes(destBedtime));
  const homeProgress = homeBedtime / 1440;
  const destProgress = destBedtime / 1440;

  const tip = direction === 'advance'
    ? '🌅 To advance your clock: get bright light soon after waking and dim screens/lights in the evening.'
    : direction === 'delay'
      ? '🌇 To delay your clock: seek evening light and avoid bright light first thing in the morning.'
      : "🎉 No shift needed — your bedtime is already aligned with your destination.";

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>JET-LAG ADJUSTMENT DRAGGER</p>
            <h2 className="text-title2">Sleep-Shift Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleReset} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
              ↺ Reset
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="ios-card-nested press text-xs px-3 py-2 flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: isPro ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}
              title={isPro ? 'Save this setup to your account' : 'Upgrade to save your setup'}
            >
              {isPro ? '💾' : '🔒'} {savingConfig ? 'Saving…' : 'Save'}
            </button>
            <div className="pill press transition-all duration-500" style={{ background: `rgba(${healthColor}, 0.15)`, color: `rgb(${healthColor})` }}>
              {healthLabel}
            </div>
          </div>
        </div>

        {/* Live stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {[
            { label: 'Home bedtime', value: formatTime(homeBedtime) },
            { label: 'Destination bedtime', value: formatTime(destBedtime) },
            { label: 'Shift needed', value: direction === 'none' ? '0h' : formatDuration(shiftMinutes) },
            { label: 'Days to fully adjust', value: daysNeeded === 0 ? 'Aligned!' : `${daysNeeded} day${daysNeeded === 1 ? '' : 's'}` },
          ].map(stat => (
            <div key={stat.label} className="ios-card-nested p-3 text-center">
              <div className="text-title3 tabular transition-transform duration-200"
                style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${GLOW})` }}>
                {stat.value}
              </div>
              <div className="text-caption mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dual 24-hour ring */}
        <div ref={ringRef} className="relative mx-auto mb-2" style={{ width: '100%', maxWidth: 280, aspectRatio: '1 / 1' }}>
          <svg viewBox="0 0 300 300" width="100%" height="100%" style={{ touchAction: 'none' }}>
            {Array.from({ length: 24 }).map((_, h) => {
              const angle = angleForMinutes(h * 60);
              const major = h % 6 === 0;
              const p1 = pointOnCircle(150, 150, major ? 128 : 124, angle);
              const p2 = pointOnCircle(150, 150, 132, angle);
              return <line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--text-tertiary)" strokeWidth={major ? 2 : 1} opacity={major ? 0.6 : 0.3} />;
            })}
            {[0, 6, 12, 18].map(h => {
              const p = pointOnCircle(150, 150, 142, angleForMinutes(h * 60));
              const label = h === 0 ? '12AM' : h === 6 ? '6AM' : h === 12 ? '12PM' : '6PM';
              return <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="var(--text-tertiary)">{label}</text>;
            })}

            <circle cx={150} cy={150} r={R_OUTER} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />
            <circle cx={150} cy={150} r={R_INNER} fill="none" stroke="var(--border-hairline)" strokeWidth={10} />

            <circle cx={150} cy={150} r={R_OUTER} fill="none" stroke={`rgb(${HOME_RING_COLOR})`} strokeWidth={10}
              strokeDasharray={`${homeProgress * CIRC_OUTER} ${CIRC_OUTER}`} strokeLinecap="round" transform="rotate(-90 150 150)" opacity={0.85} />
            <circle cx={150} cy={150} r={R_INNER} fill="none" stroke={`rgb(${DEST_RING_COLOR})`} strokeWidth={10}
              strokeDasharray={`${destProgress * CIRC_INNER} ${CIRC_INNER}`} strokeLinecap="round" transform="rotate(-90 150 150)" opacity={0.85} />

            <line x1={homePoint.x} y1={homePoint.y} x2={destPoint.x} y2={destPoint.y} stroke={`rgb(${directionColor})`} strokeWidth={2} strokeDasharray="4 3" opacity={0.6} />

            <circle
              cx={homePoint.x} cy={homePoint.y} r={13} fill="white" stroke={`rgb(${HOME_RING_COLOR})`} strokeWidth={4}
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={() => setDraggingRing('home')}
            />
            <circle
              cx={destPoint.x} cy={destPoint.y} r={13} fill="white" stroke={`rgb(${DEST_RING_COLOR})`} strokeWidth={4}
              style={{ cursor: 'grab', touchAction: 'none' }}
              onPointerDown={() => setDraggingRing('dest')}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-title2 tabular transition-transform duration-200" style={{ transform: pulse ? 'scale(1.08)' : 'scale(1)', color: `rgb(${directionColor})` }}>
              {direction === 'none' ? '0h' : formatDuration(shiftMinutes)}
            </div>
            <div className="text-caption font-bold" style={{ color: `rgb(${directionColor})`, letterSpacing: '0.05em' }}>
              {direction === 'advance' ? 'ADVANCE' : direction === 'delay' ? 'DELAY' : 'ALIGNED'}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-5 mb-7 text-caption flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `rgb(${HOME_RING_COLOR})` }} />
            Home {formatTime(homeBedtime)}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `rgb(${DEST_RING_COLOR})` }} />
            Destination {formatTime(destBedtime)}
          </span>
        </div>

        {/* Prep-days stepper */}
        <div className="ios-card-nested p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-footnote font-semibold">Days before departure to start adjusting</p>
            <p className="text-caption">{isPro ? `Up to ${PRO_MAX_PREP_DAYS} days` : `Free plan caps at ${FREE_MAX_PREP_DAYS} days`}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => adjustPrepDays(-1)} className="ios-card-nested press w-8 h-8 rounded-full flex items-center justify-center font-bold">−</button>
            <span className="text-title3 tabular w-10 text-center" style={{ color: `rgb(${GLOW})` }}>{prepDays}</span>
            <button onClick={() => adjustPrepDays(1)} className="ios-card-nested press w-8 h-8 rounded-full flex items-center justify-center font-bold">+</button>
          </div>
        </div>

        {/* Light-exposure tip */}
        <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${directionColor})` }}>
          <span className="text-lg flex-shrink-0">💡</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{tip}</p>
        </div>

        {/* Sleep-shift schedule */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-footnote font-semibold">Your sleep-shift schedule</p>
            <p className="text-caption">{rate} min/day {direction === 'delay' ? 'later' : 'earlier'}</p>
          </div>
          <div className="flex flex-col gap-2">
            {schedule.map((row, idx) => (
              <div key={idx} className="ios-card-nested p-3 flex items-center justify-between">
                <span className="text-footnote font-semibold">
                  {row.daysBefore === 0 ? '✈️ Departure day' : `Day −${row.daysBefore}`}
                </span>
                <span className="text-footnote font-bold tabular" style={{ color: `rgb(${directionColor})` }}>{formatTime(row.bedtime)}</span>
              </div>
            ))}
            {partialShiftRemaining > 0 && (
              <div className="ios-card-nested p-3 flex items-center gap-3" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
                <span className="text-lg flex-shrink-0">🛬</span>
                <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
                  You'll land with about <strong>{formatDuration(Math.round(partialShiftRemaining))}</strong> of adjustment still to do — expect some grogginess for the first day or two.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end mb-7">
          <button onClick={handleCopySchedule} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
            📋 Copy schedule
          </button>
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
              <p className="text-footnote font-bold mb-0.5">{atFreeLimit ? "⭐ You've hit the free limit" : '🔒 Free plan: 5 prep days, 30-min precision'}</p>
              <p className="text-caption">Upgrade to Premium for up to {PRO_MAX_PREP_DAYS} prep days, {PRO_SNAP_MINUTES}-minute drag precision, and saving your setup.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Upgrade to Premium — $4/mo</button>
          </div>
        )}

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? `rgb(${GLOW})` : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
              {toolLiked ? '❤️' : '🤍'}
            </span>
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

      {/* Comments waterfall */}
      <ToolCommentSection seedComments={JETLAG_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />

      <ToastHost toast={toast} />
    </div>
  );
}
