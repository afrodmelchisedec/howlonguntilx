// FILE: src/components/pro-tools/RunwayLabTabs.tsx
'use client';
import { useState } from 'react';
import { RunwayLab } from './RunwayLab';

type Tab = 'tool' | 'guide';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '💰' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];

export function RunwayLabTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
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
            background: 'rgb(var(--accent-brand))',
            boxShadow: '0 0 16px rgba(var(--accent-brand), 0.5)',
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up">
          <RunwayLab />
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
      emoji: '🎚️',
      title: 'Set your basics',
      body: 'Drag the four sliders — days until payday, income this period, fixed expenses, and what you\'ve already spent today — to match your real numbers.',
    },
    {
      emoji: '🚦',
      title: 'Watch the health badge',
      body: 'The pill next to the title shifts between ✅ Healthy, ⚠️ Getting tight, and 🚨 High risk in real time as your fixed expenses eat into your income.',
    },
    {
      emoji: '🖐️',
      title: 'Drag the split-bar dividers',
      body: 'Grab any divider on the four-color bar to reallocate your discretionary spend across Food, Transport, Fun, and Other — the percentages always add up to 100%.',
    },
    {
      emoji: '📉',
      title: 'Read the projected balance chart',
      body: 'This line shows your money running down to zero across the days remaining until payday, recalculating instantly as you adjust anything above it.',
    },
    {
      emoji: '⏱️',
      title: 'Free preview is 3 seconds',
      body: 'On the free plan, the simulator stays interactive for the first 3 seconds — then locks so you can upgrade to keep exploring different scenarios.',
    },
    {
      emoji: '❤️',
      title: 'Like, share, and comment freely',
      body: 'The like/share/comment bar and the comment section below stay usable even after the simulator locks — only the dragging itself is Pro-gated.',
    },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(var(--accent-brand), 0.2), 0 0 40px rgba(var(--accent-brand), 0.08)' }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of Runway Lab</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          See exactly how healthy your budget is before payday — and where a little reallocation goes a long way.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(var(--accent-brand), 0.12)' }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(var(--accent-brand))' }}>{i + 1}</span>
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
          This tool is for planning and awareness only — it doesn't connect to your real bank account. Numbers you
          enter here stay local to your session unless you're on Pro with saved history.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">
        Try it now →
      </button>
    </div>
  );
}
