// FILE: src/components/pro-tools/SportsGamesTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { SportsGamesTracker } from './SportsGamesTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🏆' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '0, 209, 255';

export function SportsGamesTrackerTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
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
          style={{ width: 'calc(50% - 6px)', left: tab === 'tool' ? '6px' : 'calc(50% + 0px)', background: `rgb(${GLOW})`, boxShadow: `0 0 16px rgba(${GLOW}, 0.5)` }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><SportsGamesTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '➕', title: 'Add a game', body: 'Tap "Add event" to pull the next unused template — click the sport emoji or team dots to change type and colors, or click a team name to rename it.' },
    { emoji: '🖥️', title: 'Watch the scoreboard', body: 'Your nearest upcoming game gets a jumbotron-style hero at the top with both teams and a live day countdown.' },
    { emoji: '🟩', title: 'Read the density heatmap', body: 'Each column is a week, each square a day — brighter squares mean more games stacked on that day, so you can spot a packed weekend before it happens.' },
    { emoji: '🏆', title: 'Drag the prediction slider', body: 'Pull the trophy toward whichever team you think wins — it locks once you log a result.' },
    { emoji: '✅', title: 'Log the result (Pro)', body: "Once a game's date has passed, three buttons appear — logging a result updates your running Prediction Accuracy score." },
    { emoji: '🥊', title: 'Watch rivalries build (Pro)', body: 'Reuse the same two team names for a recurring matchup and a head-to-head record automatically appears after the second game.' },
    { emoji: '📤', title: 'Invite friends to a watch party', body: 'Toggle Watch Party on any event to reveal an invite button that copies a ready-to-send message.' },
    { emoji: '🔒', title: 'Free tier caps at 3 events, 4-week heatmap', body: 'Pro unlocks up to 10 events, a 12-week heatmap, result logging, rivalries, custom events, and saving your tracker.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Game Day Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Every countdown in this suite tells you when — this one also tells you how good your gut has actually been.
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

      <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          This tracks games and matchups you enter yourself — it doesn't pull live scores or official schedules, so double-check real game times before making plans.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
