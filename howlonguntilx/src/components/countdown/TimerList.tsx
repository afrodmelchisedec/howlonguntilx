'use client';
import { buildCountdownResponse } from '@/lib/countdown';

interface Timer { id: string; name: string; targetDate: Date | string }
interface Props { timers: Timer[] }

export function TimerList({ timers }: Props) {
  if (!timers.length) {
    return <p className="text-footnote text-center py-16">No countdowns yet. Add one!</p>;
  }
  return (
    <div className="space-y-3">
      {timers.map(t => {
        const { days_left, hours_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
        return (
          <div key={t.id} className="ios-card flex items-center justify-between px-5 py-4">
            <div>
              <div className="text-headline" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
              <div className="text-footnote">{new Date(t.targetDate).toLocaleDateString()}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{days_left}d</div>
              <div className="text-footnote">{hours_left}h remaining</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
