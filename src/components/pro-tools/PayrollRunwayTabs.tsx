// FILE: src/components/pro-tools/PayrollRunwayTabs.tsx
'use client';
import { useState } from 'react';
import { PayrollRunway } from './PayrollRunway';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '💵' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 184, 0';

export function PayrollRunwayTabs() {
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
        <div key="tool" className="anim-fade-up"><PayrollRunway /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '📅', title: 'Set your pay cycle', body: 'Pick your frequency, your last pay date, and your gross pay per period — everything downstream recalculates instantly.' },
    { emoji: '⏱️', title: 'Watch the countdown', body: 'The flip-digit clock counts down to your exact next payday, with a thin progress bar showing how far you are through the current period.' },
    { emoji: '🎚️', title: 'Drag your deduction sliders', body: 'Tax and retirement rates are draggable — the breakdown bar underneath animates live to show exactly where your gross pay goes.' },
    { emoji: '🖐️', title: 'Drag bills onto the runway', body: 'Each bill is a colored dot you can drag along the current pay period — it recurs at that same offset every future period automatically.' },
    { emoji: '📉', title: 'Read the cash-flow runway', body: 'This chart projects your balance forward using your bills and paydays — it shades red the instant your projected balance would dip below zero.' },
    { emoji: '🔒', title: 'Watch the locked paydays', body: 'Free plans see one period ahead; Pro unlocks up to four, so you can see further into your financial future.' },
    { emoji: '✨', title: 'Play with the Raise Simulator (Pro)', body: 'Drag a hypothetical raise percentage and instantly see your new net pay and new cash floor side by side with your current numbers.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Payday Runway</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Not just a countdown to payday — a live projection of whether your money survives until it arrives.
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
          This is a planning estimate based on the numbers you enter — it doesn't connect to your bank and doesn't account for overtime, bonuses, or irregular bills you haven't added.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
