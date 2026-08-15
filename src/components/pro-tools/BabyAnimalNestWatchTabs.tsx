// FILE: src/components/pro-tools/BabyAnimalNestWatchTabs.tsx
'use client';
import { useState } from 'react';
import { BabyAnimalNestWatch } from './BabyAnimalNestWatch';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool', label: 'Tool', emoji: '🐣' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 179, 71';

export function BabyAnimalNestWatchTabs() {
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
        <div key="tool" className="anim-fade-up"><BabyAnimalNestWatch /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🐦', title: 'Pick an animal', body: 'Bird, bunny, kitten, or puppy — each has its own real-world milestone timeline.' },
    { emoji: '📅', title: 'Enter when it arrived', body: 'Hatch date or birth date — no account needed for the timeline.' },
    { emoji: '🎚️', title: 'Scrub through time', body: 'Drag the day slider to preview what\'s typically ahead at any age, not just today.' },
    { emoji: '🧠', title: 'Try Guess the Stage', body: 'A quick 8-question quiz mixing all four species — see your tier and share your score.' },
    { emoji: '🍼', title: 'Curious about human babies too?', body: 'The Newborn Milestone Tracker works the same way, with growth check-ins and family sharing built in.' },
  ];
  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of Baby Animal Nest-Watch</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>General ranges for four species, turned into something fun to check and share.</p>
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
          General ranges that vary by species, breed, and individual — not a diagnostic timeline. If you've found a wild animal you're worried about, a local wildlife rehabilitator is the right call, not this list.
        </p>
      </div>
      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
