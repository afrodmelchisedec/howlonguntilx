'use client';

interface Timer { targetDate: Date | string; name: string }
interface Props { timers: Timer[] }

export function MilestoneBar({ timers }: Props) {
  const nearest = timers
    .map(t => ({ name: t.name, ms: new Date(t.targetDate).getTime() - Date.now() }))
    .filter(t => t.ms > 0)
    .sort((a, b) => a.ms - b.ms)[0];
  const days = nearest ? Math.floor(nearest.ms / 86400000) : null;
  const urgencyVar = days === null ? '--text-tertiary' : days === 0 ? '--accent-red' : days <= 3 ? '--accent-orange' : days <= 7 ? '--accent-yellow' : '--accent-green';
  const urgencyColor = days === null ? 'var(--text-tertiary)' : `rgb(var(${urgencyVar}))`;

  return (
    <div className="ios-card anim-fade-up p-4">
      <p className="text-caption mb-1">Next milestone</p>
      {nearest ? (
        <>
          <p className="text-headline truncate">{nearest.name}</p>
          <p className="text-2xl font-bold tabular mt-0.5" style={{ color: urgencyColor }}>
            {days} <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>days</span>
          </p>
          <p className="text-xs mt-1" style={{ color: urgencyColor }}>
            {days === 0 ? '🔥 Today!' : days! <= 3 ? '⚡ Very soon' : days! <= 7 ? '📅 This week' : '🗓️ Upcoming'}
          </p>
        </>
      ) : (
        <p className="text-footnote mt-2">Add a countdown!</p>
      )}
    </div>
  );
}
