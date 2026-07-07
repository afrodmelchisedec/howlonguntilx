// FILE: src/components/pro-tools/TaxBudgetDeadlinesTabs.tsx
'use client';
import { useState } from 'react';
import { TaxBudgetDeadlines } from './TaxBudgetDeadlines';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🧾' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '245, 166, 35';

export function TaxBudgetDeadlinesTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
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
        <div key="tool" className="anim-fade-up"><TaxBudgetDeadlines /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🎯', title: 'Watch your Safe-Harbor Score', body: 'One number, weighted across every deadline by dollar size. Every dollar you log moves it live.' },
    { emoji: '👆', title: 'Drag any bar up or down', body: 'The whole column is grabbable, not just a tiny handle — drag up to log savings toward that deadline, drag down to correct a mistake.' },
    { emoji: '💬', title: 'Hover for the full picture', body: 'A tooltip appears above the bar showing the name, due date, funded %, and exact dollar amounts while you hover or drag.' },
    { emoji: '✏️', title: 'Click a dollar amount to edit it exactly', body: 'The dashed outline is your target; the solid fill is what you\'ve saved. Click either number on a deadline card for pinpoint editing instead of dragging.' },
    { emoji: '⚡', title: 'Use a Quick setup preset', body: 'Tap W2 Employee, Self-Employed, or Business Owner to instantly load the right deadline set for your situation.' },
    { emoji: '📈', title: 'Read the funded-percent line chart', body: 'Shows how well-funded each deadline is, left to right in date order — a quick way to spot the one lagging behind.' },
    { emoji: '🚨', title: 'Watch for the underfunded banner', body: 'Fires the moment a deadline is 14 days out or closer and still isn\'t fully funded.' },
    { emoji: '✨', title: 'Add a fully custom deadline (Pro)', body: 'Name it, pick a category, set a due date and target amount in one form — great for state-specific or business deadlines.' },
    { emoji: '🔒', title: 'Free tier caps at 3 deadlines, $250 per drag step', body: 'Pro unlocks up to 8 deadlines, $25 drag precision, custom deadlines, and saving your setup.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Safe-Harbor Planner</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Every tax deadline, one dollar amount each, one score that tells you exactly how ready you are.
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
          This is a planning aid, not tax advice — actual amounts owed depend on your income, deductions, and jurisdiction. Confirm real deadlines and figures with the IRS, your state, or a tax professional.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
