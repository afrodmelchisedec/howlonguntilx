// FILE: src/components/pro-tools/MeetingOverlapRadar.tsx
'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { MEETING_OVERLAP_COMMENTS } from '@/lib/seedComments';

interface Participant {
  id: string;
  name: string;
  city: string;
  utcOffset: number;   // approximate, ignores DST
  startHour: number;   // canonical UTC hour, 0-24 range, half-hour increments
  endHour: number;     // canonical UTC hour, may represent wrap past 24 conceptually via delta math
  color: string;
  active: boolean;
  isYou?: boolean;
}

const CITY_PRESETS: { city: string; offset: number }[] = [
  { city: 'New York',      offset: -4 },
  { city: 'London',        offset: 1 },
  { city: 'Berlin',        offset: 2 },
  { city: 'Mumbai',        offset: 5.5 },
  { city: 'Tokyo',         offset: 9 },
  { city: 'Sydney',        offset: 11 },
  { city: 'San Francisco', offset: -7 },
  { city: 'Dubai',         offset: 4 },
];

const PALETTE = [
  '88, 214, 113', '100, 200, 255', '196, 132, 252',
  '255, 180, 100', '255, 122, 165', '120, 220, 200',
];
const YOU_COLOR = '83, 74, 217';
const MAX_PARTICIPANTS = 7; // including "You"

const RING_SIZE = 480;
const CX = 240;
const CY = 240;
const HEAT_RADIUS = 196;
const BASE_ORBIT_RADIUS = 168;
const ORBIT_STEP = 26;
const SLOT_COUNT = 48; // half-hour slots across 24h

function normalizeHour(h: number): number {
  return ((h % 24) + 24) % 24;
}

