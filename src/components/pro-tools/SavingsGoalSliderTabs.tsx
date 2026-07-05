// FILE: src/components/pro-tools/SavingsGoalSliderTabs.tsx
'use client';
import { useState } from 'react';
import { SavingsGoalSlider } from './SavingsGoalSlider';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '💰' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '52, 199, 89';

export function SavingsGoalSliderTabs() {
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
        <div key="tool" className="anim-fade-up"><SavingsGoalSlider /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🎚️', title: 'Drag the monthly-total slider', body: 'Slide right to save more per month, left to save less. Every goal\'s months-to-goal recalculates instantly.' },
    { emoji: '📊', title: 'Drag the dividers on the stacked bar', body: 'Grab any divider between two goals to shift dollars between them — the neighbor shrinks by exactly what the other gains.' },
    { emoji: '✏️', title: 'Rename a goal', body: 'Click any goal\'s name to rename it — great for turning "Gift" into "Mom\'s 60th Birthday".' },
    { emoji: '💵', title: 'Edit saved & target amounts', body: 'Click either dollar figure on a goal card to update how much you\'ve saved so far or what you\'re aiming for.' },
    { emoji: '🔒', title: 'Lock a goal\'s allocation (Pro)', body: 'Tap the lock icon on a goal to freeze its share — the dividers touching it disable so dragging neighbors can\'t steal from it.' },
    { emoji: '🥶', title: 'Watch for frozen-goal warnings', body: 'If a goal is getting less than $15/mo, a warning banner appears since it\'ll take an extremely long time to fund at that rate.' },
    { emoji: '🔒', title: 'Free tier: 3 goals, $2,000/mo cap', body: 'Free plans keep the starter trio (Vacation, Emergency Fund, Gift) and cap monthly savings at $2,000. Pro unlocks up to 6 goals, $20,000/mo, locking, and saving your setup.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Goal Stack Planner</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          See exactly where every dollar of your monthly savings is going — and how much sooner each goal lands if you shift it.
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
          This tool assumes a fixed monthly savings amount — it doesn't account for interest, irregular income, or unexpected expenses dipping into what you've already saved.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
