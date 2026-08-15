// FILE: src/components/pro-tools/KittenGrowthTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { KittenGrowthTracker } from './KittenGrowthTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🐈' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '224, 146, 66';

export function KittenGrowthTrackerTabs() {
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
        <div key="tool" className="anim-fade-up"><KittenGrowthTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '📅', title: 'Enter the birth date and breed size', body: 'Don\'t know the exact date? Use today\'s date as a placeholder — the timeline still shows what to expect.' },
    { emoji: '⏱️', title: 'Watch the live countdown', body: 'The ticking timer always points at the next milestone your kitten hasn\'t hit yet — eyes opening, first steps, weaning, and beyond.' },
    { emoji: '🎚️', title: 'Drag the scrubber to explore', body: 'Slide it to any age — even ones in the future — to preview what\'s typically happening at that stage.' },
    { emoji: '💾', title: 'Save your tracker (Pro)', body: 'Free trackers reset when you leave. Pro pins yours so it keeps running across every visit, on any device.' },
    { emoji: '⚖️', title: 'Log real weight (Pro)', body: 'Plot actual weigh-ins against the breed-average growth curve to spot if your kitten is tracking large, small, or right on pace.' },
    { emoji: '✅', title: 'Log actual milestone dates (Pro)', body: 'Tap any milestone card to record the real date it happened, instead of just the estimate.' },
    { emoji: '🐾', title: 'Compare littermates (Pro)', body: 'Add up to 5 kittens from the same litter to see how their development lines up.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Kitten Growth Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Built on widely-cited feline life-stage averages — a guide to what's typical, not a prediction about your kitten specifically.
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
          Every kitten develops at its own pace. If something feels off — lethargy, not eating, not gaining weight — talk to a vet rather than relying on this timeline.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
