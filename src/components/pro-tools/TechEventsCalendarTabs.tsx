// FILE: src/components/pro-tools/TechEventsCalendarTabs.tsx
'use client';
import { useState } from 'react';
import { TechEventsCalendar } from './TechEventsCalendar';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool', label: 'Tool', emoji: '📅' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '162, 137, 255';

export function TechEventsCalendarTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="ios-card-nested p-1.5 flex mb-6 relative" style={{ maxWidth: 320, margin: '0 auto 24px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="press flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors duration-300"
            style={{ color: tab === t.id ? 'white' : 'var(--text-secondary)' }}>
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
        <div className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{ width: 'calc(50% - 6px)', left: tab === 'tool' ? '6px' : 'calc(50% + 0px)', background: `rgb(${GLOW})`, boxShadow: `0 0 16px rgba(${GLOW}, 0.5)` }} />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><TechEventsCalendar /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '👉', title: 'Browse the calendar', body: 'Use the arrows to move month to month. Hover over any day and watch nearby days glow — the calendar reacts to where you\'re looking.' },
    { emoji: '🔵', title: 'Spot event dots', body: 'Colored dots under a date mean something\'s happening — blue for conferences, coral for launches, and the accent color for keynotes. Check the legend under the calendar.' },
    { emoji: '👆', title: 'Tap a day', body: 'Tap any date with a dot to see the full event card below the calendar: what it is, where it\'s happening, and a countdown.' },
    { emoji: '⭐', title: 'Star an event (Pro)', body: 'Tap the star on any event to add it to your personal watchlist — it\'ll show up in the "Your watchlist" panel with a live countdown, and it\'s saved to your account.' },
    { emoji: '🎟️', title: 'Jump from the ticker', body: 'The scrolling strip at the top always shows the soonest events — tap one to jump the calendar straight to it.' },
    { emoji: '📋', title: 'Copy the plan', body: 'Selected a day with an event? "Copy plan" puts all the details on your clipboard, ready to paste into notes or a calendar invite.' },
    { emoji: '🔒', title: 'Free tier: current + next month only', body: 'Free accounts can browse today\'s month and one month ahead. Pro unlocks unlimited browsing in both directions, plus a saved, syncing watchlist.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Tech Events Calendar</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Every major keynote, launch, and conference — laid out on a calendar built to feel great to browse.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `rgba(${GLOW}, 0.12)` }}>{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: `rgb(${GLOW})` }}>{i + 1}</span>
                <p className="text-headline">{s.title}</p>
              </div>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ios-card-nested p-4 mb-6 flex flex-col gap-2" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <p className="text-footnote flex gap-3 items-start"><span className="text-lg flex-shrink-0">⚠️</span><span style={{ color: 'var(--text-secondary)' }}>Dates reflect each event's typical historical timing — official organizers usually confirm the exact date a few months out, so treat these as a strong planning estimate rather than a locked confirmation.</span></p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