function hourToPoint(hour: number, radius: number) {
  const rawDeg = (hour / 24) * 360 - 90;
  const rad = (rawDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function pointToHour(x: number, y: number): number {
  const dx = x - CX;
  const dy = y - CY;
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

function nextColor(existing: Participant[]): string {
  const used = new Set(existing.map(p => p.color));
  return PALETTE.find(c => !used.has(c)) ?? PALETTE[existing.length % PALETTE.length];
}

export function MeetingOverlapRadar() {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();

  const youOffset = useMemo(() => -(new Date().getTimezoneOffset()) / 60, []);

  const [participants, setParticipants] = useState<Participant[]>(() => {
    const startLocal = 9, endLocal = 17;
    return [{
      id: 'you',
      name: 'You',
      city: 'Your local time',
      utcOffset: youOffset,
      startHour: normalizeHour(startLocal - youOffset),
      endHour: normalizeHour(endLocal - youOffset),
      color: YOU_COLOR,
      active: true,
      isYou: true,
    }];
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [nowUtcHour, setNowUtcHour] = useState(() => {
    const d = new Date();
    return d.getUTCHours() + d.getUTCMinutes() / 60;
  });

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(96);

  const svgWrapperRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; which: 'start' | 'end' } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNowUtcHour(d.getUTCHours() + d.getUTCMinutes() / 60);
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const availableCities = CITY_PRESETS.filter(
    c => !participants.some(p => p.city === c.city)
  );

  function addParticipant(preset: { city: string; offset: number }) {
    if (participants.length >= MAX_PARTICIPANTS) return;
    const startLocal = 9, endLocal = 17;
    setParticipants(prev => [...prev, {
      id: `p-${Date.now()}`,
      name: preset.city.split(' ')[0],
      city: preset.city,
      utcOffset: preset.offset,
      startHour: normalizeHour(startLocal - preset.offset),
      endHour: normalizeHour(endLocal - preset.offset),
      color: nextColor(prev),
      active: true,
    }]);
    setDropdownOpen(false);
  }

  function removeParticipant(id: string) {
    setParticipants(prev => prev.filter(p => p.id !== id));
  }

  function toggleActive(id: string) {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  }

  function quickSet(id: string, startLocal: number, endLocal: number) {
    setParticipants(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        startHour: normalizeHour(startLocal - p.utcOffset),
        endHour: normalizeHour(endLocal - p.utcOffset),
      };
    }));
  }

  // ---- drag handling ----
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
    function onUp() { dragRef.current = null; setActiveDragId(null); }
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
  }

  // ---- overlap calculation ----
  const activeParticipants = participants.filter(p => p.active);
  const activeCount = activeParticipants.length;

  const slotCounts = useMemo(() => {
    const counts = new Array(SLOT_COUNT).fill(0);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slotHour = i * 0.5;
      for (const p of activeParticipants) {
        const delta = deltaOf(p);
        const norm = ((slotHour - p.startHour) + 24) % 24;
        if (norm < delta) counts[i] += 1;
      }
    }
    return counts;
  }, [activeParticipants]);

  const maxOverlap = Math.max(...slotCounts, 0);

  const bestRun = useMemo(() => {
    if (maxOverlap < 2) return null;
    let bestStart = -1, bestLen = 0, curStart = -1, curLen = 0;
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (slotCounts[i] === maxOverlap) {
        if (curLen === 0) curStart = i;
        curLen += 1;
        if (curLen > bestLen) { bestLen = curLen; bestStart = curStart; }
      } else {
        curLen = 0;
      }
    }
    if (bestStart === -1) return null;
    return { startHour: bestStart * 0.5, endHour: (bestStart + bestLen) * 0.5, count: maxOverlap };
  }, [slotCounts, maxOverlap]);

  function handleLike() {
    if (!session) { showToast('You need to sign up first', '🔒'); return; }
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

  function handleCopyBestTime() {
    if (!bestRun) { showToast('No overlap found yet', '🤷'); return; }
    const youLocalStart = bestRun.startHour + youOffset;
    const youLocalEnd = bestRun.endHour + youOffset;
    const text = `Best meeting time: ${formatHour(youLocalStart)}–${formatHour(youLocalEnd)} your time (${formatHour(bestRun.startHour)}–${formatHour(bestRun.endHour)} UTC), ${bestRun.count} people free`;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Meeting time copied!', '🕒'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleCommentJump() {
    if (!session) { showToast('You need to sign up first', '🔒'); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(83,74,217,0.25), 0 0 40px rgba(83,74,217,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>MEETING OVERLAP</p>
            <h2 className="text-title2">Time Zone Radar</h2>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={participants.length >= MAX_PARTICIPANTS}
              className="btn-filled press text-xs px-4 py-2 disabled:opacity-40"
            >
              + Add teammate
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className="ios-card anim-scale-in absolute right-0 mt-2 w-52 overflow-hidden z-40" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                  {availableCities.length === 0 && (
                    <p className="text-footnote p-3 text-center" style={{ color: 'var(--text-tertiary)' }}>All cities added</p>
                  )}
                  {availableCities.map(c => (
                    <button
                      key={c.city}
                      onClick={() => addParticipant(c)}
                      className="sidebar-item w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium press"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span>{c.city}</span>
                      <span className="text-caption">UTC{c.offset >= 0 ? '+' : ''}{c.offset}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Participant list */}
        <div className="flex flex-col gap-2 mb-6">
          {participants.map(p => {
            const workingNow = (() => {
              if (!p.active) return false;
              const delta = deltaOf(p);
              const norm = ((nowUtcHour - p.startHour) + 24) % 24;
              return norm < delta;
            })();
            const localStart = normalizeHour(p.startHour + p.utcOffset);
            const localEnd = normalizeHour(p.endHour + p.utcOffset);
            return (
              <div key={p.id} className="ios-card-nested p-3 flex items-center gap-3 flex-wrap">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 relative"
                  style={{ background: `rgb(${p.color})`, opacity: p.active ? 1 : 0.35 }}
                >
                  {p.name[0].toUpperCase()}
                  {workingNow && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                      style={{ background: 'rgb(52,199,89)', boxShadow: '0 0 6px rgba(52,199,89,0.9)', animation: 'workPulse 1.6s ease-out infinite' }}
                    />
                  )}
                </span>
                <div className="flex-1 min-w-[140px]">
                  <div className="text-footnote font-bold">{p.name}</div>
                  <div className="text-caption tabular">
                    {formatHour(localStart)} – {formatHour(localEnd)} ({p.city})
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => quickSet(p.id, 9, 17)} className="pill press text-[10px]" style={{ background: 'var(--border-hairline)', color: 'var(--text-secondary)' }}>9–5</button>
                  <button onClick={() => quickSet(p.id, 8, 20)} className="pill press text-[10px]" style={{ background: 'var(--border-hairline)', color: 'var(--text-secondary)' }}>8–8</button>
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer press">
                  <input type="checkbox" checked={p.active} onChange={() => toggleActive(p.id)} className="accent-current" style={{ accentColor: `rgb(${p.color})` }} />
                  <span className="text-caption">Active</span>
                </label>
                {!p.isYou && (
                  <button onClick={() => removeParticipant(p.id)} className="press text-caption" style={{ color: 'rgb(var(--accent-red))' }}>✕</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Radar ring */}
        <div ref={svgWrapperRef} className="relative mx-auto mb-6" style={{ width: '100%', maxWidth: 420, aspectRatio: '1 / 1' }}>
          <svg viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className="w-full h-full" style={{ overflow: 'visible' }}>
            <defs>
              <filter id="glowSoft" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* rotating radar sweep (decorative, continuous) */}
            <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'radarSpin 8s linear infinite' }}>
              <path
                d={`M ${CX} ${CY} L ${CX} ${CY - HEAT_RADIUS} A ${HEAT_RADIUS} ${HEAT_RADIUS} 0 0 1 ${CX + HEAT_RADIUS * Math.sin(0.5)} ${CY - HEAT_RADIUS * Math.cos(0.5)} Z`}
                fill="rgba(83, 74, 217, 0.06)"
              />
            </g>

            {/* base guide circle + hour ticks */}
            <circle cx={CX} cy={CY} r={HEAT_RADIUS + 14} fill="none" stroke="var(--border-hairline)" strokeWidth="1" />
            {Array.from({ length: 24 }).map((_, h) => {
              const isMajor = h % 3 === 0;
              const p1 = hourToPoint(h, HEAT_RADIUS + 14);
              const p2 = hourToPoint(h, HEAT_RADIUS + (isMajor ? 22 : 18));
              return (
                <line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="var(--text-tertiary)" strokeWidth={isMajor ? 1.5 : 0.75} opacity={isMajor ? 0.6 : 0.3} />
              );
            })}
            {[0, 3, 6, 9, 12, 15, 18, 21].map(h => {
              const p = hourToPoint(h, HEAT_RADIUS + 34);
              return (
                <text key={h} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                  fontSize="11" fontWeight="700" fill="var(--text-tertiary)">
                  {h}h
                </text>
              );
            })}

            {/* heat ring: 48 half-hour overlap wedges */}
            {slotCounts.map((count, i) => {
              const ratio = activeCount > 0 ? count / activeCount : 0;
              const opacity = count === 0 ? 0.04 : 0.12 + 0.78 * ratio;
              const blur = 1 + count * 2.5;
              return (
                <path
                  key={i}
                  d={arcPath(i * 0.5, 0.5, HEAT_RADIUS)}
                  stroke={`rgba(255, 190, 60, ${opacity})`}
                  strokeWidth={16}
                  fill="none"
                  style={{ transition: 'stroke 0.2s ease-out', filter: count > 0 ? `drop-shadow(0 0 ${blur}px rgba(255,190,60,0.5))` : 'none' }}
                />
              );
            })}

            {/* best overlap pulsing highlight */}
            {bestRun && (
              <path
                d={arcPath(bestRun.startHour, (bestRun.endHour - bestRun.startHour + 24) % 24 || 24, HEAT_RADIUS)}
                stroke="rgba(255, 215, 90, 0.95)"
                strokeWidth={18}
                fill="none"
                strokeLinecap="round"
                style={{ animation: 'bestPulse 1.8s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(255,215,90,0.9))' }}
              />
            )}

            {/* participant orbit arcs + drag handles */}
            {participants.map((p, idx) => {
              const radius = BASE_ORBIT_RADIUS - idx * ORBIT_STEP;
              const delta = deltaOf(p);
              const startPt = hourToPoint(p.startHour, radius);
              const endPt = hourToPoint(p.startHour + delta, radius);
              const isDragging = activeDragId === p.id;
              return (
                <g key={p.id} opacity={p.active ? 1 : 0.25} style={{ transition: 'opacity 0.3s' }}>
                  <path
                    d={arcPath(p.startHour, delta, radius)}
                    stroke={`rgb(${p.color})`}
                    strokeWidth={isDragging ? 10 : 7}
                    strokeLinecap="round"
                    fill="none"
                    style={{ transition: 'stroke-width 0.15s ease-out', filter: `drop-shadow(0 0 6px rgba(${p.color}, 0.6))` }}
                  />
                  {/* start handle */}
                  <circle
                    cx={startPt.x} cy={startPt.y} r={isDragging && dragRef.current?.which === 'start' ? 12 : 9}
                    fill={`rgb(${p.color})`} stroke="white" strokeWidth={2}
                    style={{ cursor: 'grab', touchAction: 'none', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.4))', transition: 'r 0.15s ease-out' }}
                    onPointerDown={() => startDrag(p.id, 'start')}
                  />
                  {/* end handle */}
                  <circle
                    cx={endPt.x} cy={endPt.y} r={isDragging && dragRef.current?.which === 'end' ? 12 : 9}
                    fill={`rgb(${p.color})`} stroke="white" strokeWidth={2}
                    style={{ cursor: 'grab', touchAction: 'none', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.4))', transition: 'r 0.15s ease-out' }}
                    onPointerDown={() => startDrag(p.id, 'end')}
                  />
                </g>
              );
            })}

            {/* center readout */}
            <circle cx={CX} cy={CY} r={44} fill="var(--bg-elevated, rgba(255,255,255,0.04))" stroke="var(--border-hairline)" />
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill="var(--text-primary)">
              {maxOverlap}/{activeCount}
            </text>
            <text x={CX} y={CY + 14} textAnchor="middle" fontSize="10" fill="var(--text-tertiary)">
              overlapping
            </text>
          </svg>
        </div>

        {/* Best time callout */}
        <div
          className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap"
          style={{ border: bestRun ? '1.5px solid rgba(255,215,90,0.5)' : undefined, boxShadow: bestRun ? '0 0 20px rgba(255,215,90,0.15)' : undefined }}
        >
          <div>
            <p className="text-footnote font-bold mb-0.5">
              {bestRun ? '🌟 Best meeting window' : '🤷 No full overlap yet'}
            </p>
            <p className="text-caption">
              {bestRun
                ? `${formatHour(bestRun.startHour + youOffset)} – ${formatHour(bestRun.endHour + youOffset)} your time · ${formatHour(bestRun.startHour)}–${formatHour(bestRun.endHour)} UTC · ${bestRun.count} people free`
                : 'Try dragging arcs closer together, or toggle someone off.'}
            </p>
          </div>
          <button onClick={handleCopyBestTime} className="btn-filled press text-xs px-4 py-2 flex-shrink-0" disabled={!bestRun}>
            Copy time
          </button>
        </div>

        {/* Like / Share / Comment bar */}
        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? 'rgb(var(--accent-brand))' : 'var(--text-secondary)' }}>
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
      <ToolCommentSection seedComments={MEETING_OVERLAP_COMMENTS} onRequireAuth={() => showToast('You need to sign up first', '🔒')} glow="83, 74, 217" />

      <ToastHost toast={toast} />

      <style>{`
        @keyframes radarSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bestPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }
        @keyframes workPulse {
          0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.7); }
          70%  { box-shadow: 0 0 0 6px rgba(52,199,89,0); }
          100% { box-shadow: 0 0 0 0 rgba(52,199,89,0); }
        }
      `}</style>
    </div>
  );
}
