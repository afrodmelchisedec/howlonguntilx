// FILE: src/components/embeds/DealRadarEmbed.tsx
'use client';
import { useState } from 'react';

const GLOW = '255, 90, 150';
const SEGMENT_ANGLE = 45;

interface WheelSegment { label: string; key: string; color: string; weight: number; }

const SEGMENTS: WheelSegment[] = [
  { label: 'Electronics', key: 'Electronics', color: '100, 200, 255', weight: 14 },
  { label: 'Fashion', key: 'Fashion', color: '196, 132, 252', weight: 14 },
  { label: 'Home', key: 'Home', color: '255, 159, 10', weight: 14 },
  { label: 'Beauty', key: 'Beauty', color: '255, 122, 165', weight: 12 },
  { label: 'Travel', key: 'Travel', color: '52, 199, 89', weight: 12 },
  { label: 'Food', key: 'Food', color: '196, 132, 90', weight: 12 },
  { label: 'General Tip', key: 'General', color: '150, 150, 160', weight: 14 },
  { label: 'Your Deals', key: 'insight', color: '255, 204, 0', weight: 8 },
];

const TIP_BANK: Record<string, string[]> = {
  Electronics: ['Electronics tend to drop hardest right before a new model launch.'],
  Fashion: ['End-of-season sales are when fashion discounts go deepest.'],
  Home: ['This category rarely discounts past 40% — 35%+ off is close to the ceiling.'],
  Beauty: ['Skincare rarely goes below 25% off outside a sitewide sale.'],
  Travel: ['Flight prices are usually lowest 6–8 weeks before a domestic trip.'],
  Food: ['Subscription boxes almost always have a better deal for new customers.'],
  General: ['A deal under 20% off is rarely worth rushing for.'],
  insight: ["Your saved deals would show personalized insights here — try the full tool to save some."],
};

function pickSegment(): number {
  const total = SEGMENTS.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SEGMENTS.length; i++) { r -= SEGMENTS[i].weight; if (r <= 0) return i; }
  return SEGMENTS.length - 1;
}
function pickTip(key: string): string {
  const bank = TIP_BANK[key] ?? TIP_BANK.General;
  return bank[Math.floor(Math.random() * bank.length)];
}

function spinRotationTo(prev: number, index: number): number {
  const current = prev % 360;
  const target = (360 - (index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)) % 360;
  let delta = target - current;
  if (delta <= 0) delta += 360;
  return prev + delta + 4 * 360;
}

const box: any = {
  background: '#1a1a1e',
  borderRadius: 16,
  maxWidth: 420,
  margin: '0 auto',
  padding: 24,
  boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)`,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: '#f2f2f7',
  textAlign: 'center',
};

export function DealRadarEmbed() {
  const [wheelRotation, setWheelRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [prize, setPrize] = useState<{ label: string; color: string; tip: string } | null>(null);

  function handleSpin() {
    if (spinning) return;
    setSpinning(true);
    setPrize(null);
    const idx = pickSegment();
    setWheelRotation(prev => spinRotationTo(prev, idx));
    setTimeout(() => {
      const seg = SEGMENTS[idx];
      setPrize({ label: seg.label, color: seg.color, tip: pickTip(seg.key) });
      setSpinning(false);
    }, 3300);
  }

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>LEISURE · SHOPPING & DEALS</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Deal Radar</h3>

      <div style={{ position: 'relative', width: 200, height: 200, margin: '0 auto' }}>
        <div style={{ position: 'absolute', left: '50%', top: -4, transform: 'translateX(-50%)', zIndex: 2 }}>
          <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: `14px solid rgb(${GLOW})` }} />
        </div>
        <svg viewBox="0 0 200 200" width={200} height={200}
          style={{ transform: `rotate(${wheelRotation}deg)`, transition: 'transform 3.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)' }}>
          {SEGMENTS.map((seg, i) => {
            const startAngle = i * SEGMENT_ANGLE - 90;
            const endAngle = startAngle + SEGMENT_ANGLE;
            const r = 95, cx = 100, cy = 100;
            const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
            const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
            const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
            const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
            const midAngle = startAngle + SEGMENT_ANGLE / 2;
            const labelX = cx + (r * 0.65) * Math.cos((midAngle * Math.PI) / 180);
            const labelY = cy + (r * 0.65) * Math.sin((midAngle * Math.PI) / 180);
            return (
              <g key={i}>
                <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} fill={`rgba(${seg.color}, 0.85)`} stroke="#1a1a1e" strokeWidth={2} />
                <text x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fontSize="8" fontWeight="700" fill="white"
                  transform={`rotate(${midAngle + 90} ${labelX} ${labelY})`}>
                  {seg.label}
                </text>
              </g>
            );
          })}
          <circle cx={100} cy={100} r={16} fill="#1a1a1e" stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
        </svg>
      </div>

      <button
        onClick={handleSpin}
        disabled={spinning}
        style={{
          marginTop: 14, padding: '10px 20px', borderRadius: 999, border: 'none',
          background: `rgb(${GLOW})`, color: 'white', fontWeight: 600, fontSize: 13,
          cursor: spinning ? 'default' : 'pointer', opacity: spinning ? 0.6 : 1,
        }}
      >
        {spinning ? 'Spinning…' : '🎡 Spin for a tip'}
      </button>

      {prize && (
        <div style={{ marginTop: 16, background: '#0a0e14', borderRadius: 12, padding: 14, textAlign: 'left', border: `1px solid rgba(${prize.color}, 0.35)` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: `rgb(${prize.color})`, marginBottom: 4 }}>{prize.label}</div>
          <div style={{ fontSize: 13, color: '#d1d1d6' }}>{prize.tip}</div>
        </div>
      )}

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '14px 0 0' }}>
        Example tip bank shown for preview — spin to see a category and tip land live.
      </p>
    </div>
  );
}
