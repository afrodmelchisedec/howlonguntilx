// FILE: src/components/embeds/LaborOnsetPredictorEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '255, 122, 89';

const MUCUS_PLUG_CURVE = [
  { d: 0, s: 22 }, { d: 1, s: 38 }, { d: 2, s: 50 }, { d: 3, s: 55 },
  { d: 5, s: 50 }, { d: 7, s: 40 }, { d: 10, s: 26 }, { d: 14, s: 15 }, { d: 21, s: 8 },
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

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function LaborOnsetPredictorEmbed() {
  const [mucusPlugDate, setMucusPlugDate] = useState('');
  const [waterBroke, setWaterBroke] = useState(false);

  const score = scoreFromCurve(MUCUS_PLUG_CURVE, daysSince(mucusPlugDate || null));

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>LABOR ONSET PREDICTOR</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Is it happening?</p>

      {waterBroke ? (
        <div style={{ background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,50,50,0.4)', borderRadius: 10, padding: 12, fontSize: 13, color: '#ff8080' }}>
          🚨 If your water has broken, contact your provider now — this widget doesn't produce a countdown for that.
        </div>
      ) : (
        <>
          <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Lost mucus plug on</label>
          <input type="date" value={mucusPlugDate} max={new Date().toISOString().slice(0, 10)}
            onChange={e => setMucusPlugDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 14 }} />

          {score !== null && (
            <>
              <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ width: `${Math.min(100, score)}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
              </div>
              <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.4 }}>
                {score >= 45 ? 'Signs suggest labor may be more likely this week than a typical week.' : 'Within a typical range — most people wait longer.'}
              </p>
            </>
          )}
        </>
      )}

      <button onClick={() => setWaterBroke(v => !v)} style={{ marginTop: 14, fontSize: 12, background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}>
        {waterBroke ? '← back' : 'My water broke →'}
      </button>

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Not a diagnosis. This can't predict timing for any individual — contact your provider with any concerns.
      </p>
    </div>
  );
}
