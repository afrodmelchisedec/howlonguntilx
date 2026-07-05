// FILE: src/components/pro-tools/DeadlineBufferSliderTabs.tsx
'use client';
import { useState } from 'react';
import { DeadlineBufferSlider } from './DeadlineBufferSlider';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '📆' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '84, 158, 255';

export function DeadlineBufferSliderTabs() {
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
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: `rgb(${GLOW})`,
            boxShadow: `0 0 16px rgba(${GLOW}, 0.5)`,
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><DeadlineBufferSlider /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🎚️', title: 'Drag the launch-date slider', body: 'Slide the handle right to push your launch date out, or left to pull it in. Working days (excluding weekends) recalculate instantly.' },
    { emoji: '🚦', title: 'Watch the health badge', body: 'The pill next to the title shifts between ✅ Comfortable, ⚠️ Getting tight, and 🚨 Very tight based on how many working days you actually have left.' },
    { emoji: '🖐️', title: 'Drag the phase dividers', body: 'Grab any divider on the Design/Development/QA bar to reallocate working days between phases — the day counts below update live.' },
    { emoji: '🗓️', title: 'Read the timeline calendar', body: 'Each square is a day, colored by whichever phase owns it. Gray squares are weekends; red squares are marked holidays.' },
    { emoji: '🖱️', title: 'Mark custom holidays (Pro)', body: 'Click any weekday square to mark it as a holiday — it\'s excluded from the working-day count and shown in red. Click again to unmark it.' },
    { emoji: '📊', title: 'Check the weekly bar chart', body: 'Shows how many working days fall in each calendar week, so you can spot short weeks caused by holidays or the timeline\'s edges.' },
    { emoji: '🔒', title: 'Free tier caps at 30 days out', body: 'Dragging past 30 days clamps there with an upgrade prompt. Pro unlocks planning up to 180 days out, up to 5 phases, custom holidays, and saving your setup.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Launch Countdown Planner</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          See exactly how much real working time you have before launch — and where it's actually going.
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
          This tool only accounts for weekends and holidays you mark yourself — it doesn't know about team PTO, sick days, or public holidays automatically.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
