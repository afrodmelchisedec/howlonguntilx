// FILE: src/components/embeds/TechEventsCalendarEmbed.tsx
'use client';
import { useState, useMemo } from 'react';

const GLOW = '162, 137, 255';

type EventType = 'launch' | 'keynote' | 'conference';
interface TechEvent { name: string; month: number; day: number; type: EventType; emoji: string; city: string; }

const TYPE_COLOR: Record<EventType, string> = {
  launch: '255, 138, 101',
  keynote: GLOW,
  conference: '129, 178, 255',
};

const TECH_EVENTS: TechEvent[] = [
  { name: 'CES', month: 1, day: 6, type: 'conference', emoji: '🖥️', city: 'Las Vegas' },
  { name: 'MWC Barcelona', month: 2, day: 24, type: 'conference', emoji: '📡', city: 'Barcelona' },
  { name: 'Google I/O', month: 5, day: 14, type: 'keynote', emoji: '🤖', city: 'Mountain View' },
  { name: 'Apple WWDC', month: 6, day: 9, type: 'keynote', emoji: '🍎', city: 'Cupertino' },
  { name: 'Apple September Event', month: 9, day: 9, type: 'launch', emoji: '🚀', city: 'Cupertino' },
  { name: 'AWS re:Invent', month: 12, day: 1, type: 'conference', emoji: '☁️', city: 'Las Vegas' },
];

function eventKey(e: TechEvent) { return `${e.name}-${e.month}-${e.day}`; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
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

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.1)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f7',
};

export function TechEventsCalendarEmbed() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [viewDate, setViewDate] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const grid = useMemo(() => buildGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  const upcoming = useMemo(() => {
    return TECH_EVENTS.map(e => ({ e, date: nextOccurrence(e.month, e.day, today) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
  }, [today]);

  function goMonth(delta: number) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  }

  const selectedEvents = eventsOnDay(selectedDate);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>TECH · EVENTS</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Tech Events Calendar</h3>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
        {upcoming.map(({ e, date }) => (
          <button
            key={eventKey(e)}
            onClick={() => { setViewDate(startOfMonth(date)); setSelectedDate(date); }}
            style={{
              flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
              borderRadius: 10, background: '#0a0e14', border: `1px solid rgba(${TYPE_COLOR[e.type]}, 0.35)`,
              color: '#f2f2f7', fontSize: 12, cursor: 'pointer',
            }}
          >
            <span>{e.emoji}</span>
            <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{e.name}</span>
            <span style={{ color: `rgb(${TYPE_COLOR[e.type]})` }}>{daysUntil(date, today)}d</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#0a0e14', borderRadius: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button onClick={() => goMonth(-1)} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f2f2f7', cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{fmtMonthYear(viewDate)}</div>
          <button onClick={() => goMonth(1)} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#f2f2f7', cursor: 'pointer' }}>→</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
          {WEEKDAY_LABELS.map((w, i) => (
            <div key={i} style={{ fontSize: 9, textAlign: 'center', fontWeight: 700, color: '#8e8e93' }}>{w}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {grid.map((cell, idx) => {
            const events = eventsOnDay(cell.date);
            const isToday = isSameDay(cell.date, today);
            const isSelected = isSameDay(cell.date, selectedDate);
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(cell.date)}
                style={{
                  aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  opacity: cell.inMonth ? 1 : 0.28,
                  background: isSelected ? `rgba(${GLOW}, 0.25)` : 'transparent',
                  boxShadow: isSelected ? `0 0 0 1.5px rgb(${GLOW})` : isToday ? `inset 0 0 0 1.5px rgba(${GLOW}, 0.5)` : 'none',
                  color: '#f2f2f7',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600 }}>{cell.date.getDate()}</span>
                {events.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                    {events.slice(0, 3).map((e, i) => (
                      <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: `rgb(${TYPE_COLOR[e.type]})` }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedEvents.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {selectedEvents.map((e, i) => (
            <div key={i} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{e.emoji}</span>
              <span style={{ fontWeight: 600 }}>{e.name}</span>
              <span style={{ color: '#8e8e93' }}>· {e.city}</span>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '14px 0 0' }}>
        Example lineup shown for preview — tap any date to see events, or a ticker chip to jump to it.
      </p>
    </div>
  );
}
