// FILE: src/components/pro-tools/GardenGrowthTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { GardenGrowthTracker } from './GardenGrowthTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🌱' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '138, 201, 87';

export function GardenGrowthTrackerTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
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
        <div key="tool" className="anim-fade-up"><GardenGrowthTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🌸', title: 'Pick a plant', body: 'Dahlia, carrots, onions, or grass seed — each has its own germination window and its own final payoff, bloom or harvest.' },
    { emoji: '📅', title: 'Enter your planting date', body: 'Tuber planted, seeds sown, whatever applies — that\'s the day the whole countdown starts from.' },
    { emoji: '🌿', title: 'Watch the stem grow', body: 'The Grow Stem fills in as your plant statistically progresses — leaves appear at two points, and the final bloom or harvest icon blooms in near the end.' },
    { emoji: '🪜', title: 'Read the stage timeline', body: 'Four connected steps — Planted, Sprouted, Growing, Bloom or Harvest — show exactly where you are right now.' },
    { emoji: '🌤️', title: 'Adjust for your season (Pro)', body: 'Nudge the estimate for a warmer or cooler season than average — a rough adjustment, not a forecast.' },
    { emoji: '💾', title: 'Save your beds (Pro)', body: 'Free resets when you leave. Pro saves up to 8 beds, so every planting picks up right where it left off.' },
    { emoji: '🔗', title: 'Share Garden Watch (Pro)', body: 'Generate a read-only link so family or neighbors can watch a bed\'s countdown without needing an account.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(138, 201, 87, 0.2), 0 0 40px rgba(138, 201, 87, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(138, 201, 87)' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Garden Growth & Bloom Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          One flexible countdown for whatever you've got in the ground.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(138, 201, 87, 0.12)' }}>{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(138, 201, 87)' }}>{i + 1}</span>
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
          Germination and bloom or harvest timing vary a lot by climate zone, soil temperature, and frost dates — this is a statistical average, not a forecast for your specific garden.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
