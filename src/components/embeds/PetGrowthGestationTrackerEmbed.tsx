// FILE: src/components/embeds/PetGrowthGestationTrackerEmbed.tsx
'use client';
import { useState, useMemo } from 'react';

const GLOW = '255, 173, 74';
const GESTATION_DAYS = 64;

type Species = 'CAT' | 'DOG';
type BreedSize = 'TOY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'GIANT';
type Mode = 'GROWTH' | 'GESTATION';

const BREED_SIZES: { id: BreedSize; label: string; maturityWeeks: number }[] = [
  { id: 'TOY',    label: 'Toy',    maturityWeeks: 40 },
  { id: 'SMALL',  label: 'Small',  maturityWeeks: 48 },
  { id: 'MEDIUM', label: 'Medium', maturityWeeks: 56 },
  { id: 'LARGE',  label: 'Large',  maturityWeeks: 68 },
  { id: 'GIANT',  label: 'Giant',  maturityWeeks: 90 },
];
const CAT_MATURITY_WEEKS = 52;

const GESTATION_LABELS: Record<number, string> = {
  1: 'Fertilization', 2: 'Implantation', 3: 'Embryo forms', 4: 'Organs develop',
  5: 'Whiskers & claws', 6: 'Fur begins', 7: 'Skeleton hardens', 8: 'Rapid growth', 9: 'Birth-ready',
};

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function weeksBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / (7 * 86400000))); }
function maturityWeeksFor(species: Species, breedSize: BreedSize) {
  return species === 'CAT' ? CAT_MATURITY_WEEKS : (BREED_SIZES.find(b => b.id === breedSize)?.maturityWeeks ?? 56);
}
function growthPercent(weeksOld: number, maturityWeeks: number) {
  if (weeksOld <= 0) return 0;
  if (weeksOld >= maturityWeeks) return 100;
  return Math.round(100 * Math.pow(weeksOld / maturityWeeks, 0.6));
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };
const seg: React.CSSProperties = { flex: 1, padding: '8px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer', border: 'none' };

export function PetGrowthGestationTrackerEmbed() {
  const [mode, setMode] = useState<Mode>('GROWTH');
  const [species, setSpecies] = useState<Species>('DOG');
  const [breedSize, setBreedSize] = useState<BreedSize>('MEDIUM');
  const [birthDate, setBirthDate] = useState(isoDay(new Date(Date.now() - 12 * 7 * 86400000)));
  const [matingDate, setMatingDate] = useState(isoDay(new Date(Date.now() - 21 * 86400000)));

  const maturityWeeks = maturityWeeksFor(species, breedSize);
  const weeksOld = weeksBetween(new Date(birthDate + 'T00:00:00'), new Date());
  const percent = growthPercent(weeksOld, maturityWeeks);

  const gestationDay = Math.max(1, Math.round((Date.now() - new Date(matingDate + 'T00:00:00').getTime()) / 86400000));
  const currentWeek = Math.min(9, Math.max(1, Math.ceil(gestationDay / 7)));
  const isDue = gestationDay >= GESTATION_DAYS;
  const dueDate = useMemo(() => new Date(new Date(matingDate + 'T00:00:00').getTime() + GESTATION_DAYS * 86400000), [matingDate]);
  const daysToDue = Math.max(0, GESTATION_DAYS - gestationDay);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>PET GROWTH & GESTATION</p>

      <div style={{ display: 'flex', gap: 4, background: '#2a2a30', borderRadius: 10, padding: 4, marginBottom: 14 }}>
        {(['GROWTH', 'GESTATION'] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ ...seg, background: mode === m ? `rgb(${GLOW})` : 'transparent', color: mode === m ? '#1a1a1e' : '#f2f2f2' }}>
            {m === 'GROWTH' ? '🐾 Growth' : '🥚 Gestation'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['CAT', 'DOG'] as Species[]).map(s => (
          <button key={s} onClick={() => setSpecies(s)} style={{ ...seg, background: species === s ? `rgb(${GLOW})` : '#2a2a30', color: species === s ? '#1a1a1e' : '#f2f2f2' }}>
            {s === 'CAT' ? '🐱 Cat' : '🐶 Dog'}
          </button>
        ))}
      </div>

      {mode === 'GROWTH' ? (
        <>
          {species === 'DOG' && (
            <>
              <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Breed size</label>
              <select value={breedSize} onChange={e => setBreedSize(e.target.value as BreedSize)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', marginBottom: 10 }}>
                {BREED_SIZES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </>
          )}
          <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Birth date</label>
          <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 16 }} />

          <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>GROWTH PROGRESS</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{percent}%</p>
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{weeksOld} weeks old · full grown around {new Date(birthDate + 'T00:00:00').getTime() + maturityWeeks * 7 * 86400000 > 0 ? new Date(new Date(birthDate + 'T00:00:00').getTime() + maturityWeeks * 7 * 86400000).toLocaleDateString() : ''}</p>
          </div>
          <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden' }}>
            <div style={{ width: `${percent}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
          </div>
        </>
      ) : (
        <>
          <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>Mating date</label>
          <input type="date" value={matingDate} onChange={e => setMatingDate(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 16 }} />

          <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{isDue ? 'STATISTICALLY DUE NOW' : 'TIME UNTIL DUE DATE'}</p>
            {isDue ? (
              <p style={{ fontSize: 28 }}>🍼</p>
            ) : (
              <p style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{daysToDue} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>days</span></p>
            )}
            <p style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Due around {dueDate.toLocaleDateString()}</p>
          </div>

          <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>Week {currentWeek} of ~9</p>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{GESTATION_LABELS[currentWeek]}</p>
          </div>
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Growth timelines and gestation length vary by individual animal and breed line — this is a statistical estimate, not a veterinary assessment.
      </p>
    </div>
  );
}
