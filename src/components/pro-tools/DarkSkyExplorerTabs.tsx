// FILE: src/components/pro-tools/DarkSkyExplorerTabs.tsx
'use client';
import { useState } from 'react';
import { DarkSkyExplorer } from './DarkSkyExplorer';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🌌' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '110, 231, 183';

export function DarkSkyExplorerTabs() {
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
        <div key="tool" className="anim-fade-up"><DarkSkyExplorer /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '📍', title: 'Set a real location for each spot', body: 'Tap "Edit location" and either use your device GPS or type coordinates directly — this is what makes moonrise, moonset, and true-darkness times actually accurate for that place.' },
    { emoji: '👆', title: 'Drag the Bortle slider', body: 'Grab the big white thumb and drag toward 1 for a truly dark sky, or toward 9 for a light-polluted city — watch the starfield above reveal or hide stars in real time.' },
    { emoji: '🌌', title: 'Read the starfield preview', body: 'More visible stars and a glowing Milky Way band mean better conditions.' },
    { emoji: '📍', title: 'Switch or add Sky Spots (Pro)', body: 'Save named locations — your backyard, a cabin, a planned trip destination — each with its own coordinates and light-pollution level.' },
    { emoji: '📊', title: 'Tap a night on the forecast strip', body: 'Each bar is one night\'s Stargazing Score. Tap any night to see its real moon phase, moonrise/moonset, and true-darkness time for that exact location.' },
    { emoji: '✨', title: 'Look for the best-night badge', body: 'The tallest, star-marked bar in your window is the single best night to plan around.' },
    { emoji: '🌠', title: 'Watch for meteor shower banners', body: 'Real annual peak dates for all eight major showers surface automatically when they\'re coming up.' },
    { emoji: '🔒', title: 'Free tier: 7-night forecast, 1 unsaved spot', body: 'Pro unlocks a 30-night forecast, up to 5 saved Sky Spots, every upcoming event, and saving your setup.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Dark Sky Explorer</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Real moon-phase and moonrise/moonset math for your actual coordinates, plus real meteor shower dates.
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

      <div className="ios-card-nested p-4 mb-6 flex flex-col gap-2" style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}>
        <p className="text-footnote flex gap-3 items-start"><span className="text-lg flex-shrink-0">⚠️</span><span style={{ color: 'var(--text-secondary)' }}>Moon phase, moonrise/moonset, true-darkness time, and meteor shower dates are astronomically accurate for the coordinates you set. But the "clarity" factor in each night's score is a simulated placeholder for weather, not a live forecast — always check a real weather source before heading out. Times are shown in your device's timezone, which may differ from the Sky Spot's actual local time.</span></p>
        <p className="text-footnote flex gap-3 items-start"><span className="text-lg flex-shrink-0">🔒</span><span style={{ color: 'var(--text-secondary)' }}>The Bortle light-pollution rating itself is still something you set yourself, based on your own judgment — it isn't looked up automatically from your coordinates.</span></p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
