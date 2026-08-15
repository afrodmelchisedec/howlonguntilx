// FILE: src/components/pro-tools/PetGrowthGestationTrackerTabs.tsx
'use client';
import { useState } from 'react';
import { PetGrowthGestationTracker } from './PetGrowthGestationTracker';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🐾' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '255, 173, 74';

export function PetGrowthGestationTrackerTabs() {
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
        <div key="tool" className="anim-fade-up"><PetGrowthGestationTracker /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '🐱', title: 'Pick cat or dog', body: 'Cats follow one general curve. Dogs vary a lot by adult size, so you\'ll also pick a breed-size class.' },
    { emoji: '📏', title: 'Pick a breed size (dogs only)', body: 'Toy breeds finish growing around 9 months; giant breeds can take nearly two years. This changes the whole curve.' },
    { emoji: '🐾', title: 'Enter a birth date', body: 'Watch the Paw Trail fill in as your pet moves from newborn toward full adult size, with milestones like weaning and teething along the way.' },
    { emoji: '🔁', title: 'Switch to Gestation mode', body: 'Toggle at the top of the card. Enter a mating date instead, and see the Litter Wheel track development week by week toward the ~63–65 day due date.' },
    { emoji: '💾', title: 'Save your pets (Pro)', body: 'Free resets when you leave. Pro saves up to 5 pets, so every profile picks back up exactly where it left off.' },
    { emoji: '🔗', title: 'Share a litter countdown (Pro)', body: 'Generate a read-only link so family can watch the due-date countdown without needing an account.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(255, 173, 74, 0.2), 0 0 40px rgba(255, 173, 74, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(255, 173, 74)' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Pet Growth & Gestation Calculator</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Two tools in one — a growth curve for the pet you have, and a due-date countdown for the litter you're expecting.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255, 173, 74, 0.12)' }}>{s.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-caption font-bold flex-shrink-0" style={{ color: 'rgb(255, 173, 74)' }}>{i + 1}</span>
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
          Growth timelines and gestation length vary by individual animal, health, and breed line — this gives a statistical estimate, not a veterinary assessment. Check with a vet for anything specific to your pet.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
