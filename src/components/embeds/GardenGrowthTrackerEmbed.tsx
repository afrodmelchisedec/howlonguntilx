// FILE: src/components/embeds/GardenGrowthTrackerEmbed.tsx
'use client';
import { useState, useMemo } from 'react';

const GLOW = '138, 201, 87';

type PlantKey = 'DAHLIA' | 'CARROT' | 'ONION' | 'GRASS';

interface PlantInfo {
  key: PlantKey; label: string; emoji: string; plantedLabel: string;
  germinationDaysMin: number; germinationDaysMax: number;
  finalDaysMin: number; finalDaysMax: number; finalLabel: string; finalEmoji: string;
}

const PLANTS: PlantInfo[] = [
  { key: 'DAHLIA', label: 'Dahlia',     emoji: '🌷', plantedLabel: 'Tuber planted', germinationDaysMin: 14, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 90,  finalLabel: 'Bloom',     finalEmoji: '🌸' },
  { key: 'CARROT', label: 'Carrots',    emoji: '🥕', plantedLabel: 'Seeds sown',    germinationDaysMin: 10, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 80,  finalLabel: 'Harvest',   finalEmoji: '🥕' },
  { key: 'ONION',  label: 'Onions',     emoji: '🧅', plantedLabel: 'Sets planted',  germinationDaysMin: 7,  germinationDaysMax: 14, finalDaysMin: 100, finalDaysMax: 140, finalLabel: 'Harvest',   finalEmoji: '🧅' },
  { key: 'GRASS',  label: 'Grass seed', emoji: '🌱', plantedLabel: 'Seed sown',     germinationDaysMin: 7,  germinationDaysMax: 21, finalDaysMin: 28,  finalDaysMax: 35,  finalLabel: 'First mow', finalEmoji: '🟩' },
];

function isoDay(d: Date) { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)); }
function mid(a: number, b: number) { return Math.round((a + b) / 2); }
function growthPercent(daysSince: number, finalMid: number) {
  if (daysSince <= 0) return 0;
  if (daysSince >= finalMid) return 100;
  return Math.round(100 * Math.pow(daysSince / finalMid, 0.7));
}

const box: React.CSSProperties = { fontFamily: 'system-ui, -apple-system, sans-serif', background: '#1a1a1e', color: '#f2f2f2', borderRadius: 16, padding: 20, maxWidth: 420, margin: '0 auto', boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25)` };

export function GardenGrowthTrackerEmbed() {
  const [plantKey, setPlantKey] = useState<PlantKey>('DAHLIA');
  const [plantedDate, setPlantedDate] = useState(isoDay(new Date(Date.now() - 21 * 86400000)));

  const plant = PLANTS.find(p => p.key === plantKey)!;
  const germinationMid = mid(plant.germinationDaysMin, plant.germinationDaysMax);
  const finalMid = mid(plant.finalDaysMin, plant.finalDaysMax);

  const daysSince = daysBetween(new Date(plantedDate + 'T00:00:00'), new Date());
  const percent = growthPercent(daysSince, finalMid);
  const germinated = daysSince >= germinationMid;
  const isFinal = daysSince >= finalMid;
  const finalDate = useMemo(() => new Date(new Date(plantedDate + 'T00:00:00').getTime() + finalMid * 86400000), [plantedDate, finalMid]);
  const daysToFinal = Math.max(0, finalMid - daysSince);
  const daysToGermination = Math.max(0, germinationMid - daysSince);

  return (
    <div style={box}>
      <p style={{ fontSize: 11, letterSpacing: 1, color: `rgb(${GLOW})`, marginBottom: 4, fontWeight: 700 }}>GARDEN GROWTH & BLOOM</p>
      <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>What are you growing?</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
        {PLANTS.map(p => (
          <button key={p.key} onClick={() => setPlantKey(p.key)}
            style={{ fontSize: 11, padding: '8px 4px', borderRadius: 10, border: `1px solid ${plantKey === p.key ? `rgb(${GLOW})` : '#3a3a40'}`, background: plantKey === p.key ? `rgba(${GLOW}, 0.15)` : '#2a2a30', color: '#f2f2f2', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 17 }}>{p.emoji}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <label style={{ fontSize: 12, opacity: 0.7, display: 'block', marginBottom: 6 }}>{plant.plantedLabel}</label>
      <input type="date" value={plantedDate} onChange={e => setPlantedDate(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #3a3a40', background: '#2a2a30', color: '#f2f2f2', colorScheme: 'dark', marginBottom: 16 }} />

      <div style={{ background: '#2a2a30', borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>GROWTH PROGRESS</p>
        <p style={{ fontSize: 26, fontWeight: 700, color: `rgb(${GLOW})` }}>{percent}%</p>
        <p style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>{daysSince} days since planting · {plant.finalLabel.toLowerCase()} around {finalDate.toLocaleDateString()}</p>
      </div>

      <div style={{ width: '100%', height: 10, borderRadius: 6, background: '#2a2a30', overflow: 'hidden', marginBottom: 12 }}>
        <div style={{ width: `${percent}%`, height: '100%', background: `rgb(${GLOW})`, transition: 'width 0.3s' }} />
      </div>

      {!isFinal && (
        <div style={{ background: '#2a2a30', borderRadius: 10, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>{germinated ? `TIME UNTIL ${plant.finalLabel.toUpperCase()}` : 'TIME UNTIL SPROUT'}</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: `rgb(${GLOW})` }}>{germinated ? daysToFinal : daysToGermination} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>days</span></p>
        </div>
      )}

      <p style={{ fontSize: 10.5, opacity: 0.5, marginTop: 14, lineHeight: 1.4 }}>
        Germination and bloom or harvest timing vary a lot by climate zone, soil temperature, and frost dates — this is a statistical average, not a forecast for your specific garden.
      </p>
    </div>
  );
}
