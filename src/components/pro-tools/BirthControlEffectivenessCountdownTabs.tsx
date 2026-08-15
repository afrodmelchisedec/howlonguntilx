// FILE: src/components/pro-tools/BirthControlEffectivenessCountdownTabs.tsx
'use client';
import { useState } from 'react';
import { BirthControlEffectivenessCountdown } from './BirthControlEffectivenessCountdown';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool', label: 'Tool', emoji: '🌀' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '150, 111, 255';

export function BirthControlEffectivenessCountdownTabs() {
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
        <div key="tool" className="anim-fade-up"><BirthControlEffectivenessCountdown /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🌀', title: 'Pick your method', body: 'Nine common methods, each with its own typical timing to full effectiveness.' },
    { emoji: '🎚️', title: 'Set your start date and cycle day', body: 'Drag the slider to the day of your cycle you started — starting in the first 5 days is usually counted as immediate.' },
    { emoji: '🚨', title: 'Emergency contraception works differently', body: 'Plan B shows a closing window instead of a building coverage meter — sooner is always better here.' },
    { emoji: '💊', title: 'Track refills (Pro)', body: 'Set how many days before a refill or expiry you want a reminder, on a slider.' },
    { emoji: '📖', title: 'Keep a method history (Pro)', body: 'Log a method when you switch so you always know what you were using and when.' },
    { emoji: '🔗', title: 'Share Coverage Watch (Pro)', body: 'A read-only link showing method and coverage percentage only — no personal notes.' },
  ];
  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Coverage Countdown</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>General timing windows, turned into something you can actually watch tick forward.</p>
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
          General, typical windows only — not personalized medical advice. Follow your specific prescription's instructions and check with your provider or pharmacist.
        </p>
      </div>
      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
