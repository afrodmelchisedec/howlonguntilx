// FILE: src/components/pro-tools/RestaurantLaunchesTabs.tsx
'use client';
import { useState } from 'react';
import { RestaurantLaunches } from './RestaurantLaunches';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🍽️' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 107, 53';

export function RestaurantLaunchesTabs() {
  const [tab, setTab] = useState<Tab>('tool');

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
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: `rgb(${GLOW})`,
            boxShadow: `0 0 16px rgba(${GLOW}, 0.5)`,
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><RestaurantLaunches /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🍽️', title: 'Browse upcoming launches', body: 'Every card shows a live countdown ring, a ticking clock, and a short blurb about the new spot. Filter by cuisine or sort by soonest vs. most hyped.' },
    { emoji: '🔥', title: 'Hype it up', body: 'Tap "Hype it up!" on any restaurant — the hype bar fills and a little "+N" floats up. Do it as much as you want, it\'s free and unlimited.' },
    { emoji: '⭐', title: 'Build your watchlist', body: 'Tap "+ Watchlist" to track a restaurant. It\'ll show up below with its own live countdown.' },
    { emoji: '🖐️', title: 'Drag to reorder', body: 'Grab the ⠿ handle on any watchlist item and drag it up or down to reorder by priority.' },
    { emoji: '🎉', title: 'Get the heads-up', body: 'When something on your watchlist is opening in under 3 days, a banner appears so you don\'t miss it.' },
    { emoji: '🔒', title: 'Free tier tracks 3', body: 'Free plan covers a 3-restaurant watchlist. Pro unlocks up to 30, lets you add your own custom restaurant launches, and saves your list to your account.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Grand Opening Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Never miss a new restaurant opening near you again.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `rgba(${GLOW}, 0.12)` }}>
              {s.emoji}
            </div>
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
          The seeded restaurants are illustrative examples, not real confirmed openings.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
