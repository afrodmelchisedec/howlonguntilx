'use client';
import { useCountdown } from '@/hooks/useCountdown';
import { ProgressBar } from './ProgressBar';

interface Props {
  event: { name: string; targetDate: Date | string; category?: string };
}

export function CountdownDisplay({ event }: Props) {
  const target = new Date(event.targetDate);
  const { days, hours, minutes, seconds, progress, isPast } = useCountdown(target);

  const urgencyColor =
    days < 1 ? 'rgb(var(--accent-red))' :
    days < 7 ? 'rgb(var(--accent-orange))' :
    'rgb(var(--accent-brand))';

  if (isPast) {
    return (
      <div className="text-center py-10">
        <p className="text-caption mb-2">This event has passed</p>
        <p className="text-title2">{event.name}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-caption mb-2">Time remaining until</p>
      <h1 className="text-largetitle mb-8">{event.name}</h1>

      <div className="flex justify-center gap-0 mb-6">
        {[
          { val: String(days).padStart(days > 99 ? 3 : 2, '0'), label: 'days' },
          { val: String(hours).padStart(2, '0'), label: 'hours' },
          { val: String(minutes).padStart(2, '0'), label: 'min' },
          { val: String(seconds).padStart(2, '0'), label: 'sec' },
        ].map((unit, i, arr) => (
          <div key={unit.label}
            className="text-center px-5"
            style={i < arr.length - 1 ? { borderRight: '1px solid var(--border-hairline)' } : {}}>
            <div
              className="text-5xl sm:text-6xl font-black tabular leading-none"
              style={{ color: i === 3 ? urgencyColor : 'var(--text-primary)' }}
            >
              {unit.val}
            </div>
            <div className="text-caption mt-1">{unit.label}</div>
          </div>
        ))}
      </div>

      {days < 7 && (
        <div className="mb-4 inline-flex items-center gap-1.5 pill urgent-glow" style={{ background: 'rgba(var(--accent-orange),0.12)', color: 'rgb(var(--accent-orange))' }}>
          {days === 0 ? '⚡ Today!' : `⚡ Only ${days} day${days > 1 ? 's' : ''} left!`}
        </div>
      )}

      <ProgressBar progress={progress} />

      <p className="text-footnote mt-3">
        You are <span style={{ color: 'rgb(var(--accent-brand))', fontWeight: 600 }}>{progress}%</span> of the way there
      </p>
    </div>
  );
}
