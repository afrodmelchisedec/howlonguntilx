'use client';
import { useCountdown } from '@/hooks/useCountdown';
import { ProgressBar } from './ProgressBar';

interface Props {
  event: { name: string; targetDate: Date | string; category?: unknown };
  glow?: string; // RGB triplet, e.g. "48, 219, 91" — themes the days digit + progress text
  provisional?: boolean; // true when targetDate is a placeholder pending official confirmation
}

export function CountdownDisplay({ event, glow, provisional }: Props) {
  const target = new Date(event.targetDate);
  const { days, hours, minutes, seconds, elapsedDays, elapsedHours, elapsedMinutes, elapsedSeconds, progress, isPast } = useCountdown(target);
  const themeColor = glow ? `rgb(${glow})` : 'rgb(var(--accent-brand))';

  const urgencyColor =
    days < 1 ? 'rgb(var(--accent-red))' :
    days < 7 ? 'rgb(var(--accent-orange))' :
    themeColor;

  // Mirrors buildFaqList's alreadyPhrased logic (src/lib/seo.ts): if the
  // event's name is already a full question (ends in '?' — e.g. "How many
  // days ago was 2020?"), use it as the headline verbatim instead of
  // wrapping it in another template, which would double the question. And
  // when it ISN'T already phrased (e.g. "Christmas"), the tense must follow
  // isPast — a hardcoded "How long until X?" is wrong for any event once
  // it's in the past.
  const name = event.name.trim();
  const alreadyPhrased = name.endsWith('?');
  const headline = alreadyPhrased
    ? name
    : isPast
    ? `How long ago was ${name}?`
    : `How long until ${name}?`;

  if (isPast) {
    return (
      <div className="text-center">
        <h1 className="text-largetitle mb-8">{headline}</h1>

        <div
          className="mb-4 inline-flex items-center gap-1.5 pill urgent-glow"
          style={{
            background: 'rgba(var(--accent-red),0.12)',
            color: 'rgb(var(--accent-red))',
            ['--glow' as any]: 'var(--accent-red)',
          }}
        >
          ⏱ Time since this event passed
        </div>

        <div className="flex justify-center gap-0 mb-6">
          {[
            { val: '+' + String(elapsedDays).padStart(elapsedDays > 99 ? 3 : 2, '0'), label: 'days' },
            { val: String(elapsedHours).padStart(2, '0'), label: 'hours' },
            { val: String(elapsedMinutes).padStart(2, '0'), label: 'min' },
            { val: String(elapsedSeconds).padStart(2, '0'), label: 'sec' },
          ].map((unit, i, arr) => (
            <div key={unit.label}
              className="text-center px-5"
              style={i < arr.length - 1 ? { borderRight: '1px solid var(--border-hairline)' } : {}}>
              <div
                className="text-5xl sm:text-6xl font-black tabular leading-none"
                style={{ color: 'rgb(var(--accent-red))' }}
              >
                {unit.val}
              </div>
              <div className="text-caption mt-1">{unit.label}</div>
            </div>
          ))}
        </div>

        <p className="text-footnote mt-3">
          {event.name} was <span style={{ color: 'rgb(var(--accent-red))', fontWeight: 600 }}>{elapsedDays} day{elapsedDays === 1 ? '' : 's'}</span> ago
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-largetitle mb-8">{headline}</h1>
      {provisional && (
        <div className="mb-4 inline-flex items-center gap-1.5 pill" style={{ background: 'rgba(var(--accent-orange),0.12)', color: 'rgb(var(--accent-orange))' }}>
          ⚡ PROVISIONAL
        </div>
      )}

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
        You are <span style={{ color: themeColor, fontWeight: 600 }}>{progress}%</span> of the way there
      </p>
    </div>
  );
}