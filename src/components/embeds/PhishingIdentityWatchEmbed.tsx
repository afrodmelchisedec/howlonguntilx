// FILE: src/components/embeds/PhishingIdentityWatchEmbed.tsx
'use client';
import { useState, useMemo } from 'react';

const GLOW = '6, 182, 212';
const SAFE_COLOR = '52, 199, 89';
const SUS_COLOR = '255, 159, 10';
const PHISH_COLOR = '255, 69, 58';

interface Flag { key: string; text: string; weight: number; }

const FLAGS: Flag[] = [
  { key: 'sender', text: "Sender email doesn't match the claimed organization", weight: 20 },
  { key: 'urgent', text: 'Urgent or threatening language ("act now")', weight: 15 },
  { key: 'credentials', text: 'Asks for your password, PIN, or SSN directly', weight: 25 },
  { key: 'linkMismatch', text: "Link text doesn't match where it goes", weight: 20 },
  { key: 'greeting', text: 'Generic greeting instead of your name', weight: 8 },
];

function gaugePoint(value: number, r: number) {
  const angleDeg = 180 - (Math.max(0, Math.min(100, value)) / 100) * 180;
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 150 + r * Math.cos(rad), y: 150 - r * Math.sin(rad) };
}
function bandArcPath(v1: number, v2: number, r: number): string {
  const p1 = gaugePoint(v1, r);
  const p2 = gaugePoint(v2, r);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
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
};

export function PhishingIdentityWatchEmbed() {
  const [checkedFlags, setCheckedFlags] = useState<Set<string>>(new Set());

  function toggleFlag(key: string) {
    setCheckedFlags(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  const threatScore = useMemo(() => {
    let sum = 0;
    for (const f of FLAGS) if (checkedFlags.has(f.key)) sum += f.weight;
    return Math.min(100, sum);
  }, [checkedFlags]);

  const verdict: 'safe' | 'suspicious' | 'phishing' = threatScore < 25 ? 'safe' : threatScore < 55 ? 'suspicious' : 'phishing';
  const verdictColor = { safe: SAFE_COLOR, suspicious: SUS_COLOR, phishing: PHISH_COLOR }[verdict];
  const verdictLabel = {
    safe: '✅ Looks safe',
    suspicious: '⚠️ Suspicious — verify independently',
    phishing: "🚨 Likely phishing — don't click",
  }[verdict];

  const needlePt = gaugePoint(threatScore, 105);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: '0.08em', color: `rgb(${GLOW})`, marginBottom: 4 }}>PHISHING & IDENTITY THEFT</p>
      <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>Phishing Radar & Identity Watch</h3>

      <svg viewBox="0 0 300 170" width="100%" style={{ maxWidth: 320, display: 'block', margin: '0 auto' }}>
        <path d={bandArcPath(0, 25, 120)} fill="none" stroke={`rgb(${SAFE_COLOR})`} strokeWidth={16} opacity={0.35} />
        <path d={bandArcPath(25, 55, 120)} fill="none" stroke={`rgb(${SUS_COLOR})`} strokeWidth={16} opacity={0.35} />
        <path d={bandArcPath(55, 100, 120)} fill="none" stroke={`rgb(${PHISH_COLOR})`} strokeWidth={16} opacity={0.35} />
        <line x1={150} y1={150} x2={needlePt.x} y2={needlePt.y} stroke={`rgb(${verdictColor})`} strokeWidth={3} strokeLinecap="round" />
        <circle cx={150} cy={150} r={8} fill={`rgb(${verdictColor})`} />
        <text x={150} y={140} textAnchor="middle" fontSize="26" fontWeight="bold" fill={`rgb(${verdictColor})`}>{threatScore}%</text>
      </svg>

      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 600, color: `rgb(${verdictColor})`, marginBottom: 16 }}>
        {verdictLabel}
      </div>

      <p style={{ fontSize: 12, color: '#8e8e93', marginBottom: 8 }}>Check anything the message does:</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FLAGS.map(flag => (
          <label key={flag.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, cursor: 'pointer' }}>
            <input type="checkbox" checked={checkedFlags.has(flag.key)} onChange={() => toggleFlag(flag.key)} style={{ marginTop: 2 }} />
            <span>{flag.text}</span>
          </label>
        ))}
      </div>

      <p style={{ fontSize: 11, fontStyle: 'italic', color: '#6e6e73', margin: '16px 0 0' }}>
        Example flags shown for preview — check off warning signs to see the threat gauge move live.
      </p>
    </div>
  );
}
