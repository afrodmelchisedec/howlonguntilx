// FILE: src/components/pro-tools/SubscriptionDensityTabs.tsx
'use client';
import { useState } from 'react';
import { SubscriptionDensityMap } from './SubscriptionDensityMap';

type Tab = 'tool' | 'guide';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '📅' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];

export function SubscriptionDensityTabs() {
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
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: 'rgb(var(--accent-orange))',
            boxShadow: '0 0 16px rgba(var(--accent-orange), 0.5)',
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up">
          <SubscriptionDensityMap />
        </div>
      ) : (
        <div key="guide" className="anim-fade-up">
          <HowToUseGuide onTryIt={() => setTab('tool')} />
        </div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    {
      emoji: '➕',
      title: 'Add your subscriptions',
      body: 'Tap a preset (Netflix, Spotify, Gym, etc.) to add it to your tray. Each one comes with a typical price you can adjust later by removing and re-adding.',
    },
    {
      emoji: '🖐️',
      title: 'Drag it onto its renewal date',
      body: 'Grab a chip from the tray and drop it onto the day of the month it actually renews. The calendar cell glows while you hover over it.',
    },
    {
      emoji: '🔁',
      title: 'Reposition anytime',
      body: 'Already-placed subscriptions can be dragged again straight from the calendar — grab the small colored bubble on any day to move it.',
    },
    {
      emoji: '📊',
      title: 'Watch the weekly heat bar',
      body: 'The bar above the calendar recalculates instantly as you drag, turning red when a week is about to take a heavy hit on your card.',
    },
    {
      emoji: '🔥',
      title: 'Spot renewal pile-ups',
      body: 'A day with 3 or more charges gets a fire badge — a sign to consider spreading those renewal dates out across the month.',
    },
    {
      emoji: '🚨',
      title: 'Catch duplicate billing',
      body: 'If you add the same subscription name twice, a red banner flags it — a common way people notice they\'re accidentally paying for the same service on two cards.',
    },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(255,159,10,0.2), 0 0 40px rgba(255,159,10,0.08)' }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-orange))' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Density Map</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          See exactly which weeks your subscriptions hit hardest — and catch duplicate charges before they surprise you.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(var(--accent-orange), 0.12)' }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(var(--accent-orange))' }}>{i + 1}</span>
                <p className="text-headline">{s.title}</p>
              </div>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ios-card-nested p-4 mb-6 flex gap-3 items-start" style={{ borderLeft: '3px solid rgb(var(--accent-red))' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          This tool is for personal awareness only — it doesn't connect to your real bank or card. Use it as a
          visual planning aid, and always verify actual charges on your official statement.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">
        Try it now →
      </button>
    </div>
  );
}
