// FILE: src/components/docs/TryCountdown.tsx
'use client';

import { useMemo, useState } from 'react';
import { useCountdown } from '@/hooks/useCountdown';

type CountdownResult = {
  event: string;
  target_date: string;
  is_past: boolean;
};

export function TryCountdown() {
  const [event, setEvent] = useState('christmas');
  const [result, setResult] = useState<CountdownResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Memoized so this Date object only gets recreated when the underlying
  // target_date string actually changes — not on every render. Without
  // this, a fresh `new Date(...)` on every render makes useCountdown's
  // effect think the target changed each time, tearing down and rebuilding
  // its interval constantly instead of ticking cleanly.
  const targetDate = useMemo(
    () => (result ? new Date(result.target_date) : new Date()),
    [result?.target_date]
  );
  const live = useCountdown(targetDate);

  async function run() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/countdown?event=${encodeURIComponent(event)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Event not found — try "christmas", "new year", or a real date like "2027-06-01".');
        return;
      }
      setResult(data);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ios-card p-5">
      <p className="text-caption font-semibold mb-3" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Try it live
      </p>
      <div className="flex gap-2 mb-4">
        <input
          value={event}
          onChange={e => setEvent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="christmas, halloween, 2027-06-01..."
          className="flex-1 px-3 py-2.5 rounded-lg text-callout"
          style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
        />
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg text-callout font-bold"
          style={{ background: 'rgb(255, 159, 10)', color: '#1a1a1a', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Run'}
        </button>
      </div>

      {error && (
        <p className="text-footnote" style={{ color: '#ff453a' }}>{error}</p>
      )}

      {result && (
        <div className="ios-card-nested p-4">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-headline">{result.event}</p>
            <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{live.isPast ? 'past' : 'upcoming'}</span>
          </div>
          <div className="flex gap-4 text-title3 font-bold mb-3" style={{ color: 'rgb(255, 159, 10)', fontVariantNumeric: 'tabular-nums' }}>
            <span>{live.days}<span className="text-caption ml-1" style={{ color: 'var(--text-tertiary)' }}>d</span></span>
            <span>{String(live.hours).padStart(2, '0')}<span className="text-caption ml-1" style={{ color: 'var(--text-tertiary)' }}>h</span></span>
            <span>{String(live.minutes).padStart(2, '0')}<span className="text-caption ml-1" style={{ color: 'var(--text-tertiary)' }}>m</span></span>
            <span>{String(live.seconds).padStart(2, '0')}<span className="text-caption ml-1" style={{ color: 'var(--text-tertiary)' }}>s</span></span>
          </div>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>Target: {result.target_date}</p>
        </div>
      )}
    </div>
  );
}