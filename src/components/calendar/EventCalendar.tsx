'use client';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { prettifyRegion, getRegionGlow, CALENDAR_REGIONS, type CalendarEvent } from '@/lib/calendar';
import { ToolProGate } from '@/components/pro-tools/ToolProGate';

type CalendarMap = Record<string, CalendarEvent[]>;

interface Props {
  initialYear: number;
  initialMonth: number; // 1-12
  initialEvents: CalendarMap;
  isPro: boolean;
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function EventCalendar({ initialYear, initialMonth, initialEvents, isPro }: Props) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarMap>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState<string>('all');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [monthLockNotice, setMonthLockNotice] = useState(false);

  const today = todayIso();

  const filteredEvents = useMemo<CalendarMap>(() => {
    if (region === 'all') return events;
    const out: CalendarMap = {};
    for (const date of Object.keys(events)) {
      const matches = events[date].filter(e => e.region === region);
      if (matches.length) out[date] = matches;
    }
    return out;
  }, [events, region]);

  const changeMonth = useCallback((delta: number) => {
    // Free users are locked to the initial (current) month — browsing
    // other months is a Pro feature, not just a timed preview.
    if (!isPro && (month + delta !== initialMonth || year !== initialYear)) {
      setMonthLockNotice(true);
      setTimeout(() => setMonthLockNotice(false), 2500);
      return;
    }
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setMonth(m);
    setYear(y);
  }, [month, year, isPro, initialMonth, initialYear]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (modalDate) return;
      if (e.key === 'ArrowLeft') changeMonth(-1);
      if (e.key === 'ArrowRight') changeMonth(1);
      if (e.key === 'Escape') setModalDate(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [changeMonth, modalDate]);

  useEffect(() => {
    if (year === initialYear && month === initialMonth) { setEvents(initialEvents); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/calendar?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setEvents(data.events ?? {}); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year, month, initialYear, initialMonth, initialEvents]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(year, month - 1, 1);
    const startWeekday = firstOfMonth.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells: { iso: string | null; day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ iso: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ iso, day: d });
    }
    return cells;
  }, [year, month]);

  const modalEvents = modalDate ? (filteredEvents[modalDate] ?? []) : [];
  const activeModalEvent = modalEvents[modalIndex % Math.max(modalEvents.length, 1)];
  const isModalFuture = modalDate ? modalDate >= today : false;

  function openDay(iso: string) {
    if (!filteredEvents[iso]?.length) return;
    setModalDate(iso);
    setModalIndex(Math.floor(Math.random() * filteredEvents[iso].length));
  }

  function shuffle() {
    if (!modalDate) return;
    const list = filteredEvents[modalDate] ?? [];
    if (list.length < 2) return;
    let next = Math.floor(Math.random() * list.length);
    while (next === modalIndex % list.length) next = Math.floor(Math.random() * list.length);
    setModalIndex(next);
  }

  return (
    <div className="ios-card p-6 relative">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => changeMonth(-1)} className="press ios-card-nested px-3 py-1.5" aria-label="Previous month">←</button>
          <h2 className="text-title2" style={{ minWidth: 180, textAlign: 'center' }}>{MONTH_LABELS[month - 1]} {year}</h2>
          <button onClick={() => changeMonth(1)} className="press ios-card-nested px-3 py-1.5" aria-label="Next month">→</button>
        </div>
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="ios-card-nested px-3 py-1.5 text-footnote"
          style={{ color: 'var(--text-primary)' }}
        >
          <option value="all">All regions</option>
          {CALENDAR_REGIONS.map(r => (
            <option key={r} value={r}>{prettifyRegion(r)}</option>
          ))}
        </select>
      </div>

      <p className="text-footnote mb-4" style={{ color: 'var(--text-tertiary)' }}>
        {isPro
          ? 'Use ← → to change months · hover a day for a preview · click for a random fact'
          : 'Hover a day for a preview · click for a random fact · Pro unlocks every month'}
      </p>

      {monthLockNotice && (
        <div className="mb-4 ios-card-nested px-4 py-2.5 flex items-center justify-between gap-3 anim-fade-up">
          <span className="text-footnote">⭐ Browsing other months is a Pro feature</span>
          <button className="btn-filled press text-xs px-3 py-1.5">Upgrade</button>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map(w => (
          <div key={w} className="text-caption text-center py-1">{w}</div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-40' : 'opacity-100'}`}>
        {grid.map((cell, i) => {
          if (!cell.iso) return <div key={i} />;
          const dayEvents = filteredEvents[cell.iso] ?? [];
          const hasEvents = dayEvents.length > 0;
          const isToday = cell.iso === today;
          const isFuture = cell.iso > today;
          const isPast = cell.iso < today;
          const isHovered = hoveredDate === cell.iso;

          return (
            <div key={cell.iso} className="relative">
              <button
                onClick={() => openDay(cell.iso!)}
                onMouseEnter={() => setHoveredDate(cell.iso)}
                onMouseLeave={() => setHoveredDate(null)}
                disabled={!hasEvents}
                className="w-full aspect-square rounded-xl flex flex-col items-center justify-center relative transition-transform"
                style={{
                  border: isToday ? '2px solid rgb(var(--accent-brand))' : '1px solid var(--border-hairline)',
                  background: hasEvents ? 'var(--bg-elevated, rgba(255,255,255,0.03))' : 'transparent',
                  cursor: hasEvents ? 'pointer' : 'default',
                  transform: isHovered && hasEvents ? 'scale(1.06)' : 'scale(1)',
                  opacity: isPast && !hasEvents ? 0.5 : 1,
                }}
              >
                <span className="text-callout font-semibold">{cell.day}</span>
                {hasEvents && (
                  <span
                    className="absolute bottom-1.5 rounded-full"
                    style={{
                      width: 6, height: 6,
                      background: 'rgb(var(--accent-brand))',
                      animation: isFuture ? 'dotPulse 1.8s ease-out infinite' : 'none',
                    }}
                  />
                )}
              </button>

              {isHovered && hasEvents && (
                <div
                  className="absolute z-20 anim-fade-up"
                  style={{ bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', width: 200 }}
                >
                  <div className="ios-card p-3" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                    <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>
                      {isFuture ? '🔮 Coming up' : isPast ? '📅 Happened' : '📍 Today'}
                    </p>
                    <p className="text-footnote font-semibold line-clamp-2">{dayEvents[0].event}</p>
                    {dayEvents.length > 1 && (
                      <p className="text-caption mt-1">+{dayEvents.length - 1} more</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalDate && activeModalEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setModalDate(null)}
        >
          <div onClick={e => e.stopPropagation()} className="max-w-sm w-full">
            <ToolProGate
              isPro={isPro}
              previewSeconds={3}
              title="Unlock the full calendar"
              desc="Get unlimited random facts, shuffle through every event on a date, and browse any month of the year."
            >
              <div
                className={`ios-card p-6 text-left calendar-bubble gc-${getRegionGlow(activeModalEvent.region)} glow`}
                style={{ boxShadow: 'var(--shadow-elevated)' }}
              >
                <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>
                  {isModalFuture ? '🔮 Coming up' : '📅 On this day'} · {prettifyRegion(activeModalEvent.region)}
                </p>
                <h3 className="text-title3 mb-2">{activeModalEvent.event}</h3>
                <p className="text-callout mb-5" style={{ color: 'var(--text-secondary)' }}>
                  {activeModalEvent.description}
                </p>
                <div className="flex gap-2">
                  {modalEvents.length > 1 && (
                    <button onClick={shuffle} className="btn-filled flex-1">🔀 Another fact</button>
                  )}
                  <button onClick={() => setModalDate(null)} className="ios-card-nested px-4 py-2 press">Close</button>
                </div>
              </div>
            </ToolProGate>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dotPulse {
          0%   { box-shadow: 0 0 0 0 rgba(var(--accent-brand), 0.5); }
          70%  { box-shadow: 0 0 0 8px rgba(var(--accent-brand), 0); }
          100% { box-shadow: 0 0 0 0 rgba(var(--accent-brand), 0); }
        }
        .calendar-bubble {
          animation: bubblePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bubblePop {
          0%   { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
