// FILE: src/components/embeds/KittenGrowthTrackerEmbed.tsx
'use client';
import { useState, useEffect } from 'react';

const GLOW = '224, 146, 66'; // warm amber — matches main tool

type BreedSize = 'SMALL' | 'MEDIUM' | 'LARGE';
const BREED_SIZES: Record<BreedSize, { label: string; matureAgeDays: number }> = {
  SMALL:  { label: 'Small breed',        matureAgeDays: 330 },
  MEDIUM: { label: 'Medium / mixed',     matureAgeDays: 365 },
  LARGE:  { label: 'Large breed',        matureAgeDays: 600 },
};

interface Milestone { emoji: string; label: string; dayEstimate: number; }
const BASE_MILESTONES: Milestone[] = [
  { emoji: '👁️', label: 'Eyes fully open',    dayEstimate: 10 },
  { emoji: '🐾', label: 'First wobbly steps', dayEstimate: 18 },
  { emoji: '🍼', label: 'Weaning begins',     dayEstimate: 28 },
  { emoji: '🥣', label: 'Eating dry food',    dayEstimate: 45 },
  { emoji: '✅', label: 'Fully weaned',       dayEstimate: 56 },
  { emoji: '🏠', label: 'Ready to leave mom', dayEstimate: 84 },
  { emoji: '⚡', label: 'Adolescent spurt',   dayEstimate: 180 },
];

function milestonesFor(breedSize: BreedSize): Milestone[] {
  const matureDays = BREED_SIZES[breedSize].matureAgeDays;
  return [...BASE_MILESTONES, { emoji: '🐈', label: 'Fully grown', dayEstimate: matureDays }];
}

function ageDays(birthDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(birthDate).getTime()) / 86400000));
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function KittenGrowthTrackerEmbed() {
  const [birthDate, setBirthDate] = useState('');
  const [breedSize, setBreedSize] = useState<BreedSize>('MEDIUM');
  const [days, setDays] = useState<number | null>(null);

  useEffect(() => {
    if (!birthDate) { setDays(null); return; }
    setDays(ageDays(birthDate));
    const id = setInterval(() => setDays(ageDays(birthDate)), 60000);
    return () => clearInterval(id);
  }, [birthDate]);

  const milestones = milestonesFor(breedSize);
  const maxDays = milestones[milestones.length - 1].dayEstimate;
  const nextMilestone = days !== null ? milestones.find(m => m.dayEstimate > days) ?? null : null;
  const percent = days !== null ? Math.min(100, (days / maxDays) * 100) : 0;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>KITTEN GROWTH TRACKER</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>How grown is your kitten?</p>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Birth date</label>
      <input type="date" value={birthDate} max={new Date().toISOString().slice(0, 10)}
        onChange={e => setBirthDate(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 10 }} />

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Breed size</label>
      <select value={breedSize} onChange={e => setBreedSize(e.target.value as BreedSize)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', marginBottom: 16 }}>
        {(Object.keys(BREED_SIZES) as BreedSize[]).map(k => <option key={k} value={k}>{BREED_SIZES[k].label}</option>)}
      </select>

      {days !== null && (
        <>
          <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>CURRENT AGE</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: `rgb(${GLOW})` }}>{Math.floor(days / 7)} <span style={{ fontSize: 14, fontWeight: 500, opacity: 0.8 }}>weeks</span></p>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{days} days old</p>
          </div>

          <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${percent}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
          </div>
          <p style={{ fontSize: 12, opacity: 0.75, marginBottom: 14 }}>{Math.round(percent)}% of the way to fully grown</p>

          {nextMilestone && (
            <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>NEXT MILESTONE</p>
              <p style={{ fontSize: 13, lineHeight: 1.5 }}>{nextMilestone.emoji} {nextMilestone.label} — in ~{nextMilestone.dayEstimate - days} days</p>
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Estimates reflect commonly-cited averages across breeds — individual kittens vary. Not veterinary advice.
      </p>
    </div>
  );
}
