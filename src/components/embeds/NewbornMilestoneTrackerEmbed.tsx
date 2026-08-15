// FILE: src/components/embeds/NewbornMilestoneTrackerEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '45, 200, 170';

const MILESTONES = [
  { label: 'Cord stump care begins', emoji: '🩹', dayStart: 0, dayEnd: 3 },
  { label: 'Starts focusing on faces up close', emoji: '👀', dayStart: 0, dayEnd: 21 },
  { label: 'Regains birth weight', emoji: '⚖️', dayStart: 10, dayEnd: 21 },
  { label: 'Cord typically falls off', emoji: '🎗️', dayStart: 7, dayEnd: 21 },
  { label: 'Lifts head briefly during tummy time', emoji: '💪', dayStart: 14, dayEnd: 42 },
  { label: 'Starts cooing sounds', emoji: '🗣️', dayStart: 28, dayEnd: 63 },
  { label: 'First social smile', emoji: '😊', dayStart: 35, dayEnd: 70 },
  { label: 'Sleep stretches start lengthening', emoji: '😴', dayStart: 42, dayEnd: 90 },
];
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function NewbornMilestoneTrackerEmbed() {
  const [birthDate, setBirthDate] = useState('');
  const days = birthDate ? daysBetween(new Date(birthDate + 'T00:00:00'), new Date()) : null;
  const upNext = days !== null ? MILESTONES.find(m => days < m.dayEnd) : null;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>NEWBORN MILESTONES</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>What's coming up</p>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Birth date</label>
      <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)}
        onChange={e => setBirthDate(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 16 }} />

      {days !== null && (
        <>
          <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Day {days} old</p>
          {upNext ? (
            <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 20 }}>{upNext.emoji}</span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{upNext.label}</p>
                <p style={{ fontSize: 11, opacity: 0.6 }}>{days >= upNext.dayStart ? 'Typically happening around now' : `Typically starts around day ${upNext.dayStart}`}</p>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, opacity: 0.6 }}>All initial milestones in range — see the full timeline for what's next.</p>
          )}
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        General ranges, not a diagnostic timeline. Contact your pediatrician with any concerns.
      </p>
    </div>
  );
}
