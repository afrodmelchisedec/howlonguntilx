// FILE: src/components/articles/HeroDuration.tsx
// Renders the hero for `questionType: 'DURATION'` articles — questions like
// "how long until a tooth infection kills you?" have no fixed target date to
// count down to, so instead of HeroCountdown's live ticking timer, this shows
// a typical range (min–max) with an optional "typical" marker inside it.
//
// Expected `article.heroData` shape for DURATION questions:
// {
//   "label": "Typical time to become life-threatening",
//   "min": 3,
//   "max": 14,
//   "unit": "days",          // "hours" | "days" | "weeks" | "months" | "years"
//   "typical": 7,             // optional — marker position within [min, max]
//   "severity": "high"        // optional — "low" | "medium" | "high", defaults to "medium"
// }

export interface HeroDurationData {
  label: string;
  min: number;
  max: number;
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  typical?: number;
  severity?: 'low' | 'medium' | 'high';
}

const SEVERITY_COLOR: Record<string, string> = {
  low: '99, 153, 34',      // green — matches STAT_COLORS-style palette already in use
  medium: '186, 117, 23',  // amber
  high: '216, 90, 48',     // red/orange
};

function unitLabel(n: number, unit: string) {
  const singular = unit.replace(/s$/, '');
  return n === 1 ? singular : unit;
}

export function HeroDuration({ heroData, glow }: { heroData: HeroDurationData; glow: string }) {
  const { label, min, max, unit, typical, severity } = heroData;
  const sevColor = SEVERITY_COLOR[severity ?? 'medium'];

  // Position of the "typical" marker along the min–max track, clamped to [0,100].
  const range = max - min;
  const markerPct = typical != null && range > 0
    ? Math.min(100, Math.max(0, ((typical - min) / range) * 100))
    : null;

  return (
    <div
      className="ios-card relative overflow-hidden anim-fade-up mb-6"
      style={{
        border: `1px solid rgba(${glow}, 0.35)`,
        boxShadow: `0 0 48px rgba(${glow}, 0.14), 0 0 0 1px rgba(${glow}, 0.1)`,
        padding: '20px 24px 18px',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)` }} />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 22 }} aria-hidden="true">⏱️</span>
          <h2 className="text-callout font-bold m-0" style={{ color: 'var(--text-primary)' }}>{label}</h2>
        </div>
        {severity && (
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: `rgb(${sevColor})` }} />
            <span className="text-caption font-bold uppercase" style={{ color: `rgb(${sevColor})` }}>{severity} risk</span>
          </div>
        )}
      </div>

      {/* Big min–max readout, same visual weight as HeroCountdown's DAYS cell */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl py-4 text-center" style={{ background: `rgba(${glow}, 0.12)`, border: `1px solid rgba(${glow}, 0.3)` }}>
          <div className="tabular font-black" style={{ fontSize: 44, lineHeight: 1, color: `rgb(${glow})`, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 24px rgba(${glow}, 0.5)` }}>
            {min}
          </div>
          <div className="text-caption mt-1.5" style={{ color: `rgba(${glow}, 0.9)`, letterSpacing: '0.08em' }}>
            MIN {unitLabel(min, unit).toUpperCase()}
          </div>
        </div>
        <div className="rounded-2xl py-4 text-center" style={{ background: `rgba(${glow}, 0.05)`, border: `1px solid rgba(${glow}, 0.1)` }}>
          <div className="tabular font-black" style={{ fontSize: 44, lineHeight: 1, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {max}
          </div>
          <div className="text-caption mt-1.5" style={{ color: `rgba(${glow}, 0.45)`, letterSpacing: '0.08em' }}>
            MAX {unitLabel(max, unit).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Range track with optional "typical" marker */}
      <div className="progress-track relative" style={{ height: 5 }}>
        <div style={{
          width: '100%',
          background: `linear-gradient(90deg, rgba(${sevColor},0.35), rgb(${sevColor}))`,
          height: '100%', borderRadius: 999,
        }} />
        {markerPct !== null && (
          <div
            title={`Typical: ${typical} ${unitLabel(typical!, unit)}`}
            style={{
              position: 'absolute', top: '50%', left: `${markerPct}%`,
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--text-primary)',
              border: `2px solid rgb(${sevColor})`,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 0 8px rgba(${sevColor}, 0.6)`,
            }}
          />
        )}
      </div>
      {markerPct !== null && (
        <p className="text-caption mt-2 mb-0" style={{ color: 'var(--text-secondary)' }}>
          Typical case: <span style={{ color: `rgb(${sevColor})`, fontWeight: 600 }}>{typical} {unitLabel(typical!, unit)}</span>
        </p>
      )}
    </div>
  );
}
