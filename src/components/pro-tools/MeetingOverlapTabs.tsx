// FILE: src/components/pro-tools/MeetingOverlapTabs.tsx
'use client';
import { useState } from 'react';
import { MeetingOverlapRadar } from './MeetingOverlapRadar';

type Tab = 'tool' | 'guide';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'tool',  label: 'Tool',        emoji: '📡' },
  { id: 'guide', label: 'How to use',  emoji: '💡' },
];

export function MeetingOverlapTabs() {
  const [tab, setTab] = useState<Tab>('tool');

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Tab switcher */}
      <div className="ios-card-nested p-1.5 flex mb-6 relative" style={{ maxWidth: 320, margin: '0 auto 24px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="press flex-1 relative z-10 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold transition-colors duration-300"
            style={{ color: tab === t.id ? 'white' : 'var(--text-secondary)' }}
          >
            <span>{t.emoji}</span>
            {t.label}
          </button>
        ))}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-xl transition-all duration-300 ease-out"
          style={{
            width: 'calc(50% - 6px)',
            left: tab === 'tool' ? '6px' : 'calc(50% + 0px)',
            background: 'rgb(var(--accent-brand))',
            boxShadow: '0 0 16px rgba(var(--accent-brand), 0.5)',
          }}
        />
      </div>

      {/* Content */}
      {tab === 'tool' ? (
        <div key="tool" className="anim-fade-up">
          <MeetingOverlapRadar />
        </div>
      ) : (
        <div key="guide" className="anim-fade-up">
          <HowToUseGuide onTryIt={() => setTab('tool')} />
        </div>
      )}
    </div>
  );
}

function HowToUseGuide({ onTryIt }: { onTryIt: () => void }) {
  const steps = [
    {
      emoji: '➕',
      title: 'Add your teammates',
      body: 'Click "+ Add teammate" and pick their city from the dropdown — it auto-fills a rough UTC offset for you.',
    },
    {
      emoji: '🖐️',
      title: 'Drag the glowing handles',
      body: 'Each person\'s work hours are an arc on their own ring. Grab either glowing handle and rotate it around the dial — no typing required.',
    },
    {
      emoji: '🎯',
      title: 'Watch the center & the gold glow',
      body: 'The number in the middle shows how many people overlap right now. A pulsing gold arc automatically locks onto the single best window as you drag.',
    },
    {
      emoji: '👁️',
      title: 'Toggle someone off',
      body: 'Uncheck "Active" on a teammate to see what the overlap looks like without them — no need to delete their arc.',
    },
    {
      emoji: '⚡',
      title: 'Use the quick-set pills',
      body: 'Not in the mood to drag? Tap 9–5 or 8–8 on any teammate for an instant starting point, then fine-tune from there.',
    },
    {
      emoji: '📋',
      title: 'Copy the proposed time',
      body: 'Once you\'re happy, hit "Copy time" — it copies a ready-to-paste line with both your local time and UTC, so nobody has to convert manually.',
    },
    {
      emoji: '🟢',
      title: 'Check who\'s online now',
      body: 'A pulsing green dot on someone\'s avatar means they\'re inside their working hours at this exact moment — handy before pinging them.',
    },
  ];

  return (
    <div className="ios-card p-6 sm:p-8" style={{ boxShadow: '0 0 0 1.5px rgba(83,74,217,0.2), 0 0 40px rgba(83,74,217,0.08)' }}>
      <div className="mb-6">
        <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>GUIDE</p>
        <h2 className="text-title2 mb-2">Getting the best out of Time Zone Radar</h2>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Solve "when can we all meet" visually instead of doing spreadsheet math across time zones.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="ios-card-nested p-4 flex gap-4 items-start anim-fade-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(var(--accent-brand), 0.12)' }}
            >
              {s.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-caption font-bold flex-shrink-0"
                  style={{ color: 'rgb(var(--accent-brand))' }}
                >
                  {i + 1}
                </span>
                <p className="text-headline">{s.title}</p>
              </div>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div
        className="ios-card-nested p-4 mb-6 flex gap-3 items-start"
        style={{ borderLeft: '3px solid rgb(var(--accent-orange))' }}
      >
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          Offsets are approximate and don't account for daylight saving time shifts. Great for quick planning —
          always double-check the exact local time before sending a real invite.
        </p>
      </div>

      <button onClick={onTryIt} className="btn-filled press w-full">
        Try it now →
      </button>
    </div>
  );
}
