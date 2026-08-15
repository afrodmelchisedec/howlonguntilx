// FILE: src/components/embeds/AmIPregnantTrackerEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '255, 138, 179';

const DPO_CURVE: { dpo: number; p: number }[] = [
  { dpo: -5, p: 0 }, { dpo: 0, p: 1 }, { dpo: 5, p: 2 }, { dpo: 7, p: 3 }, { dpo: 8, p: 6 },
  { dpo: 9, p: 10 }, { dpo: 10, p: 18 }, { dpo: 11, p: 28 }, { dpo: 12, p: 42 }, { dpo: 13, p: 58 },
  { dpo: 14, p: 74 }, { dpo: 15, p: 85 }, { dpo: 16, p: 91 }, { dpo: 17, p: 95 }, { dpo: 18, p: 97 },
  { dpo: 19, p: 98 }, { dpo: 20, p: 99 }, { dpo: 25, p: 99 },
];
function detectionProbability(dpo: number): number {
  if (dpo <= DPO_CURVE[0].dpo) return DPO_CURVE[0].p;
  if (dpo >= DPO_CURVE[DPO_CURVE.length - 1].dpo) return DPO_CURVE[DPO_CURVE.length - 1].p;
  for (let i = 0; i < DPO_CURVE.length - 1; i++) {
    const a = DPO_CURVE[i], b = DPO_CURVE[i + 1];
    if (dpo >= a.dpo && dpo <= b.dpo) return a.p + ((dpo - a.dpo) / (b.dpo - a.dpo)) * (b.p - a.p);
  }
  return 0;
}
function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function AmIPregnantTrackerEmbed() {
  const [lastPeriod, setLastPeriod] = useState('');
  const [cycleLength, setCycleLength] = useState(28);

  const ovulationDate = lastPeriod ? new Date(new Date(lastPeriod + 'T00:00:00').getTime() + (cycleLength - 14) * 86400000) : null;
  const dpo = ovulationDate ? daysBetween(ovulationDate, new Date()) : null;
  const probability = dpo !== null ? detectionProbability(dpo) : null;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>AM I PREGNANT?</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Probability tracker</p>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>First day of last period</label>
      <input type="date" value={lastPeriod} max={new Date().toISOString().slice(0, 10)}
        onChange={e => setLastPeriod(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 12 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <label style={{ fontSize: 12, opacity: 0.7 }}>Average cycle length</label>
        <span style={{ fontSize: 12, color: `rgb(${GLOW})`, fontVariantNumeric: 'tabular-nums' }}>{cycleLength} days</span>
      </div>
      <input type="range" min={21} max={35} value={cycleLength} onChange={e => setCycleLength(Number(e.target.value))}
        style={{ width: '100%', accentColor: `rgb(${GLOW})`, marginBottom: 16 }} />

      {probability !== null && (
        <>
          <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${probability}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.75 }}>
            {probability >= 85 ? 'Typically in the reliable testing window.' : `~${Math.round(probability)}% statistical detection odds today.`}
          </p>
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        A statistical estimate for a typical cycle — only a test, and a clinician if needed, can confirm.
      </p>
    </div>
  );
}
