// FILE: src/components/pro-tools/LaborWatchView.tsx
'use client';
const GLOW = '255, 122, 89';

const MUCUS_PLUG_CURVE = [
  { d: 0, s: 22 }, { d: 1, s: 38 }, { d: 2, s: 50 }, { d: 3, s: 55 },
  { d: 5, s: 50 }, { d: 7, s: 40 }, { d: 10, s: 26 }, { d: 14, s: 15 }, { d: 21, s: 8 },
];
const BABY_DROPPED_CURVE = [
  { d: 0, s: 14 }, { d: 3, s: 18 }, { d: 7, s: 24 }, { d: 14, s: 30 },
  { d: 21, s: 36 }, { d: 28, s: 40 },
];

function daysSince(dateIso: string | null): number | null {
  if (!dateIso) return null;
  return Math.max(0, Math.round((Date.now() - new Date(dateIso).getTime()) / 86400000));
}
function scoreFromCurve(curve: { d: number; s: number }[], days: number | null): number | null {
  if (days === null) return null;
  if (days <= curve[0].d) return curve[0].s;
  if (days >= curve[curve.length - 1].d) return curve[curve.length - 1].s;
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i], b = curve[i + 1];
    if (days >= a.d && days <= b.d) return a.s + ((days - a.d) / (b.d - a.d)) * (b.s - a.s);
  }
  return null;
}

export function LaborWatchView({ mucusPlugDate, babyDropped, babyDroppedDate, waterBroke }: {
  mucusPlugDate: string | null; babyDropped: boolean; babyDroppedDate: string | null; waterBroke: boolean;
}) {
  const scores = [
    scoreFromCurve(MUCUS_PLUG_CURVE, daysSince(mucusPlugDate)),
    babyDropped ? scoreFromCurve(BABY_DROPPED_CURVE, daysSince(babyDroppedDate)) : null,
  ].filter((s): s is number => s !== null);
  const combined = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>LABOR WATCH</p>
        <h1 className="text-title1 mb-2">Someone's sharing their countdown with you 🤍</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A read-only view — no personal notes are shared here, just the logged signs and the likelihood band.
        </p>
      </div>

      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>
        {waterBroke ? (
          <div className="ios-card-nested p-5 text-center">
            <span className="text-largetitle">🚨</span>
            <p className="text-headline mt-2">Water has broken</p>
            <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>They should be contacting their provider now — check in with them directly.</p>
          </div>
        ) : combined === null ? (
          <p className="text-callout text-center" style={{ color: 'var(--text-secondary)' }}>No signs logged yet.</p>
        ) : (
          <div className="ios-card-nested p-5">
            <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>LIKELIHOOD THIS WEEK</p>
            <div className="w-full h-3 rounded-full overflow-hidden mb-2" style={{ background: 'var(--fill-secondary)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, combined)}%`, background: `rgb(${GLOW})` }} />
            </div>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              A statistical estimate from logged signs — it can't confirm timing for any individual.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
