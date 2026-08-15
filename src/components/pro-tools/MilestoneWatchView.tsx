// FILE: src/components/pro-tools/MilestoneWatchView.tsx
'use client';
const GLOW = '45, 200, 170';

const MILESTONES = [
  { id: 'cord-care', label: 'Cord stump care begins', emoji: '🩹', dayStart: 0, dayEnd: 3 },
  { id: 'focus-faces', label: 'Starts focusing on faces up close', emoji: '👀', dayStart: 0, dayEnd: 21 },
  { id: 'birth-weight-regain', label: 'Regains birth weight', emoji: '⚖️', dayStart: 10, dayEnd: 21 },
  { id: 'cord-falls', label: 'Cord typically falls off', emoji: '🎗️', dayStart: 7, dayEnd: 21 },
  { id: 'cord-healed', label: 'Belly button area fully healed', emoji: '✅', dayStart: 14, dayEnd: 35 },
  { id: 'lifts-head', label: 'Lifts head briefly during tummy time', emoji: '💪', dayStart: 14, dayEnd: 42 },
  { id: 'tracks-objects', label: 'Tracks slow-moving objects', emoji: '👁️', dayStart: 21, dayEnd: 56 },
  { id: 'coos', label: 'Starts cooing sounds', emoji: '🗣️', dayStart: 28, dayEnd: 63 },
  { id: 'social-smile', label: 'First social smile', emoji: '😊', dayStart: 35, dayEnd: 70 },
  { id: 'sleep-stretch', label: 'Sleep stretches start lengthening', emoji: '😴', dayStart: 42, dayEnd: 90 },
];

function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

export function MilestoneWatchView({ birthDate, notes }: { birthDate: string | null; notes: { milestoneId: string; note: string }[] }) {
  const daysSinceBirth = birthDate ? daysBetween(new Date(birthDate + 'T00:00:00'), new Date()) : 0;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>MILESTONE WATCH</p>
        <h1 className="text-title1 mb-2">A little one's first weeks 🌱</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>Day {daysSinceBirth} — read-only, family-shared view.</p>
      </div>

      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>
        <div className="flex flex-col gap-2.5">
          {MILESTONES.map(m => {
            const passed = daysSinceBirth > m.dayEnd;
            const active = daysSinceBirth >= m.dayStart && daysSinceBirth <= m.dayEnd;
            const note = notes.find(n => n.milestoneId === m.id);
            return (
              <div key={m.id} className="ios-card-nested p-4" style={{ opacity: passed || active ? 1 : 0.5 }}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{m.emoji}</span>
                  <p className="text-headline">{m.label}</p>
                  {(passed || active) && <span className="ml-auto text-caption font-semibold" style={{ color: `rgb(${GLOW})` }}>{passed ? '✓' : '●'}</span>}
                </div>
                {note && <p className="text-footnote mt-2" style={{ color: 'var(--text-secondary)' }}>📝 {note.note}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
