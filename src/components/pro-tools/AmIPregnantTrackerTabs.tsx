// FILE: src/components/pro-tools/AmIPregnantTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { AmIPregnantTracker } from './AmIPregnantTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🌙' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 138, 179'; // warm pink-coral — distinct from Life Expectancy's calm green

export function AmIPregnantTrackerTabs() {
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
        <div key="tool" className="anim-fade-up"><AmIPregnantTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🩸', title: 'Enter your last period date', body: 'That, plus your cycle length, is enough to estimate your ovulation date and where you are in the wait right now.' },
    { emoji: '🎛️', title: 'Drag the cycle-length dial', body: 'Most cycles run 21–35 days. Drag the ring to your typical length — the estimate recalculates instantly as you move it.' },
    { emoji: '🌊', title: 'Read the Hormone Horizon', body: 'The glowing wave shows statistical hCG detection odds by day. The pulsing marker is today — watch it climb toward the gold "reliable" zone.' },
    { emoji: '🫧', title: 'Tap symptoms you\'re noticing', body: 'Each bubble is sized by how predictive that symptom tends to be. Tapping nudges your probability meter — today only on the free plan.' },
    { emoji: '🧭', title: 'Check the probability needle', body: 'One glance tells you which zone you\'re in: Too Early, Possible, Likely, or Test Now.' },
    { emoji: '📅', title: 'Keep your streak (Pro)', body: 'Free resets every visit. Pro saves each day\'s check-in, so the horizon fills in with your real history instead of just today.' },
    { emoji: '🔗', title: 'Share Bump Watch (Pro)', body: 'Generate a read-only link so a partner or family member can follow your countdown — no symptom data included, just the horizon and the date.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(255, 138, 179, 0.2), 0 0 40px rgba(255, 138, 179, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(255, 138, 179)' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Probability Tracker</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A statistical companion for the wait — not a test, and not a promise.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255, 138, 179, 0.12)' }}>{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(255, 138, 179)' }}>{i + 1}</span>
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
          This estimates statistical detection odds for a typical cycle — it cannot confirm or rule out pregnancy for any individual. Only a test, and if needed a clinician, can do that.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}