// FILE: src/components/pro-tools/TechEventsCalendar.tsx
'use client';
import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { ToolCommentSection } from './ToolCommentSection';
import { TECH_EVENTS_COMMENTS } from './techEventsComments';

type EventType = 'launch' | 'keynote' | 'conference';
interface TechEvent { name: string; month: number; day: number; type: EventType; emoji: string; blurb: string; city: string }

const GLOW = '162, 137, 255';
const FREE_MONTHS_AHEAD = 1; // current month + 1 ahead, free tier

const TYPE_COLOR: Record<EventType, string> = {
  launch: '255, 138, 101',
  keynote: GLOW,
  conference: '129, 178, 255',
};
const TYPE_LABEL: Record<EventType, string> = {
  launch: 'Product Launch',
  keynote: 'Keynote',
  conference: 'Conference',
};
const TYPE_EMOJI: Record<EventType, string> = {
  launch: '🚀',
  keynote: '🎤',
  conference: '🖥️',
};

// Recurring annual tech events. Exact day-of-month shifts slightly year to year in
// real life — treat these as the typical historical window (see the guide tab).
const TECH_EVENTS: TechEvent[] = [
  { name: 'CES', month: 1, day: 6, type: 'conference', emoji: '🖥️', blurb: 'The world\'s biggest consumer tech showcase opens in Las Vegas.', city: 'Las Vegas' },
  { name: 'Samsung Galaxy Unpacked', month: 1, day: 22, type: 'launch', emoji: '📱', blurb: 'Samsung\'s flagship Galaxy S-series unveiling.', city: 'San Francisco' },
  { name: 'MWC Barcelona', month: 2, day: 24, type: 'conference', emoji: '📡', blurb: 'Mobile World Congress — the telecom industry\'s biggest stage.', city: 'Barcelona' },
  { name: 'GDC', month: 3, day: 18, type: 'conference', emoji: '🎮', blurb: 'Game Developers Conference — the industry gathers to talk shop.', city: 'San Francisco' },
  { name: 'Google I/O', month: 5, day: 14, type: 'keynote', emoji: '🤖', blurb: 'Google\'s big developer keynote — Android, AI, and search news.', city: 'Mountain View' },
  { name: 'Apple WWDC', month: 6, day: 9, type: 'keynote', emoji: '🍎', blurb: 'Apple\'s Worldwide Developers Conference opening keynote.', city: 'Cupertino' },
  { name: 'Prime Day Tech Drop', month: 7, day: 15, type: 'launch', emoji: '📦', blurb: 'A wave of hardware announcements riding along with Prime Day.', city: 'Seattle' },
  { name: 'IFA Berlin', month: 9, day: 4, type: 'conference', emoji: '🌍', blurb: 'Europe\'s biggest consumer electronics show.', city: 'Berlin' },
  { name: 'Apple September Event', month: 9, day: 9, type: 'launch', emoji: '🚀', blurb: 'Apple\'s annual iPhone and Watch launch event.', city: 'Cupertino' },
  { name: 'Meta Connect', month: 9, day: 24, type: 'keynote', emoji: '🕶️', blurb: 'Meta\'s AR/VR and AI keynote.', city: 'Menlo Park' },
  { name: 'Microsoft Ignite', month: 11, day: 17, type: 'conference', emoji: '💼', blurb: 'Microsoft\'s enterprise, cloud, and AI conference.', city: 'Chicago' },
  { name: 'AWS re:Invent', month: 12, day: 1, type: 'conference', emoji: '☁️', blurb: 'AWS\'s massive cloud-computing conference.', city: 'Las Vegas' },
];

