// FILE: src/components/embeds/EggHatchCalculatorEmbed.tsx
'use client';
import { useState, useEffect } from 'react';

const GLOW = '91, 192, 222'; // eggshell / robin's-egg blue — matches main tool

type Mode = 'INCUBATOR' | 'WILD_NEST';
interface Species { id: string; emoji: string; label: string; mode: Mode; incubationDays: number; lockdownDays?: number; }

const EGG_SPECIES: Species[] = [
  { id: 'CHICKEN',      emoji: '🐔', label: 'Chicken',      mode: 'INCUBATOR', incubationDays: 21, lockdownDays: 3 },
  { id: 'DUCK',         emoji: '🦆', label: 'Duck',         mode: 'INCUBATOR', incubationDays: 28, lockdownDays: 3 },
  { id: 'GOOSE',        emoji: '🪿', label: 'Goose',        mode: 'INCUBATOR', incubationDays: 29, lockdownDays: 3 },
  { id: 'BLUEBIRD',     emoji: '🐦', label: 'Bluebird',     mode: 'WILD_NEST', incubationDays: 13 },
  { id: 'DOVE',         emoji: '🕊️', label: 'Dove',         mode: 'WILD_NEST', incubationDays: 14 },
  { id: 'EAGLE',        emoji: '🦅', label: 'Eagle',        mode: 'WILD_NEST', incubationDays: 35 },
  { id: 'HOUSE_FINCH',  emoji: '🐤', label: 'House Finch',  mode: 'WILD_NEST', incubationDays: 13 },
  { id: 'GENERIC_BIRD', emoji: '🥚', label: 'Bird (general)', mode: 'WILD_NEST', incubationDays: 13 },
];

function dayNow(startDate: string): number {
  return Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function EggHatchCalculatorEmbed() {
  const [speciesId, setSpeciesId] = useState('CHICKEN');
  const [startDate, setStartDate] = useState('');
  const [day, setDay] = useState<number | null>(null);

  const species = EGG_SPECIES.find(s => s.id === speciesId)!;

  useEffect(() => {
    if (!startDate) { setDay(null); return; }
    setDay(dayNow(startDate));
    const id = setInterval(() => setDay(dayNow(startDate)), 60000);
    return () => clearInterval(id);
  }, [startDate]);

  const percent = day !== null ? Math.min(100, Math.max(0, (day / species.incubationDays) * 100)) : 0;
  const daysLeft = day !== null ? Math.max(0, species.incubationDays - day) : null;
  const turnUntilDay = species.lockdownDays ? species.incubationDays - species.lockdownDays : null;
  const inLockdown = turnUntilDay !== null && day !== null && day >= turnUntilDay;

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>EGG HATCH COUNTDOWN</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Pick a species</p>

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 14 }}>
        {EGG_SPECIES.map(s => (
          <button key={s.id} onClick={() => setSpeciesId(s.id)}
            style={{ flexShrink: 0, fontSize: 11, padding: '8px 6px', borderRadius: 10, width: 70, border: `1px solid ${speciesId === s.id ? `rgb(${GLOW})` : '#3a3a40'}`, background: speciesId === s.id ? `rgba(${GLOW}, 0.12)` : '#2a2a30', color: '#f2f2f2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 18 }}>{s.emoji}</span>
            <span style={{ textAlign: 'center', lineHeight: 1.2 }}>{s.label}</span>
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>
        {species.mode === 'INCUBATOR' ? 'Incubation start date' : 'Date incubation began (first egg / noticed)'}
      </label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 16 }} />

      {day !== null && (
        <>
          <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 12 }}>
            <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{species.emoji} DAY {Math.max(0, day)} OF {species.incubationDays}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: `rgb(${GLOW})` }}>{daysLeft} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>{daysLeft === 1 ? 'day' : 'days'} to hatch</span></p>
          </div>

          <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${percent}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
          </div>

          {species.mode === 'INCUBATOR' && turnUntilDay !== null && (
            <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, fontSize: 12.5, lineHeight: 1.5, marginBottom: 4 }}>
              {inLockdown
                ? <>🔒 In lockdown — stop turning, raise humidity, and don't open the incubator until hatch.</>
                : <>🔄 Turn eggs through day {turnUntilDay}, then lockdown begins.</>}
            </div>
          )}

          {species.mode === 'WILD_NEST' && (
            <div style={{ background: 'rgba(255,184,0,0.1)', border: '1px solid rgba(255,184,0,0.3)', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.5 }}>
              🐦 This is a nest-watch estimate, not an incubation guide — these eggs are incubated by the parent bird. Disturbing an active wild nest is often legally protected. If an egg or nestling seems abandoned or injured, contact a licensed wildlife rehabilitator.
            </div>
          )}
        </>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Incubation lengths are commonly-cited averages — actual hatch timing varies. Not veterinary or wildlife-rehabilitation advice.
      </p>
    </div>
  );
}
