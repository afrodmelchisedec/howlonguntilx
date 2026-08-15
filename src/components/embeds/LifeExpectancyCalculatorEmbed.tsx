'use client';
import { useState, useMemo, useEffect } from 'react';

const GLOW = '99, 153, 34'; // calm green — this tool is about longevity, not alarm

type Sex = 'MALE' | 'FEMALE';

// Illustrative regional baselines (rounded, public-knowledge approximations —
// NOT the real actuarial tables, which are computed server-side in the live tool).
const REGIONS: { id: string; label: string; flag: string; life: Record<Sex, number> }[] = [
  { id: 'US', label: 'United States', flag: '🇺🇸', life: { MALE: 76.1, FEMALE: 81.1 } },
  { id: 'UK', label: 'United Kingdom', flag: '🇬🇧', life: { MALE: 79.0, FEMALE: 82.9 } },
  { id: 'JP', label: 'Japan', flag: '🇯🇵', life: { MALE: 81.1, FEMALE: 87.1 } },
  { id: 'BR', label: 'Brazil', flag: '🇧🇷', life: { MALE: 72.8, FEMALE: 79.4 } },
];
const GLOBAL_AVG = 73.4;

const FACTORS: { key: string; emoji: string; label: string; years: number }[] = [
  { key: 'exercise', emoji: '🏃', label: 'Regular exercise', years: 3 },
  { key: 'diet', emoji: '🥗', label: 'Balanced diet', years: 2 },
  { key: 'smoking', emoji: '🚬', label: 'Smoking', years: -10 },
  { key: 'stress', emoji: '😰', label: 'High-stress job', years: -2 },
];

function chanceOfReaching(targetAge: number, expectedAge: number, currentAge: number): number {
  // Illustrative logistic falloff around the expected age — not a real survival table.
  const spread = Math.max(4, (expectedAge - currentAge) * 0.28);
  const raw = 1 / (1 + Math.exp((targetAge - expectedAge) / spread));
  return Math.max(0, Math.min(1, raw));
}

function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0 });
  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    function tick() {
      const msLeft = Math.max(0, target - Date.now());
      setParts({
        days: Math.floor(msLeft / 86400000),
        hours: Math.floor((msLeft % 86400000) / 3600000),
        minutes: Math.floor((msLeft % 3600000) / 60000),
      });
    }
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

function CountdownTimer({ targetIso }: { targetIso: string | null }) {
  const { days, hours, minutes } = useCountdown(targetIso);
  const units = [{ v: days, l: 'days' }, { v: hours, l: 'hrs' }, { v: minutes, l: 'min' }];
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
      {units.map(u => (
        <div key={u.l} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px', textAlign: 'center', minWidth: 56 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: `rgb(${GLOW})` }}>{u.v.toLocaleString()}</div>
          <div style={{ fontSize: 10, opacity: 0.6 }}>{u.l}</div>
        </div>
      ))}
    </div>
  );
}

function RingProgress({ percent, label, sub }: { percent: number; label: string; sub: string }) {
  const r = 48, c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, percent)) / 100) * c;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={116} height={116} viewBox="0 0 116 116">
        <circle cx={58} cy={58} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={9} />
        <circle
          cx={58} cy={58} r={r} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={9}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
        <text x={58} y={54} textAnchor="middle" fontSize={20} fontWeight={700} fill={`rgb(${GLOW})`}>{Math.round(percent)}%</text>
        <text x={58} y={71} textAnchor="middle" fontSize={9} fill="rgba(255,255,255,0.55)">lived</text>
      </svg>
      <p style={{ fontSize: 12, fontWeight: 600, margin: '4px 0 0', textAlign: 'center' }}>{label}</p>
      <p style={{ fontSize: 11, opacity: 0.55, margin: 0, textAlign: 'center' }}>{sub}</p>
    </div>
  );
}

