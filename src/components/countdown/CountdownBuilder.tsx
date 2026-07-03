'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

const PRESET_EVENTS = [
  { name: 'Christmas', emoji: '🎄', date: '2025-12-25', color: '48, 219, 91' },
  { name: 'World Cup', emoji: '⚽', date: '2026-06-11', color: '64, 156, 255' },
  { name: 'New Year', emoji: '🎆', date: '2027-01-01', color: '125, 118, 255' },
  { name: 'Black Friday', emoji: '🛍️', date: '2025-11-28', color: '255, 159, 10' },
  { name: 'Solar Eclipse', emoji: '🌑', date: '2026-08-12', color: '218, 143, 255' },
  { name: 'Halloween', emoji: '🎃', date: '2025-10-31', color: '255, 149, 0' },
  { name: 'Easter', emoji: '🐣', date: '2026-04-05', color: '100, 240, 235' },
  { name: 'Oscars', emoji: '🏆', date: '2026-03-15', color: '255, 214, 10' },
];

function getDays(dateStr: string) {
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000));
}

function getMonthsFromNow(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  return (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
}

const MAX_MONTHS = 24;

export function CountdownBuilder() {
  const [timeline, setTimeline] = useState<typeof PRESET_EVENTS>([]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  function addToTimeline(ev: typeof PRESET_EVENTS[0]) {
    if (timeline.find(e => e.name === ev.name)) return;
    setTimeline(prev => [...prev, ev].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  }

  function removeFromTimeline(name: string) {
    setTimeline(prev => prev.filter(e => e.name !== name));
  }

  function addCustom() {
    if (!customName || !customDate) return;
    const colors = ['255, 75, 110', '64, 156, 255', '48, 219, 91', '218, 143, 255'];
    const color = colors[timeline.length % colors.length];
    addToTimeline({ name: customName, emoji: '⏱️', date: customDate, color });
    setCustomName('');
    setCustomDate('');
    setShowSavePrompt(timeline.length >= 2);
  }

  return (
    <div className="ios-card overflow-hidden" style={{ border: '1px solid var(--border-hairline)' }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>PERSONAL COUNTDOWN BUILDER</p>
        <p className="text-headline mt-0.5">Build your year — drag events onto your timeline</p>
      </div>

      {/* Preset chips to drag/click */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-footnote mb-2" style={{ color: 'var(--text-tertiary)' }}>Tap to add:</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_EVENTS.map(ev => {
            const added = !!timeline.find(e => e.name === ev.name);
            return (
              <button key={ev.name}
                onClick={() => added ? removeFromTimeline(ev.name) : addToTimeline(ev)}
                className="press text-sm px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{
                  background: added ? `rgba(${ev.color}, 0.15)` : 'var(--bg-elevated-2)',
                  color: added ? `rgb(${ev.color})` : 'var(--text-secondary)',
                  border: `1px solid ${added ? `rgba(${ev.color}, 0.4)` : 'var(--border-hairline)'}`,
                  cursor: 'pointer',
                  textDecoration: added ? 'none' : 'none',
                }}>
                {ev.emoji} {ev.name} {added ? '✓' : '+'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom event input */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          <input
            className="input-glow flex-1 px-3 py-2 text-sm rounded-xl"
            placeholder="My event name..."
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
          <input
            className="input-glow px-3 py-2 text-sm rounded-xl"
            type="date"
            value={customDate}
            onChange={e => setCustomDate(e.target.value)}
            style={{ width: 140 }}
          />
          <button onClick={addCustom}
            className="btn-tinted press px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ cursor: 'pointer' }}>
            Add
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-2" style={{ borderTop: '1px solid var(--border-hairline)' }}>
        {timeline.length === 0 ? (
          <div className="py-8 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <p className="text-footnote">Your timeline is empty — add events above</p>
          </div>
        ) : (
          <div className="pt-4 pb-2 relative">
            {/* Timeline axis */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5" style={{ background: 'var(--border-hairline)' }} />

            {timeline.map((ev, i) => {
              const months = getMonthsFromNow(ev.date);
              const pct = Math.min(100, (months / MAX_MONTHS) * 100);
              return (
                <div key={ev.name} className="flex items-start gap-4 mb-4 relative anim-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}>
                  {/* Dot */}
                  <div className="flex-shrink-0 w-12 flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                      style={{ background: `rgb(${ev.color})`, borderColor: `rgb(${ev.color})`, boxShadow: `0 0 8px rgba(${ev.color}, 0.4)` }}>
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 rounded-2xl p-3 relative overflow-hidden"
                    style={{ background: `rgba(${ev.color}, 0.06)`, border: `1px solid rgba(${ev.color}, 0.2)` }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 18 }}>{ev.emoji}</span>
                        <span className="text-callout font-semibold" style={{ color: 'var(--text-primary)' }}>{ev.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="tabular text-callout font-black" style={{ color: `rgb(${ev.color})` }}>
                          {getDays(ev.date)}d
                        </span>
                        <button onClick={() => removeFromTimeline(ev.name)}
                          className="press rounded-full w-5 h-5 flex items-center justify-center text-xs"
                          style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated-2)', border: 'none', cursor: 'pointer' }}>
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        width: `${Math.max(2, 100 - pct)}%`,
                        background: `rgb(${ev.color})`,
                        transition: 'width 0.6s var(--ease-out)',
                      }} />
                    </div>
                    <p className="text-caption mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Save CTA */}
      {showSavePrompt || timeline.length >= 2 ? (
        <div className="mx-5 mb-5 p-4 rounded-2xl anim-fade-up" style={{
          background: 'rgba(125, 118, 255, 0.08)',
          border: '1px solid rgba(125, 118, 255, 0.25)',
        }}>
          <p className="text-callout font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
            🔔 Save your timeline
          </p>
          <p className="text-footnote mb-3" style={{ color: 'var(--text-secondary)' }}>
            Sign up free to save {timeline.length} events, get alerts, and share your timeline.
          </p>
          <Link href="/auth/signup"
            className="btn-filled press inline-block text-sm px-5 py-2 rounded-xl">
            Save my timeline →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
