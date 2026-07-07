// FILE: src/components/calendar/EventCalendarTabs.tsx
'use client';
import { useState } from 'react';
import { EventCalendar } from './EventCalendar';
import type { CalendarEvent } from '@/lib/calendar-shared';

type CalendarMap = Record<string, CalendarEvent[]>;

interface Props {
  initialYear: number;
  initialMonth: number;
  initialEvents: CalendarMap;
  isPro: boolean;
}

type Tab = 'calendar' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'calendar', label: 'Calendar',   emoji: '🗓️' },
  { id: 'guide',    label: 'How to use', emoji: '💡' },
];

export function EventCalendarTabs(props: Props) {
  const [tab, setTab] = useState<Tab>('calendar');

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="ios-card-nested p-1.5 flex mb-6 relative" style={{ maxWidth: 320, margin: '0 auto 24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="press flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors duration-300"
            style={{ color: tab === t.id ? 'white' : 'var(--text-secondary)' }}
          >
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'calendar' ? '6px' : 'calc(50% + 0px)',
            background: 'rgb(var(--accent-brand))',
            boxShadow: '0 0 16px rgba(var(--accent-brand), 0.5)',
          }}
        />
      </div>

      {tab === 'calendar' ? (
        <div key="calendar" className="anim-fade-up"><EventCalendar {...props} /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('calendar')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🖱️', title: 'Hover any day', body: 'Days with recorded history show a small glowing dot. Hover over one for a quick preview before you click.' },
    { emoji: '🗓️', title: 'Click for the full story', body: 'Click any day to open it fully — you\'ll see every recorded event for that date.' },
    { emoji: '🕰️📍🚀', title: 'Past, Present, Future bubbles', body: 'Every day you open gets tagged: 🕰️ Past, 📍 Today, or 🚀 Future — with the exact number of days for extra context.' },
    { emoji: '🌍', title: 'Filter by region', body: 'Use the region dropdown to narrow events down to one part of the world at a time.' },
    { emoji: '⭐', title: 'Save your favorite days (Pro)', body: 'Tap the star inside any day\'s popup to bookmark it — saved days appear in a quick-jump strip above the calendar.' },
    { emoji: '🔒', title: 'Free tier shows the current month', body: 'Free plan is locked to today\'s month. Pro unlocks browsing to any month, past or future, plus saving favorite days.' },
    { emoji: '❤️', title: 'Like, copy, and share', body: 'Every day\'s facts can be liked, copied to your clipboard, or shared as a direct link — and you can like/share the whole calendar tool too.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(var(--accent-brand), 0.2), 0 0 40px rgba(var(--accent-brand), 0.08)' }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Event Calendar</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Every day has a story — hover, click, and explore what happened on any date.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(var(--accent-brand), 0.12)' }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(var(--accent-brand))' }}>{i + 1}</span>
                <p className="text-headline">{s.title}</p>
              </div>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