function eventKey(e: TechEvent) { return `${e.name}-${e.month}-${e.day}`; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function monthDiff(a: Date, b: Date) { return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); }
function nextOccurrence(month: number, day: number, from: Date): Date {
  const year = from.getFullYear();
  let candidate = new Date(year, month - 1, day);
  if (candidate < from) candidate = new Date(year + 1, month - 1, day);
  return candidate;
}
function daysUntil(d: Date, from: Date) { return Math.round((d.getTime() - from.getTime()) / 86400000); }
function eventsOnDay(date: Date) { return TECH_EVENTS.filter(e => e.month === date.getMonth() + 1 && e.day === date.getDate()); }
function isSameDay(a: Date, b: Date) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function fmtMonthYear(d: Date) { return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
function fmtDay(d: Date) { return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }); }

function buildGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = startWeekday - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, daysInPrev - i), inMonth: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), inMonth: true });
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function TechEventsCalendar() {
  const { data: session } = useSession();
  // TODO: adjust to match your real Pro-status field on the session user object.
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';
  const { toast, showToast } = useToast();
  const commentRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const thisMonthStart = useMemo(() => startOfMonth(today), [today]);

  const [viewDate, setViewDate] = useState(() => startOfMonth(today));
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('left');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [toolLiked, setToolLiked] = useState(false);
  const [toolLikeCount, setToolLikeCount] = useState(94);

  // Load saved watchlist for Pro users
  useEffect(() => {
    if (!isPro) return;
    fetch('/api/tools/tech-events')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data?.watchlist) setWatchlist(new Set(data.watchlist)); })
      .catch(() => {});
  }, [isPro]);

  function requireAuth(): boolean {
    if (!session?.user) { showToast('Sign in to use this feature'); return false; }
    return true;
  }

  const grid = useMemo(() => buildGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const monthsAhead = monthDiff(thisMonthStart, viewDate);

  const goMonth = useCallback((delta: number) => {
    const target = new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1);
    const aheadCheck = monthDiff(thisMonthStart, target);
    if (!isPro && aheadCheck > FREE_MONTHS_AHEAD) {
      showToast('Upgrade to Pro to browse further into the future ✨');
      return;
    }
    setSlideDir(delta > 0 ? 'left' : 'right');
    setViewDate(target);
  }, [viewDate, isPro, thisMonthStart, showToast]);

  const upcoming = useMemo(() => {
    return TECH_EVENTS.map(e => ({ e, date: nextOccurrence(e.month, e.day, today) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [today]);

  const watchlistUpcoming = useMemo(() => {
    return TECH_EVENTS.filter(e => watchlist.has(eventKey(e)))
      .map(e => ({ e, date: nextOccurrence(e.month, e.day, today) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [watchlist, today]);

  async function toggleWatchlist(e: TechEvent) {
    if (!requireAuth()) return;
    if (!isPro) { showToast('Saving your watchlist is a Pro feature ✨'); return; }
    const key = eventKey(e);
    const next = new Set(watchlist);
    next.has(key) ? next.delete(key) : next.add(key);
    setWatchlist(next);
    setSaving(true);
    try {
      await fetch('/api/tools/tech-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ watchlist: Array.from(next) }),
      });
      showToast(next.has(key) ? 'Added to your watchlist' : 'Removed from watchlist');
    } catch {
      showToast('Could not save — try again');
    } finally {
      setSaving(false);
    }
  }

  function handleLike() {
    if (!requireAuth()) return;
    setToolLiked(l => !l);
    setToolLikeCount(c => (toolLiked ? c - 1 : c + 1));
  }
  function handleShare() {
    navigator.clipboard?.writeText(typeof window !== 'undefined' ? window.location.href : '');
    showToast('Link copied!');
  }
  function handleCommentJump() {
    commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function handleCopyPlan() {
    const events = eventsOnDay(selectedDate);
    if (!events.length) { showToast('No event on this date to copy'); return; }
    const text = events.map(e => `${e.emoji} ${e.name} (${TYPE_LABEL[e.type]}) — ${fmtDay(selectedDate)}, ${e.city}\n${e.blurb}`).join('\n\n');
    navigator.clipboard?.writeText(text);
    showToast('Plan copied to clipboard');
  }

  const selectedEvents = eventsOnDay(selectedDate);

  return (
    <div className="anim-fade-up">
      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.1)` }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>TECH · EVENTS</p>
            <h2 className="text-title2">Tech Events Calendar</h2>
            <p className="text-callout mt-1" style={{ color: 'var(--text-secondary)' }}>
              Every major keynote, launch, and conference on one beautiful calendar.
            </p>
          </div>
          {!isPro && (
            <span className="pill text-xs font-bold" style={{ background: `rgba(${GLOW}, 0.12)`, color: `rgb(${GLOW})` }}>
              🔒 Free: {FREE_MONTHS_AHEAD + 1}-month window
            </span>
          )}
        </div>

        {/* Upcoming ticker */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6" style={{ scrollbarWidth: 'none' }}>
          {upcoming.map(({ e, date }) => (
            <button key={eventKey(e)} onClick={() => { setViewDate(startOfMonth(date)); setSelectedDate(date); }}
              className="ios-card-nested press flex-shrink-0 flex items-center gap-2 px-3 py-2"
              style={{ border: `1px solid rgba(${TYPE_COLOR[e.type]}, 0.35)` }}>
              <span>{e.emoji}</span>
              <span className="text-footnote font-semibold whitespace-nowrap">{e.name}</span>
              <span className="text-caption" style={{ color: `rgb(${TYPE_COLOR[e.type]})` }}>{daysUntil(date, today)}d</span>
            </button>
          ))}
        </div>

        {/* Calendar */}
        <div className="ios-card-nested p-4 sm:p-5 mb-6" style={{ overflow: 'visible' }}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => goMonth(-1)} className="press w-9 h-9 rounded-full flex items-center justify-center ios-card-nested">←</button>
            <div key={fmtMonthYear(viewDate)} className="text-headline anim-fade-up" style={{ animationDuration: '250ms' }}>
              {fmtMonthYear(viewDate)}
              {monthsAhead === 0 && <span className="text-caption ml-2" style={{ color: `rgb(${GLOW})` }}>● today</span>}
            </div>
            <button onClick={() => goMonth(1)} className="press w-9 h-9 rounded-full flex items-center justify-center ios-card-nested">→</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={i} className="text-caption text-center font-bold" style={{ color: 'var(--text-secondary)' }}>{w}</div>
            ))}
          </div>

          <div key={fmtMonthYear(viewDate)} className="grid grid-cols-7 gap-1" style={{ animation: `${slideDir === 'left' ? 'slideInFromRight' : 'slideInFromLeft'} 280ms ease-out`, overflow: 'visible' }}>
            {grid.map((cell, idx) => {
              const events = eventsOnDay(cell.date);
              const isToday = isSameDay(cell.date, today);
              const isSelected = isSameDay(cell.date, selectedDate);
              const rowA = Math.floor(idx / 7), colA = idx % 7;
              const rowB = hoveredIdx === null ? rowA : Math.floor(hoveredIdx / 7);
              const colB = hoveredIdx === null ? colA : hoveredIdx % 7;
              const dist = hoveredIdx === null ? 99 : Math.max(Math.abs(rowA - rowB), Math.abs(colA - colB));
              const glow = dist === 0 ? 0.9 : dist === 1 ? 0.32 : dist === 2 ? 0.1 : 0;
              const primaryEvent = events[0];
              const showTooltip = hoveredIdx === idx && events.length > 0;
              const tooltipBelow = rowA === 0; // first row: flip tooltip downward so it doesn't clip off-screen
              const tooltipRight = colA >= 5;  // rightmost columns: nudge tooltip left so it doesn't clip
              const tooltipLeft = colA <= 1;   // leftmost columns: nudge tooltip right

              return (
                <button
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setSelectedDate(cell.date)}
                  className="press relative flex flex-col items-center justify-center rounded-xl transition-all duration-150"
                  style={{
                    aspectRatio: '1',
                    opacity: cell.inMonth ? 1 : 0.28,
                    zIndex: showTooltip ? 40 : 1,
                    background: isSelected
                      ? `rgba(${GLOW}, 0.22)`
                      : glow > 0
                      ? `rgba(${GLOW}, ${glow * 0.18})`
                      : 'transparent',
                    boxShadow: isSelected
                      ? `0 0 0 1.5px rgb(${GLOW})`
                      : isToday
                      ? `inset 0 0 0 1.5px rgba(${GLOW}, 0.5)`
                      : primaryEvent
                      ? `inset 0 0 0 1px rgba(${TYPE_COLOR[primaryEvent.type]}, 0.35)`
                      : 'none',
                    transform: dist === 0 && hoveredIdx !== null ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  <span className="text-footnote font-semibold">{cell.date.getDate()}</span>
                  {events.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {events.slice(0, 3).map((e, i) => (
                        <span key={i} className="rounded-full" style={{ width: 5, height: 5, background: `rgb(${TYPE_COLOR[e.type]})` }} />
                      ))}
                    </div>
                  )}

                  {showTooltip && primaryEvent && (
                    <div
                      className="event-tooltip"
                      style={{
                        position: 'absolute',
                        [tooltipBelow ? 'top' : 'bottom']: 'calc(100% + 10px)',
                        left: tooltipLeft ? '0' : tooltipRight ? 'auto' : '50%',
                        right: tooltipRight ? '0' : 'auto',
                        transform: tooltipLeft || tooltipRight ? 'none' : 'translateX(-50%)',
                        transformOrigin: tooltipBelow ? 'top center' : 'bottom center',
                        background: 'var(--bg-elevated, #1c1c1e)',
                        border: `1px solid rgba(${TYPE_COLOR[primaryEvent.type]}, 0.5)`,
                        boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(${TYPE_COLOR[primaryEvent.type]}, 0.25)`,
                        borderRadius: 14,
                        padding: '10px 14px',
                        minWidth: 180,
                        maxWidth: 220,
                        whiteSpace: 'normal',
                        textAlign: 'left',
                        pointerEvents: 'none',
                      }}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span style={{ fontSize: 15 }}>{primaryEvent.emoji}</span>
                        <span className="text-footnote font-bold" style={{ color: 'var(--text-primary, #fff)', lineHeight: 1.2 }}>{primaryEvent.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="pill text-xs font-bold" style={{ background: `rgba(${TYPE_COLOR[primaryEvent.type]}, 0.18)`, color: `rgb(${TYPE_COLOR[primaryEvent.type]})`, padding: '1px 8px' }}>
                          {TYPE_LABEL[primaryEvent.type]}
                        </span>
                        <span className="text-caption" style={{ color: 'var(--text-secondary)' }}>{primaryEvent.city}</span>
                      </div>
                      {events.length > 1 && (
                        <p className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>+{events.length - 1} more that day</p>
                      )}
                      <div
                        style={{
                          position: 'absolute',
                          [tooltipBelow ? 'top' : 'bottom']: -5,
                          left: tooltipLeft ? 16 : tooltipRight ? 'auto' : '50%',
                          right: tooltipRight ? 16 : 'auto',
                          transform: tooltipLeft || tooltipRight ? 'rotate(45deg)' : 'translateX(-50%) rotate(45deg)',
                          width: 10,
                          height: 10,
                          background: 'var(--bg-elevated, #1c1c1e)',
                          borderRight: !tooltipBelow ? `1px solid rgba(${TYPE_COLOR[primaryEvent.type]}, 0.5)` : 'none',
                          borderBottom: !tooltipBelow ? `1px solid rgba(${TYPE_COLOR[primaryEvent.type]}, 0.5)` : 'none',
                          borderLeft: tooltipBelow ? `1px solid rgba(${TYPE_COLOR[primaryEvent.type]}, 0.5)` : 'none',
                          borderTop: tooltipBelow ? `1px solid rgba(${TYPE_COLOR[primaryEvent.type]}, 0.5)` : 'none',
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {(Object.keys(TYPE_LABEL) as EventType[]).map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <span className="rounded-full" style={{ width: 8, height: 8, background: `rgb(${TYPE_COLOR[t]})` }} />
              <span className="text-caption">{TYPE_EMOJI[t]} {TYPE_LABEL[t]}</span>
            </div>
          ))}
        </div>

        {/* Selected day detail */}
        <div className="ios-card-nested p-4 mb-6 anim-fade-up" key={selectedDate.toDateString()}>
          <p className="text-headline mb-2">{fmtDay(selectedDate)}</p>
          {selectedEvents.length === 0 ? (
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No major tech events on this date. Tap another day, or star an event from the ticker above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedEvents.map(e => {
                const key = eventKey(e);
                const saved = watchlist.has(key);
                return (
                  <div key={key} className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `rgba(${TYPE_COLOR[e.type]}, 0.14)` }}>{e.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-headline">{e.name}</p>
                        <span className="pill text-xs font-bold" style={{ background: `rgba(${TYPE_COLOR[e.type]}, 0.15)`, color: `rgb(${TYPE_COLOR[e.type]})` }}>{TYPE_LABEL[e.type]}</span>
                      </div>
                      <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{e.blurb} · {e.city}</p>
                    </div>
                    <button onClick={() => toggleWatchlist(e)} disabled={saving} className="press text-lg flex-shrink-0" title={isPro ? 'Save to watchlist' : 'Pro feature'}>
                      {isPro ? (saved ? '⭐' : '☆') : '🔒'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Watchlist (Pro) */}
        {isPro ? (
          watchlistUpcoming.length > 0 && (
            <div className="ios-card-nested p-4 mb-6">
              <p className="text-footnote font-semibold mb-3">⭐ Your watchlist</p>
              <div className="flex flex-col gap-2">
                {watchlistUpcoming.map(({ e, date }) => (
                  <div key={eventKey(e)} className="flex items-center justify-between gap-2">
                    <span className="text-footnote">{e.emoji} {e.name}</span>
                    <span className="text-caption" style={{ color: `rgb(${TYPE_COLOR[e.type]})` }}>{daysUntil(date, today)}d away</span>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="ios-card-nested p-4 mb-6 flex items-center justify-between gap-3 flex-wrap" style={{ border: '1px solid var(--border-hairline)' }}>
            <div>
              <p className="text-footnote font-bold mb-0.5">🔒 Free plan: {FREE_MONTHS_AHEAD + 1}-month browsing window, no saved watchlist</p>
              <p className="text-caption">Upgrade to Premium to browse any month past or future and save your own event watchlist.</p>
            </div>
            <button className="btn-filled press text-xs px-4 py-2 flex-shrink-0" onClick={() => showToast('Redirecting to upgrade…')}>Upgrade to Premium — $4/mo</button>
          </div>
        )}

        <div className="flex items-center justify-end mb-6">
          <button onClick={handleCopyPlan} className="ios-card-nested press text-xs px-3 py-2" style={{ color: 'var(--text-secondary)' }}>📋 Copy plan</button>
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

      <div ref={commentRef}>
        <ToolCommentSection seedComments={TECH_EVENTS_COMMENTS} onRequireAuth={requireAuth} glow={GLOW} />
      </div>
      <ToastHost toast={toast} />

      <style jsx>{`
        @keyframes slideInFromRight {
          from { transform: translateX(24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-24px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes tooltipPop {
          0% { opacity: 0; transform: scale(0.85) translateY(4px); }
          60% { opacity: 1; transform: scale(1.03) translateY(0); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .event-tooltip {
          animation: tooltipPop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
}
