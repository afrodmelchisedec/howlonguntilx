// FILE: src/components/pro-tools/FraudResponseClockTabs.tsx
'use client';
import { useState } from 'react';
import { FraudResponseClock } from './FraudResponseClock';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🛡️' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 59, 92';

export function FraudResponseClockTabs() {
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
        <div key="tool" className="anim-fade-up"><FraudResponseClock /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '➕', title: 'Add an incident', body: 'Tap "Add incident" — click the emoji to change the fraud type (card, identity theft, phishing/wire, check, or account takeover).' },
    { emoji: '📅', title: 'Set when you discovered it', body: 'Both deadline markers recalculate automatically from this date — accuracy here matters more than anything else in the tool.' },
    { emoji: '⏱️', title: 'Watch the deadline countdown', body: 'Each incident shows its nearest deadline in days — it turns red and shows "window likely closed" if both markers have passed.' },
    { emoji: '✅', title: 'Work the checklist', body: "Check off each recommended step as you complete it — the progress bar fills so you always know what's left." },
    { emoji: '🕸️', title: 'Read your Risk Radar', body: 'The five-axis chart shows exposure across all fraud types based on what you\'re tracking — the sharper the shape, the more concentrated your risk.' },
    { emoji: '✏️', title: 'Adjust deadlines (Pro)', body: 'Real dispute windows vary by bank and card network — Pro lets you edit the day counts to match what your issuer actually told you.' },
    { emoji: '🕹️', title: 'Drag the radar (Pro)', body: 'Override the auto-computed score on any axis to reflect your own sense of exposure, not just what\'s currently tracked.' },
    { emoji: '📞', title: 'Use the emergency contacts card', body: 'Tap copy on any resource — your card issuer, IdentityTheft.gov, ReportFraud.ftc.gov, IC3.gov, or AnnualCreditReport.com.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Fraud Response Clock</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          The deadlines here are the whole point — miss them and your legal protections can shrink or disappear.
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
          This is not legal advice. Deadline windows are common general guidelines (like Reg E and the Fair Credit Billing Act) — always confirm exact terms with your bank, card issuer, or a legal professional, since they vary by institution and situation.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
