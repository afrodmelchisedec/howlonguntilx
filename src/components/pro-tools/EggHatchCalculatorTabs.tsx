// FILE: src/components/pro-tools/EggHatchCalculatorTabs.tsx
'use client';
import { useState } from 'react';
import { EggHatchCalculator } from './EggHatchCalculator';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🥚' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '91, 192, 222';

export function EggHatchCalculatorTabs() {
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
        <div key="tool" className="anim-fade-up"><EggHatchCalculator /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🐦', title: 'Pick a species', body: 'Swipe through chicken, duck, goose, or a wild-nesting species like bluebird, dove, eagle, or house finch.' },
    { emoji: '📅', title: 'Enter the start date', body: 'For backyard incubation, use the day you set the eggs. For a wild nest, use the day you noticed incubation had started.' },
    { emoji: '⏱️', title: 'Watch the countdown', body: 'A live timer counts down to the estimated hatch date, with a ring showing overall progress.' },
    { emoji: '🔄', title: 'Follow the turning schedule (incubator species)', body: 'Chicken, duck, and goose eggs get a day-by-day turning calendar that automatically locks at the 3-day pre-hatch window.' },
    { emoji: '🌡️', title: 'Check the gauge', body: 'Toggle still-air vs. forced-air to see the right target temperature, and watch humidity jump automatically once lockdown starts.' },
    { emoji: '💾', title: 'Save and track a clutch (Pro)', body: 'Pin your tracker across visits, check off each day you turned the eggs, and log candling results per egg in the batch.' },
    { emoji: '🐦', title: 'Found a wild nest instead?', body: 'The tool switches to a nest-watch mode with no turning or gauge — plus a note on why you shouldn\u2019t handle wild eggs yourself.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Egg Hatch Calculator</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          One tool for backyard incubators and curious birdwatchers alike — the interface adapts to which kind of egg you're watching.
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
          Estimates are commonly-cited averages, not guarantees. For wild species, please don't handle eggs or nests — contact a licensed wildlife rehabilitator with any concerns.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
