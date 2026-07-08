// FILE: src/components/pro-tools/EnergyRhythmMapperTabs.tsx
'use client';
import { useState } from 'react';
import { EnergyRhythmMapper } from './EnergyRhythmMapper';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🌊' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 138, 101';

export function EnergyRhythmMapperTabs() {
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
        <div key="tool" className="anim-fade-up"><EnergyRhythmMapper /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '👆', title: 'Drag any point on the curve', body: 'Grab a point and drag it up or down to mark how energized you feel at that hour — the curve reshapes live between neighboring points.' },
    { emoji: '💬', title: 'Hover for the exact reading', body: 'A tooltip follows your finger or cursor showing the hour, energy %, and which zone you\'re in.' },
    { emoji: '🎨', title: 'Read the three background zones', body: 'Green is Deep Focus (75-100%), amber is Light Tasks (40-74%), blue is Rest & Recharge (0-39%) — schedule accordingly.' },
    { emoji: '🧠', title: 'Tap "Suggest my Deep Work window"', body: 'Finds your longest sustained stretch above 75% energy and highlights it — the best window for your hardest work.' },
    { emoji: '🌅', title: 'Try a chronotype preset', body: 'Early Bird, Night Owl, Post-Lunch Dip, or Steady & Balanced — a fast way to explore common energy patterns, then customize by dragging.' },
    { emoji: '⚠️', title: 'Watch for the crash warning', body: 'Fires when your energy drops sharply within a few hours — a nudge to plan a break, snack, or short walk around there.' },
    { emoji: '🔥', title: 'Log today (Pro)', body: 'Saves today\'s curve into your Rhythm History, builds a daily streak, and updates your 7-day heatmap and weekly average.' },
    { emoji: '🔒', title: 'Free tier: 8 points, 10% snap', body: 'Pro unlocks 12-point resolution for a much smoother curve, 2% precision, and daily logging with streaks.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Energy Rhythm Mapper</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Most people schedule by the clock. This schedules by how you actually feel — draw your day, find your best hours, protect them.
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
          This reflects self-reported energy, not a medical or sleep diagnostic. If you're dealing with chronic fatigue, insomnia, or a suspected sleep disorder, talk to a doctor.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
