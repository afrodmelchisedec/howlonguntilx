'use client';

interface DurationData {
  label: string;
  min: number;
  max: number;
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'years';
  typical?: number;
  severity?: 'low' | 'medium' | 'high';
}

interface Props {
  data: DurationData | null;
  glow: string;
  theme?: 'light' | 'dark';
}

const THEMES = {
  light: { bg: '#FFFFFF', text: '#1C1C1E', sub: 'rgba(60,60,67,0.6)', border: 'rgba(60,60,67,0.12)', track: 'rgba(60,60,67,0.12)' },
  dark:  { bg: '#000000', text: '#F5F5F7', sub: 'rgba(235,235,245,0.6)', border: 'rgba(255,255,255,0.1)', track: 'rgba(255,255,255,0.12)' },
};

const SEVERITY_COLOR: Record<string, string> = {
  low: '99, 153, 34',
  medium: '186, 117, 23',
  high: '216, 90, 48',
};

function unitLabel(n: number, unit: string) {
  const singular = unit.replace(/s$/, '');
  return n === 1 ? singular : unit;
}

export function EmbedDurationWidget({ data, glow, theme = 'light' }: Props) {
  const t = THEMES[theme] ?? THEMES.light;

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: t.bg, color: t.sub, fontSize: 13 }}>
        Estimate unavailable
      </div>
    );
  }

  const { label, min, max, unit, typical, severity } = data;
  const sevColor = SEVERITY_COLOR[severity ?? 'medium'];
  const range = max - min;
  const markerPct = typical != null && range > 0
    ? Math.min(100, Math.max(0, ((typical - min) / range) * 100))
    : null;

  return (
    <div
      className="relative"
      style={{
        background: t.bg,
        color: t.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", Inter, system-ui, sans-serif',
        border: `1px solid rgba(${glow}, 0.35)`,
        boxShadow: `0 0 32px rgba(${glow}, 0.14)`,
        borderRadius: 20,
        padding: '16px 16px 14px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, rgb(${glow}), transparent)` }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 15, flexShrink: 0 }} aria-hidden="true">⏱️</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        {severity && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: `rgb(${sevColor})` }} />
            <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', color: `rgb(${sevColor})`, letterSpacing: '0.04em' }}>{severity} risk</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 14, background: `rgba(${glow}, 0.12)`, border: `1px solid rgba(${glow}, 0.3)` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: `rgb(${glow})`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{min}</div>
          <div style={{ fontSize: 8, fontWeight: 600, color: `rgba(${glow}, 0.9)`, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            MIN {unitLabel(min, unit)}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: 'center', padding: '10px 4px', borderRadius: 14, background: `rgba(${glow}, 0.05)`, border: `1px solid rgba(${glow}, 0.1)` }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: t.text, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{max}</div>
          <div style={{ fontSize: 8, fontWeight: 600, color: `rgba(${glow}, 0.45)`, marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            MAX {unitLabel(max, unit)}
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', height: 5, borderRadius: 999, background: t.track, marginBottom: typical != null ? 6 : 0 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg, rgba(${sevColor},0.35), rgb(${sevColor}))` }} />
        {markerPct !== null && (
          <div style={{
            position: 'absolute', top: '50%', left: `${markerPct}%`,
            width: 12, height: 12, borderRadius: '50%',
            background: t.text === '#1C1C1E' ? '#fff' : t.bg,
            border: `2px solid rgb(${sevColor})`,
            transform: 'translate(-50%, -50%)',
          }} />
        )}
      </div>
      {typical != null && (
        <p style={{ fontSize: 9, color: t.sub, margin: '0 0 10px' }}>
          Typical: <span style={{ color: `rgb(${sevColor})`, fontWeight: 700 }}>{typical} {unitLabel(typical, unit)}</span>
        </p>
      )}

      <p style={{ fontSize: 8, color: t.sub, textAlign: 'center', letterSpacing: '0.04em', margin: 0 }}>howlonguntilx.com</p>
    </div>
  );
}