function SurvivalCurveChart({ currentAge, expectedAge }: { currentAge: number; expectedAge: number }) {
  const maxAge = Math.min(115, Math.round(expectedAge + 20));
  const step = Math.max(1, Math.round((maxAge - currentAge) / 40));
  const points: { age: number; p: number }[] = [];
  for (let a = currentAge; a <= maxAge; a += step) {
    points.push({ age: a, p: chanceOfReaching(a, expectedAge, currentAge) * 100 });
  }
  if (points.length < 2) return null;
  const W = 340, H = 110, PAD = 8;
  const xFor = (i: number) => PAD + (i / (points.length - 1)) * (W - PAD * 2);
  const yFor = (v: number) => H - PAD - (v / 100) * (H - PAD * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)},${yFor(p.p)}`).join(' ');
  const areaPath = `${path} L ${xFor(points.length - 1)},${H - PAD} L ${xFor(0)},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="leAreaEmbed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${GLOW})`} stopOpacity={0.25} />
          <stop offset="100%" stopColor={`rgb(${GLOW})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={PAD} x2={W - PAD} y1={yFor(50)} y2={yFor(50)} stroke="rgba(255,255,255,0.3)" strokeDasharray="4 3" strokeWidth={1} />
      <path d={areaPath} fill="url(#leAreaEmbed)" />
      <path d={path} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      <text x={PAD} y={H - 2} fontSize={9} fill="rgba(255,255,255,0.5)">Age {currentAge}</text>
      <text x={W - PAD} y={H - 2} fontSize={9} fill="rgba(255,255,255,0.5)" textAnchor="end">Age {maxAge}</text>
    </svg>
  );
}

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f2',
};

export function LifeExpectancyCalculatorEmbed() {
  const [regionId, setRegionId] = useState('US');
  const [age, setAge] = useState(30);
  const [sex, setSex] = useState<Sex>('MALE');
  const [activeFactors, setActiveFactors] = useState<Record<string, boolean>>({});

  const region = REGIONS.find(r => r.id === regionId) ?? REGIONS[0];

  const result = useMemo(() => {
    const baseline = region.life[sex];
    const adjustment = FACTORS.reduce((sum, f) => sum + (activeFactors[f.key] ? f.years : 0), 0);
    const expectedAge = Math.max(age + 1, baseline + adjustment);
    const remainingYears = Math.max(0, expectedAge - age);
    const targetDate = new Date(Date.now() + remainingYears * 365.25 * 86400000).toISOString();
    const percentLifeLived = Math.min(100, (age / expectedAge) * 100);
    const chance90 = Math.round(chanceOfReaching(90, expectedAge, age) * 100);
    const chance100 = Math.round(chanceOfReaching(100, expectedAge, age) * 100);
    const opposite: Sex = sex === 'MALE' ? 'FEMALE' : 'MALE';
    const comparisonRows = [
      { label: 'You', value: expectedAge, highlight: true },
      { label: 'Region average', value: baseline },
      { label: 'Opposite sex avg.', value: region.life[opposite] },
      { label: 'Global average', value: GLOBAL_AVG },
    ];
    return { expectedAge, remainingYears, targetDate, percentLifeLived, chance90, chance100, adjustment, comparisonRows };
  }, [region, sex, age, activeFactors]);

  function toggleFactor(key: string) {
    setActiveFactors(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const maxCompare = Math.max(...result.comparisonRows.map(r => r.value), 1);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: `rgb(${GLOW})`, margin: '0 0 4px' }}>LONGEVITY</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 14px' }}>Life Expectancy Calculator</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 11, opacity: 0.65, display: 'block', marginBottom: 4 }}>Region</label>
          <select
            value={regionId}
            onChange={e => setRegionId(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px 6px', color: '#f2f2f2', fontSize: 13 }}
          >
            {REGIONS.map(r => <option key={r.id} value={r.id}>{r.flag} {r.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, opacity: 0.65, display: 'block', marginBottom: 4 }}>Current age</label>
          <input
            type="number" min={0} max={110} value={age}
            onChange={e => setAge(Math.max(0, Math.min(110, Number(e.target.value) || 0)))}
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px 10px', color: '#f2f2f2', fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, marginBottom: 16 }}>
        {(['MALE', 'FEMALE'] as Sex[]).map(s => (
          <button
            key={s}
            onClick={() => setSex(s)}
            style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: sex === s ? `rgb(${GLOW})` : 'transparent', color: sex === s ? '#111' : 'rgba(255,255,255,0.7)',
            }}
          >
            {s === 'MALE' ? '♂ Male' : '♀ Female'}
          </button>
        ))}
      </div>

      <div style={{ background: `rgba(${GLOW}, 0.1)`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 10, opacity: 0.6, margin: '0 0 2px' }}>STATISTICAL LIFESPAN</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})`, margin: 0 }}>{result.expectedAge.toFixed(1)} <span style={{ fontSize: 14 }}>years</span></p>
            {result.adjustment !== 0 && (
              <p style={{ fontSize: 11, opacity: 0.65, margin: '2px 0 0' }}>{result.adjustment > 0 ? '+' : ''}{result.adjustment} yrs from lifestyle factors</p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: `rgb(${GLOW})`, margin: 0 }}>{result.chance90}%</p>
              <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>reach 90</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: `rgb(${GLOW})`, margin: 0 }}>{result.chance100}%</p>
              <p style={{ fontSize: 10, opacity: 0.6, margin: 0 }}>reach 100</p>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, textAlign: 'center', margin: '0 0 6px' }}>TIME STATISTICALLY REMAINING</p>
        <CountdownTimer targetIso={result.targetDate} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'center' }}>
          <RingProgress percent={result.percentLifeLived} label="of expected life lived" sub={`${age} of ${result.expectedAge.toFixed(1)} years`} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 10px' }}>How you compare</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.comparisonRows.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, opacity: 0.65, width: 74, flexShrink: 0 }}>{r.label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${(r.value / maxCompare) * 100}%`, background: r.highlight ? `rgb(${GLOW})` : 'rgba(255,255,255,0.4)' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, width: 30, textAlign: 'right', flexShrink: 0, color: r.highlight ? `rgb(${GLOW})` : 'rgba(255,255,255,0.7)' }}>{r.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>Survival probability by age</p>
        <SurvivalCurveChart currentAge={age} expectedAge={result.expectedAge} />
      </div>

      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>Lifestyle factors</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {FACTORS.map(f => {
          const active = !!activeFactors[f.key];
          return (
            <button
              key={f.key}
              onClick={() => toggleFactor(f.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                border: active ? `1.5px solid rgb(${GLOW})` : '1.5px solid transparent',
                background: active ? `rgba(${GLOW}, 0.1)` : 'rgba(255,255,255,0.04)',
                color: '#f2f2f2',
              }}
            >
              <span style={{ fontSize: 15 }}>{f.emoji}</span>
              <span style={{ fontSize: 12, flex: 1 }}>{f.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: f.years > 0 ? `rgb(${GLOW})` : 'rgba(255,255,255,0.55)' }}>{f.years > 0 ? '+' : ''}{f.years}y</span>
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', opacity: 0.55, margin: 0 }}>
        Example estimate shown for preview — change region, age, or lifestyle factors to see the countdown update live.
      </p>
    </div>
  );
}
