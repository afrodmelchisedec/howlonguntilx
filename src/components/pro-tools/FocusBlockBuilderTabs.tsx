// FILE: src/components/pro-tools/FocusBlockBuilderTabs.tsx
'use client';
import { useState } from 'react';
import { FocusBlockBuilder } from './FocusBlockBuilder';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🧱' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '138, 124, 255';

export function FocusBlockBuilderTabs() {
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
        <div key="tool" className="anim-fade-up"><FocusBlockBuilder /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🖐️', title: 'Drag a block to move it', body: 'Grab the body of any block and drag it left or right along the timeline — its start time updates live.' },
    { emoji: '↔️', title: 'Drag the right edge to resize', body: 'Grab the thin handle on a block\'s right edge to stretch or shrink its duration.' },
    { emoji: '🔴', title: 'Watch the capacity bar', body: 'It fills as you allocate hours and turns red with an OVERCOMMITTED label the instant your total exceeds 24 hours.' },
    { emoji: '🟧', title: 'Check the overlap density strip', body: 'This colors by how many blocks share the same clock time — green is fine, orange is two blocks stacked, red is three or more.' },
    { emoji: '📊', title: 'Read the category bar chart', body: 'Each column totals your hours per category and animates up or down live as you drag or resize blocks.' },
    { emoji: '✨', title: 'Add a fully custom block (Pro)', body: 'Tap Custom block to name it yourself and set an exact category, start time, and duration in one form — free plan can only cycle through preset templates.' },
    { emoji: '🏷️', title: "Click a block's emoji to change category", body: 'Cycles through Work, Health, Personal, Break, Sleep, and Social — its color updates everywhere instantly.' },
    { emoji: '🔒', title: 'Free tier caps at 4 blocks, 15-min snap', body: 'Pro unlocks up to 10 blocks, 5-minute drag precision, custom-named blocks, and saving your day.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Day Timeline</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Drag your whole day into shape and watch exactly where the hours are going — and where they're double-booked.
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
          This plans a single day and doesn't carry over to tomorrow — reset or save separate setups for different day types like weekdays vs. weekends.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
