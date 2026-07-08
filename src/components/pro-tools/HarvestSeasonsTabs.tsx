// FILE: src/components/pro-tools/HarvestSeasonsTabs.tsx
'use client';
import { useState } from 'react';
import { HarvestSeasons } from './HarvestSeasons';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🌾' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '154, 205, 50';

export function HarvestSeasonsTabs() {
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
        <div key="tool" className="anim-fade-up"><HarvestSeasons /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🔍', title: 'Search and add produce', body: 'Type in the search box or tap any chip to add that item to your basket — no swiping this time, just point and tap.' },
    { emoji: '📅', title: 'Read the season timeline', body: 'Each row is a full year — the light band is the whole season, the bright glowing band is peak, and the vertical line shows exactly where today falls.' },
    { emoji: '🌡️', title: 'Watch the freshness meters', body: 'Every basket card has a live 0–100% meter based on where today sits in that item\'s season curve — it climbs toward peak and fades after.' },
    { emoji: '🗂️', title: 'Basket auto-sorts by urgency', body: 'Whatever is at peak right now floats to the top, followed by whatever transitions soonest — the most useful item is always first.' },
    { emoji: '🌏', title: 'Flip hemispheres (Pro)', body: 'If you\'re south of the equator, toggle to Southern and every season window shifts by six months automatically.' },
    { emoji: '✨', title: 'Add your own produce (Pro)', body: 'Got a backyard tree or a regional specialty not in the catalog? Add it with your own name, emoji, and exact season dates.' },
    { emoji: '🔔', title: 'Peak Alerts (Pro)', body: 'A banner surfaces anything entering peak or starting season within the next 7 days, so you never miss the window.' },
    { emoji: '🔒', title: 'Free tier caps at 5 items, Northern Hemisphere', body: 'Pro unlocks up to 15 items, the hemisphere toggle, custom produce, Peak Alerts, and saving your basket.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Season Basket</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Not a static produce chart — a live calendar that tells you exactly what's worth buying this week.
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
          Season windows are general estimates for typical climates — local growing conditions, greenhouse produce, and specific regions can shift actual availability.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
