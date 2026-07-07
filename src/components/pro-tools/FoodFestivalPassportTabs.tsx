// FILE: src/components/pro-tools/FoodFestivalPassportTabs.tsx
'use client';
import { useState } from 'react';
import { FoodFestivalPassport } from './FoodFestivalPassport';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🎪' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 90, 54';

export function FoodFestivalPassportTabs() {
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
        <div key="tool" className="anim-fade-up"><FoodFestivalPassport /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🖐️', title: 'Swipe to discover festivals', body: 'Drag a card right to add it to your passport, left to skip it — or just tap the 👍/👎 buttons underneath the deck.' },
    { emoji: '🎫', title: 'Read your ticket stub', body: 'Your nearest upcoming festival gets a real ticket-stub countdown at the top, ticking down to the day.' },
    { emoji: '✅', title: 'Stamp it when you go', body: 'Tap "I went!" on any festival card to mark it attended — it gets a sepia stamp effect and stays in your passport forever.' },
    { emoji: '💰', title: 'Watch the budget math', body: 'Ticket and food budget amounts are click-to-edit — the save-per-week number recalculates instantly based on how far away your festivals are.' },
    { emoji: '🌍', title: 'Check your cuisine variety', body: 'The bar list shows which cuisines are underrepresented in your passport — a nudge to branch out.' },
    { emoji: '✨', title: 'Add your own festival (Pro)', body: "If a festival isn't in the deck, Pro users can add it manually with a name, cuisine, location, date, and budget." },
    { emoji: '🔒', title: 'Free tier caps at 4 festivals, 6-card deck', body: 'Pro unlocks up to 15 festivals, a 10-card deck, custom festivals, full multi-festival budget projection, and saving your passport.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Festival Passport</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A bucket list that counts down instead of just sitting there — swipe, save, and stamp your way through it.
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
          Deck festival dates are estimates based on typical scheduling and don't reflect official announced dates — always confirm before booking travel.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
