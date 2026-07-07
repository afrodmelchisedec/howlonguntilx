// FILE: src/components/calendar/EventCalendar.tsx
'use client';
import { useState, useMemo, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from '@/components/pro-tools/ToolCommentSection';
import { CALENDAR_COMMENTS } from '@/lib/seedComments';
import { CALENDAR_REGIONS, prettifyRegion, getRegionGlow, type CalendarEvent } from '@/lib/calendar-shared';

type CalendarMap = Record<string, CalendarEvent[]>;

interface Props {
  initialYear: number;
  initialMonth: number;
  initialEvents: CalendarMap;
  isPro: boolean;
}

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PAST_COLOR = '196, 132, 252';
const TODAY_COLOR = '255, 204, 0';
const FUTURE_COLOR = '100, 220, 255';

function pad(n: number): string { return String(n).padStart(2, '0'); }
function daysInMonth(year: number, month: number): number { return new Date(year, month, 0).getDate(); }
function firstWeekday(year: number, month: number): number { return new Date(year, month - 1, 1).getDay(); }

function fmtLongDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function EventCalendar({ initialYear, initialMonth, initialEvents, isPro }: Props) {
  const { data: session } = useSession();
  const { toast, showToast } = useToast();

  const realToday = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const realYear = realToday.getFullYear();
  const realMonth = realToday.getMonth() + 1;

  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarMap>(initialEvents);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [modalIso, setModalIso] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [savedDays, setSavedDays] = useState<Set<string>>(new Set());
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [likedFacts, setLikedFacts] = useState<Set<string>>(new Set());
  const [bubble, setBubble] = useState<{ label: string; color: string; emoji: string } | null>(null);

  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(154);

  useEffect(() => {
    if (!isPro || savedLoaded) return;
    fetch('/api/calendar/favorites')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.days)) setSavedDays(new Set(data.days));
        setSavedLoaded(true);
      })
      .catch(() => setSavedLoaded(true));
  }, [isPro, savedLoaded]);

  const numDays = daysInMonth(year, month);
  const startWeekday = firstWeekday(year, month);

  const grid = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= numDays; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [startWeekday, numDays]);

  function isoFor(day: number): string { return `${year}-${pad(month)}-${pad(day)}`; }

  function statusFor(day: number): 'past' | 'today' | 'future' {
    const cellDate = new Date(year, month - 1, day);
    cellDate.setHours(0, 0, 0, 0);
    if (cellDate.getTime() < realToday.getTime()) return 'past';
    if (cellDate.getTime() === realToday.getTime()) return 'today';
    return 'future';
  }

  async function goToMonth(y: number, m: number, dir: 1 | -1) {
    if (!isPro && (y !== realYear || m !== realMonth)) {
      showToast('Upgrade to Pro to browse other months', '⭐');
      return;
    }
    setDirection(dir);
    setLoadingMonth(true);
    try {
      const res = await fetch(`/api/calendar?year=${y}&month=${m}`);
      const data = await res.json();
      setEvents(data.events ?? {});
      setYear(y);
      setMonth(m);
    } catch {
      showToast('Could not load that month', '⚠️');
    } finally {
      setLoadingMonth(false);
    }
  }

  function handlePrev() {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    goToMonth(y, m, -1);
  }
  function handleNext() {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    goToMonth(y, m, 1);
  }
  function handleToday() {
    if (year === realYear && month === realMonth) return;
    goToMonth(realYear, realMonth, realYear * 12 + realMonth > year * 12 + month ? 1 : -1);
  }

  function eventsFor(iso: string): CalendarEvent[] {
    const all = events[iso] ?? [];
    if (selectedRegion === 'all') return all;
    return all.filter(e => e.region === selectedRegion);
  }

  function openDay(iso: string, day: number) {
    setModalIso(iso);
    const status = statusFor(day);
    const cellDate = new Date(`${iso}T00:00:00`);
    const diffDays = Math.round((cellDate.getTime() - realToday.getTime()) / 86400000);
    let label: string, color: string, emoji: string;
    if (status === 'today') { label = 'Today!'; color = TODAY_COLOR; emoji = '📍'; }
    else if (status === 'past') { label = `${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'} in the past`; color = PAST_COLOR; emoji = '🕰️'; }
    else { label = `${diffDays} day${diffDays === 1 ? '' : 's'} from now`; color = FUTURE_COLOR; emoji = '🚀'; }
    setBubble({ label, color, emoji });
    showToast(`${emoji} ${label}`);
  }

  function closeModal() { setModalIso(null); setBubble(null); }

  function toggleLikeFact(iso: string) {
    if (!session) { showToast('You need to sign up first', '🔒'); return; }
    setLikedFacts(prev => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso); else next.add(iso);
      return next;
    });
  }

  function handleCopyFact(iso: string) {
    const items = eventsFor(iso);
    const text = items.length > 0
      ? `${fmtLongDate(iso)}\n` + items.map(e => `• [${prettifyRegion(e.region)}] ${e.event}${e.description ? ` — ${e.description}` : ''}`).join('\n')
      : `${fmtLongDate(iso)}\nNo recorded events for this day yet.`;
    navigator.clipboard.writeText(text)
      .then(() => showToast('Fact copied!', '📋'))
      .catch(() => showToast('Could not copy', '⚠️'));
  }

  function handleShareDay(iso: string) {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?date=${iso}`;
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }

  async function toggleSaveDay(iso: string) {
    if (!isPro) { showToast('Upgrade to Pro to save favorite days', '⭐'); return; }
    const next = new Set(savedDays);
    const willBeSaved = !next.has(iso);
    if (next.has(iso)) next.delete(iso); else next.add(iso);
    setSavedDays(next);
    try {
      await fetch('/api/calendar/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: Array.from(next) }),
      });
      showToast(willBeSaved ? 'Day saved!' : 'Removed from saved days', willBeSaved ? '⭐' : '🗑️');
    } catch {
      showToast('Could not save — try again', '⚠️');
    }
  }

  function jumpToSaved(iso: string) {
    const [y, m, d] = iso.split('-').map(Number);
    if (y === year && m === month) {
      openDay(iso, d);
    } else {
      goToMonth(y, m, y * 12 + m > year * 12 + month ? 1 : -1);
      showToast('Jumped to that month — tap the day to reopen it', '📅');
    }
  }

  function requireAuth() { showToast('You need to sign up first', '🔒'); }

  function handleToolLike() {
    if (!session) { requireAuth(); return; }
    setToolLiked(prev => { setToolLikeCount(c => prev ? c - 1 : c + 1); return !prev; });
  }
  function handleToolShare() {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied!', '🔗'))
      .catch(() => showToast('Could not copy link', '⚠️'));
  }
  function handleCommentJump() {
    if (!session) { requireAuth(); return; }
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const modalEvents = modalIso ? eventsFor(modalIso) : [];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(var(--accent-brand), 0.25), 0 0 50px rgba(var(--accent-brand), 0.12)' }}>

        {/* Saved days strip */}
        {isPro && savedDays.size > 0 && (
          <div className="mb-5 -mx-1 overflow-x-auto">
            <div className="flex gap-2 px-1 pb-1 items-center" style={{ minWidth: 'max-content' }}>
              <span className="text-caption pr-1" style={{ color: 'var(--text-tertiary)' }}>⭐ Saved:</span>
              {Array.from(savedDays).sort().map(iso => (
                <button key={iso} onClick={() => jumpToSaved(iso)} className="pill press text-xs flex-shrink-0"
                  style={{ background: 'rgba(255, 204, 0, 0.15)', color: 'rgb(255, 204, 0)' }}>
                  {fmtShort(iso)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Header: nav + region filter */}
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button onClick={handlePrev} className="ios-card-nested press w-9 h-9 rounded-full flex items-center justify-center relative">
              ←
              {!isPro && <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>}
            </button>
            <div className="text-center overflow-hidden" style={{ minWidth: 170 }}>
              <h2 key={`${year}-${month}`} className="text-title2" style={{ animation: `${direction === 1 ? 'slideInRight' : 'slideInLeft'} 0.3s ease-out` }}>
                {MONTH_LABELS[month - 1]} {year}
              </h2>
            </div>
            <button onClick={handleNext} className="ios-card-nested press w-9 h-9 rounded-full flex items-center justify-center relative">
              →
              {!isPro && <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>}
            </button>
            {(year !== realYear || month !== realMonth) && (
              <button onClick={handleToday} className="pill press text-xs" style={{ background: 'rgba(var(--accent-brand), 0.15)', color: 'rgb(var(--accent-brand))' }}>
                Today
              </button>
            )}
          </div>
          <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
            className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>
            <option value="all">All regions</option>
            {CALENDAR_REGIONS.map(r => <option key={r} value={r}>{prettifyRegion(r)}</option>)}
          </select>
        </div>
        <p className="text-caption mb-6" style={{ color: 'var(--text-tertiary)' }}>
          Hover a day for a preview · click for the full story{!isPro && ' · Pro unlocks every month'}
        </p>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map(w => <div key={w} className="text-caption text-center py-1" style={{ color: 'var(--text-tertiary)' }}>{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5" style={{ opacity: loadingMonth ? 0.4 : 1, transition: 'opacity 0.2s' }}>
          {grid.map((day, i) => {
            if (day === null) return <div key={i} />;
            const iso = isoFor(day);
            const dayEvents = eventsFor(iso);
            const hasEvents = dayEvents.length > 0;
            const status = statusFor(day);
            const isSaved = savedDays.has(iso);
            const statusColor = status === 'today' ? TODAY_COLOR : status === 'past' ? PAST_COLOR : FUTURE_COLOR;
            return (
              <div key={i} className="relative group">
                <button
                  onClick={() => openDay(iso, day)}
                  className="press w-full rounded-2xl flex flex-col items-center justify-center transition-all duration-200"
                  style={{
                    aspectRatio: '1 / 1',
                    background: status === 'today' ? `rgba(${TODAY_COLOR}, 0.14)` : 'var(--border-hairline)',
                    border: status === 'today' ? `2px solid rgb(${TODAY_COLOR})` : '1px solid transparent',
                    boxShadow: status === 'today' ? `0 0 14px rgba(${TODAY_COLOR}, 0.5)` : 'none',
                    opacity: status === 'past' ? 0.75 : 1,
                    animation: status === 'today' ? 'todayPulse 2.4s ease-in-out infinite' : 'none',
                  }}
                >
                  <span className="text-sm font-bold" style={{ color: status === 'today' ? `rgb(${TODAY_COLOR})` : 'var(--text-primary)' }}>{day}</span>
                  {hasEvents && (
                    <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: `rgb(${statusColor})`, boxShadow: `0 0 6px rgba(${statusColor}, 0.8)` }} />
                  )}
                  {isSaved && <span className="absolute top-0.5 right-0.5 text-[9px]">⭐</span>}
                </button>

                {hasEvents && (
                  <div
                    className="absolute left-1/2 top-full mt-2 z-30 pointer-events-none opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                    style={{ transform: 'translateX(-50%)', width: 200 }}
                  >
                    <div className="ios-card p-3" style={{ boxShadow: 'var(--shadow-elevated)', border: `1px solid rgba(${statusColor}, 0.4)` }}>
                      {dayEvents.slice(0, 2).map((e, idx) => (
                        <p key={idx} className="text-[11px] leading-snug mb-1 last:mb-0" style={{ color: 'var(--text-secondary)' }}>
                          <span style={{ color: `rgb(var(--accent-${getRegionGlow(e.region)}))` }}>●</span> {e.event}
                        </p>
                      ))}
                      {dayEvents.length > 2 && <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>+{dayEvents.length - 2} more</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall like/share/comment bar */}
        <div className="flex items-center gap-2 pt-6 mt-6" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <button onClick={handleToolLike} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5"
            style={{ color: toolLiked ? 'rgb(var(--accent-brand))' : 'var(--text-secondary)' }}>
            <span style={{ transform: toolLiked ? 'scale(1.2)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>{toolLiked ? '❤️' : '🤍'}</span>
            <span className="text-footnote font-semibold">{toolLikeCount}</span>
          </button>
          <button onClick={handleToolShare} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            🔗 <span className="text-footnote font-semibold">Share</span>
          </button>
          <button onClick={handleCommentJump} className="ios-card-nested press flex-1 flex items-center justify-center gap-2 py-2.5" style={{ color: 'var(--text-secondary)' }}>
            💬 <span className="text-footnote font-semibold">Comment</span>
          </button>
        </div>
      </div>

      <ToolCommentSection seedComments={CALENDAR_COMMENTS} onRequireAuth={requireAuth} glow="var(--accent-brand)" />

      {/* Day modal */}
      {modalIso && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={closeModal}>
          <div className="ios-card p-6 sm:p-8 anim-scale-in" style={{ maxWidth: 480, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            {bubble && (
              <div className="flex justify-center mb-4">
                <span className="pill press text-sm font-bold anim-bubble-pop"
                  style={{ background: `rgba(${bubble.color}, 0.18)`, color: `rgb(${bubble.color})`, boxShadow: `0 0 16px rgba(${bubble.color}, 0.4)` }}>
                  {bubble.emoji} {bubble.label}
                </span>
              </div>
            )}
            <h3 className="text-title3 text-center mb-1">{fmtLongDate(modalIso)}</h3>
            <p className="text-caption text-center mb-6" style={{ color: 'var(--text-tertiary)' }}>
              {modalEvents.length > 0 ? `${modalEvents.length} event${modalEvents.length === 1 ? '' : 's'} on record` : 'Nothing recorded yet for this day'}
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {modalEvents.length > 0 ? modalEvents.map((e, i) => (
                <div key={i} className="ios-card-nested p-4 anim-fade-up" style={{ animationDelay: `${i * 60}ms`, borderLeft: `3px solid rgb(var(--accent-${getRegionGlow(e.region)}))` }}>
                  <p className="text-caption font-bold mb-1" style={{ color: `rgb(var(--accent-${getRegionGlow(e.region)}))` }}>{prettifyRegion(e.region)}</p>
                  <p className="text-footnote font-semibold mb-1">{e.event}</p>
                  {e.description && <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>}
                </div>
              )) : (
                <div className="ios-card-nested p-4 text-center">
                  <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No historical events recorded for this date yet — check back as we keep adding more.</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <button onClick={() => toggleLikeFact(modalIso)} className="ios-card-nested press flex-1 flex items-center justify-center gap-1.5 py-2"
                style={{ color: likedFacts.has(modalIso) ? 'rgb(var(--accent-brand))' : 'var(--text-secondary)' }}>
                {likedFacts.has(modalIso) ? '❤️' : '🤍'} <span className="text-footnote font-semibold">Like</span>
              </button>
              <button onClick={() => handleCopyFact(modalIso)} className="ios-card-nested press flex-1 flex items-center justify-center gap-1.5 py-2" style={{ color: 'var(--text-secondary)' }}>
                📋 <span className="text-footnote font-semibold">Copy</span>
              </button>
              <button onClick={() => handleShareDay(modalIso)} className="ios-card-nested press flex-1 flex items-center justify-center gap-1.5 py-2" style={{ color: 'var(--text-secondary)' }}>
                🔗 <span className="text-footnote font-semibold">Share</span>
              </button>
              <button onClick={() => toggleSaveDay(modalIso)} className="ios-card-nested press flex-1 flex items-center justify-center gap-1.5 py-2"
                style={{ color: isPro ? (savedDays.has(modalIso) ? 'rgb(255, 204, 0)' : 'var(--text-secondary)') : 'var(--text-tertiary)' }}>
                {isPro ? (savedDays.has(modalIso) ? '⭐' : '☆') : '🔒'} <span className="text-footnote font-semibold">Save</span>
              </button>
            </div>
            <button onClick={closeModal} className="btn-filled press w-full mt-2">Close</button>
          </div>
        </div>
      )}

      <ToastHost toast={toast} />

      <style>{`
        @keyframes todayPulse {
          0%, 100% { box-shadow: 0 0 14px rgba(${TODAY_COLOR}, 0.5); }
          50%      { box-shadow: 0 0 22px rgba(${TODAY_COLOR}, 0.85); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes bubblePop {
          0%   { opacity: 0; transform: scale(0.6); }
          60%  { opacity: 1; transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        .anim-bubble-pop { animation: bubblePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
}
