// FILE: src/components/pro-tools/SymptomEscalationTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { SymptomEscalationTracker } from './SymptomEscalationTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '⚠️' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '216, 90, 48';

export function SymptomEscalationTrackerTabs() {
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
        <div key="tool" className="anim-fade-up"><SymptomEscalationTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '☑️', title: 'Check what applies to you right now', body: 'The checklist covers common red flags — localized pain, fever, spreading swelling, breathing trouble, and more — each weighted by how urgent it typically is.' },
    { emoji: '📊', title: 'Read your urgency score', body: 'Green (0-29%) means monitor at home, amber (30-59%) means see a doctor soon, red (60%+) means seek care now.' },
    { emoji: '➕', title: 'Add anything not on the list (Pro)', body: 'Up to 2 custom symptoms, each adding to your score, for whatever your specific situation doesn\'t already cover.' },
    { emoji: '📋', title: 'Log today (Pro)', body: 'Saves today\'s check-in, builds a streak, and unlocks your 7-day trend line so you can see whether things are escalating or improving.' },
    { emoji: '📈', title: 'Watch the trend, not just one score', body: 'A single check-in is a snapshot — the trend line is what actually tells you if you\'re getting better or worse.' },
    { emoji: '🔒', title: 'Free tier: check-in only, no history', body: 'Pro unlocks daily logging, the trend chart, streaks, and custom symptoms.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Symptom Escalation Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          This turns "should I be worried?" into a number you can actually track day over day, instead of guessing from memory.
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
          This is general information, not a diagnosis. It's meant to help you decide how quickly to seek care, not replace a doctor's judgment. If you're in the "seek care now" zone, don't wait on this tool — go get care.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
