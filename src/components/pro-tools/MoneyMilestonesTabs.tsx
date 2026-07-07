// FILE: src/components/pro-tools/MoneyMilestonesTabs.tsx
'use client';
import { useState } from 'react';
import { MoneyMilestones } from './MoneyMilestones';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '📈' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '52, 199, 89';

export function MoneyMilestonesTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
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
        <div key="tool" className="anim-fade-up"><MoneyMilestones /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🎯', title: 'Drag a milestone pin on the curve', body: 'Grab any milestone pin and drag it up or down — it slides horizontally on its own to the exact month your projected balance reaches that amount.' },
    { emoji: '🎉', title: 'Watch for the confetti', body: 'Drag a milestone below your current balance and it flips to "already reached" with a little celebration — a fast, satisfying way to sanity-check a goal.' },
    { emoji: '🌡️', title: 'Drag the contribution thermometer', body: 'The vertical bar sets how much you save per month — drag it and every milestone on the chart recalculates its ETA live.' },
    { emoji: '🎛️', title: 'Turn the growth-rate knob', body: 'Rotate the dial to set your expected annual return — the curve reshapes in real time and "this month\'s growth" updates instantly.' },
    { emoji: '📅', title: 'Pick your horizon', body: 'Choose how many years out to project. Free plans are capped at 5 years — milestones further out sit pinned to the edge of the chart until you extend it.' },
    { emoji: '✨', title: 'Add a fully custom milestone (Pro)', body: 'Name it, pick an emoji, and set a target — free plans can only cycle through preset milestone templates.' },
    { emoji: '📋', title: 'Copy your report or invite a friend', body: 'Copy a clean text summary of your whole plan, or copy a shareable invite with your next milestone baked in.' },
    { emoji: '🔒', title: 'Free tier: 3 milestones, 5yr horizon, 6% rate cap', body: 'Pro unlocks up to 8 milestones, a 30-year horizon, 20% growth rates, custom milestones, and saving your plan.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Growth Timeline</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Not "how much have I saved" — "how long until I hit $X". Drag your plan into shape and watch the countdown to every goal move in real time.
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
          This is a projection based on a constant contribution and return rate — it doesn't account for taxes, fees, market volatility, or irregular income.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
