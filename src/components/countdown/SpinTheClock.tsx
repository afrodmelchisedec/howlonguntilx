'use client';
import { useState, useEffect, useRef } from 'react';

const EVENTS = [
  { name: 'FIFA World Cup 2026', date: '2026-06-11', emoji: '⚽', color: '64, 156, 255', cat: 'Leisure' },
  { name: 'Christmas 2025', date: '2025-12-25', emoji: '🎄', color: '48, 219, 91', cat: 'Leisure' },
  { name: 'Solar Eclipse 2026', date: '2026-08-12', emoji: '🌑', color: '218, 143, 255', cat: 'Travel' },
  { name: 'Black Friday 2025', date: '2025-11-28', emoji: '🛍️', color: '255, 159, 10', cat: 'Leisure' },
  { name: 'New Year 2027', date: '2027-01-01', emoji: '🎆', color: '125, 118, 255', cat: 'Leisure' },
  { name: 'Super Bowl LX', date: '2026-02-08', emoji: '🏈', color: '255, 75, 110', cat: 'Leisure' },
  { name: 'Oscars 2026', date: '2026-03-15', emoji: '🏆', color: '255, 214, 10', cat: 'Leisure' },
  { name: 'Apple WWDC 2026', date: '2026-06-08', emoji: '🍎', color: '64, 156, 255', cat: 'Tech' },
  { name: 'Summer Solstice 2026', date: '2026-06-21', emoji: '☀️', color: '255, 149, 0', cat: 'Travel' },
  { name: 'Halloween 2025', date: '2025-10-31', emoji: '🎃', color: '255, 159, 10', cat: 'Leisure' },
  { name: 'US Tax Deadline 2026', date: '2026-04-15', emoji: '📋', color: '255, 75, 110', cat: 'Finance' },
  { name: 'Google I/O 2026', date: '2026-05-12', emoji: '💻', color: '48, 219, 91', cat: 'Tech' },
  { name: 'Meteor Shower 2025', date: '2025-08-12', emoji: '🌠', color: '218, 143, 255', cat: 'Travel' },
  { name: 'Easter 2026', date: '2026-04-05', emoji: '🐣', color: '100, 240, 235', cat: 'Leisure' },
  { name: 'Prime Day 2026', date: '2026-07-15', emoji: '📦', color: '255, 159, 10', cat: 'Leisure' },
];

function getDiff(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function SpinTheClock() {
  const [current, setCurrent] = useState(EVENTS[0]);
  const [spinning, setSpinning] = useState(false);
  const [time, setTime] = useState(getDiff(EVENTS[0].date));
  const [spinDisplay, setSpinDisplay] = useState(EVENTS[0]);
  const [revealed, setRevealed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(getDiff(current.date)), 1000);
    return () => clearInterval(t);
  }, [current]);

  function spin() {
    if (spinning) return;
    setSpinning(true);
    setRevealed(false);
    let count = 0;
    const total = 20 + Math.floor(Math.random() * 15);
    intervalRef.current = setInterval(() => {
      const rand = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setSpinDisplay(rand);
      count++;
      if (count >= total) {
        clearInterval(intervalRef.current!);
        const picked = EVENTS[Math.floor(Math.random() * EVENTS.length)];
        setCurrent(picked);
        setSpinDisplay(picked);
        setTime(getDiff(picked.date));
        setSpinning(false);
        setRevealed(true);
      }
    }, spinning ? 80 : Math.min(40 + count * 6, 200));
  }

  const displayEv = spinning ? spinDisplay : current;
  const glow = displayEv.color;

  return (
    <div className="ios-card p-6 relative overflow-hidden" style={{
      border: `1px solid rgba(${glow}, 0.25)`,
      boxShadow: `0 0 40px rgba(${glow}, 0.08)`,
      transition: 'border-color 0.4s, box-shadow 0.4s',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)`, transition: 'background 0.4s' }} />

      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>SPIN THE CLOCK</p>
          <p className="text-headline mt-0.5">What's next in the world?</p>
        </div>
        <span className="pill" style={{ background: `rgba(${glow}, 0.12)`, color: `rgb(${glow})`, fontSize: 10 }}>
          {displayEv.cat}
        </span>
      </div>

      {/* Slot display */}
      <div className="text-center py-4 mb-4 rounded-2xl relative overflow-hidden" style={{ background: 'var(--bg-elevated-2)', border: `1px solid rgba(${glow}, 0.15)` }}>
        <div style={{
          fontSize: 48,
          transition: spinning ? 'none' : 'all 0.3s var(--spring)',
          filter: spinning ? 'blur(1px)' : 'none',
          transform: spinning ? 'scale(0.95)' : 'scale(1)',
        }}>
          {displayEv.emoji}
        </div>
        <div className="text-headline mt-2 px-4" style={{
          color: spinning ? 'var(--text-secondary)' : 'var(--text-primary)',
          transition: 'color 0.3s',
          minHeight: 28,
        }}>
          {displayEv.name}
        </div>

        {/* Countdown */}
        {!spinning && (
          <div className="flex justify-center gap-4 mt-4">
            {[{ v: time.d, l: 'DAYS' }, { v: time.h, l: 'HRS' }, { v: time.m, l: 'MIN' }, { v: time.s, l: 'SEC' }].map(({ v, l }) => (
              <div key={l} className="text-center">
                <div className="text-title2 tabular font-black" style={{ color: `rgb(${glow})`, minWidth: 40 }}>
                  {l === 'DAYS' ? v : pad(v)}
                </div>
                <div className="text-caption mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{l}</div>
              </div>
            ))}
          </div>
        )}

        {spinning && (
          <div className="flex justify-center gap-1.5 mt-4 pb-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-full" style={{
                width: 8, height: 8,
                background: `rgb(${glow})`,
                animation: `bounce 0.6s ${i * 0.15}s infinite alternate`,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Spin button */}
      <button onClick={spin} disabled={spinning}
        className="w-full press rounded-2xl py-3 text-headline font-bold transition-all"
        style={{
          background: spinning ? 'var(--bg-elevated-2)' : `rgba(${glow}, 0.15)`,
          color: spinning ? 'var(--text-tertiary)' : `rgb(${glow})`,
          border: `1px solid rgba(${glow}, ${spinning ? 0.1 : 0.3})`,
          cursor: spinning ? 'not-allowed' : 'pointer',
        }}>
        {spinning ? '🎰 Spinning...' : revealed ? '🎰 Spin Again' : '🎰 Spin the Clock'}
      </button>

      {revealed && !spinning && (
        <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
          Click to sign up and track this countdown →
        </p>
      )}

      <style>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-6px); } }`}</style>
    </div>
  );
}
