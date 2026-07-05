// FILE: src/components/pro-tools/RecipeBatchDialTabs.tsx
'use client';
import { useState } from 'react';
import { RecipeBatchDial } from './RecipeBatchDial';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🍪' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];

export function RecipeBatchDialTabs() {
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
            <span>{t.emoji}</span>{t.label}
          </button>
        ))}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: 'rgb(255, 122, 60)',
            boxShadow: '0 0 16px rgba(255, 122, 60, 0.5)',
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><RecipeBatchDial /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '📖', title: 'Pick a recipe', body: 'Tap "Change recipe" to switch between the built-in recipes — each remembers its own default serving size.' },
    { emoji: '🎛️', title: 'Drag the dial', body: 'Grab the orange knob and rotate it around the dial. Every ingredient bar restretches live, no need to release your finger first.' },
    { emoji: '🔢', title: 'Watch the multiplier', body: 'The center readout shows both the serving count and the batch multiplier (e.g. "3x") so you always know how far you\'ve scaled from the original.' },
    { emoji: '🍳', title: 'Heed the batch tip', body: 'Past 3x, a tip appears reminding you that oven and mixing-bowl capacity are real constraints — not just math.' },
    { emoji: '📋', title: 'Copy the scaled list', body: 'Tap "Copy list" to grab a clean, scaled ingredient list for your shopping app or notes — no manual multiplication.' },
    { emoji: '🔒', title: 'Free tier caps at 8 servings', body: `Dragging past 8 servings clamps the dial there and shows an upgrade prompt. Pro unlocks scaling up to 60 servings and lets you save your batch size to your account.` },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(255,122,60,0.2), 0 0 40px rgba(255,122,60,0.08)' }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(255, 122, 60)' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Batch-Scale Dial</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Scale any recipe up or down by feel, and watch every ingredient adjust in real time.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255,122,60,0.12)' }}>
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(255, 122, 60)' }}>{i + 1}</span>
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
          Amounts are rounded for kitchen practicality — very small ingredients (like a pinch of salt) may not scale perfectly linearly at extreme multiples.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
