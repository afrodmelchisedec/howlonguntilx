'use client';

interface Props { count: number }

export function StreakBadge({ count }: Props) {
  const levels = ['Start','Beginner','Tracker','Planner','Master'];
  const thresholds = [0, 3, 10, 25, 50];
  const levelIdx = thresholds.filter(t => count >= t).length - 1;
  const level = levels[Math.min(levelIdx, levels.length - 1)];
  const next = thresholds[Math.min(levelIdx + 1, thresholds.length - 1)];
  const progress = Math.min(100, Math.round((count / next) * 100));

  return (
    <div className="ios-card anim-fade-up p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-caption">Your level</p>
          <p className="text-headline mt-0.5">⭐ {level}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{count}</p>
          <p className="text-caption">countdowns</p>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: progress + '%', background: 'linear-gradient(90deg, rgb(var(--accent-brand)), rgb(var(--accent-purple)))' }} />
      </div>
      <p className="text-caption mt-1">{count}/{next} to {levels[Math.min(levelIdx + 1, levels.length - 1)]}</p>
    </div>
  );
}
