// FILE: src/components/pro-tools/PasswordRotationBoardTabs.tsx
'use client';
import { useState } from 'react';
import { PasswordRotationBoard } from './PasswordRotationBoard';

type Tab = 'tool' | 'guide';
const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',       emoji: '🔐' },
  { id: 'guide', label: 'How to use', emoji: '💡' },
];
const GLOW = '46, 196, 182';

export function PasswordRotationBoardTabs() {
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
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: `rgb(${GLOW})`,
            boxShadow: `0 0 16px rgba(${GLOW}, 0.5)`,
          }}
        />
      </div>

      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up"><PasswordRotationBoard /></div>
      ) : (
        <div key="guide" className="anim-fade-up"><HowToUseGuide onTryIt={() => setTab('tool')} /></div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    { emoji: '➕', title: 'Add your real accounts', body: 'Tap "+ Add account" and pick from presets like Email, Banking, or Social Media — or add a Custom one and rename it to match an account you actually use.' },
    { emoji: '🖐️', title: 'Drag by sensitivity', body: 'Drag each account bubble along the line based on how critical it is. More sensitive accounts (banking, primary email) get a shorter recommended rotation window automatically.' },
    { emoji: '📊', title: 'Read the urgency bar', body: 'Each account has a live bar showing days since your last rotation against its recommended window. The color — green, yellow, orange, red — tells you how urgent it is.' },
    { emoji: '🎯', title: 'Follow the priority order', body: 'Accounts are automatically sorted by urgency, so the one you should rotate first is always at the top — no manual sorting needed.' },
    { emoji: '🍩', title: 'Watch your health score', body: 'The ring at the top is your overall security health score, from 0–100, based on how overdue your accounts are as a whole.' },
    { emoji: '✅', title: 'Mark it done', body: 'Actually rotated a password? Tap "Rotated today" — it resets the real date, so the tool stays accurate the next time you open it.' },
    { emoji: '🔒', title: 'Free tier tracks 5 accounts', body: 'Free plan covers 5 accounts with quick date presets. Pro unlocks up to 20 accounts, an exact date picker, and saving your list to your account.' },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of the Rotation Priority Board</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A real way to see which of your passwords actually needs changing first — not a quiz, a policy.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div key={s.title} className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: `rgba(${GLOW}, 0.12)` }}>
              {s.emoji}
            </div>
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
          This tool never asks for or stores your actual passwords — only account names and rotation dates, to help you plan.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">Try it now →</button>
    </div>
  );
}
