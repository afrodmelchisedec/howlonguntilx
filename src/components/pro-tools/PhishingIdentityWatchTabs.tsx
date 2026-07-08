// FILE: src/components/pro-tools/PhishingIdentityWatchTabs.tsx
'use client';
import { useState } from 'react';
import { PhishingIdentityWatch } from './PhishingIdentityWatch';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🎣' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '6, 182, 212';

export function PhishingIdentityWatchTabs() {
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
          style={{ width: 'calc(50% - 6px)', left: tab === 'tool' ? '6px' : 'calc(50% + 0px)', background: `rgb(${GLOW})`, boxShadow: `0 0 16px rgba(${GLOW}, 0.5)` }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><PhishingIdentityWatch /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '☑️', title: 'Check off what applies', body: 'Reading a suspicious email or text? Tick every red flag that matches — the needle on the Threat Gauge swings live as you go.' },
    { emoji: '🌡️', title: 'Read the verdict', body: 'Under 25% reads safe, 25–54% suspicious, 55%+ likely phishing — with a plain-language recommendation underneath.' },
    { emoji: '✏️', title: 'Adjust severity weights (Pro)', body: "Not every red flag is equally dangerous — Pro lets you edit how much each one counts, since context matters." },
    { emoji: '🎣', title: 'Play Spot the Phish', body: 'Read a real-style message snippet, guess Phishing or Legit, then flip to see the verdict and why — your accuracy tracks across rounds.' },
    { emoji: '🛡️', title: 'Build your Identity Watch list', body: 'Add monitoring categories like email breach checks or credit report reviews — each one has a real recommended cadence.' },
    { emoji: '✅', title: 'Mark checked today', body: "Did the check? Tap it and the countdown resets — free for everyone, no gate on staying protected." },
    { emoji: '🔒', title: 'Free tier caps at 6 flags, 5 quiz cards, 3 watch categories', body: 'Pro unlocks all 12 flags with editable weights, the full 10-card quiz, up to 8 watch categories, custom categories, and saving.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of Phishing Radar & Identity Watch</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Catch the message before you click it, and catch the overdue check before it becomes an incident.
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
          This is an educational heuristic, not a guarantee — a low score doesn't confirm a message is safe. When in doubt, verify independently through an official channel rather than replying or clicking.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
