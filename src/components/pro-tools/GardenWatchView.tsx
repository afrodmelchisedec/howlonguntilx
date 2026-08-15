// FILE: src/components/pro-tools/GardenWatchView.tsx
'use client';
import { useState, useEffect } from 'react';

const GLOW = '138, 201, 87';

type PlantKey = 'DAHLIA' | 'CARROT' | 'ONION' | 'GRASS';
type Season = 'WARM' | 'AVERAGE' | 'COOL';

interface PlantInfo {
  key: PlantKey;
  label: string;
  emoji: string;
  plantedLabel: string;
  germinationDaysMin: number;
  germinationDaysMax: number;
  finalDaysMin: number;
  finalDaysMax: number;
  finalLabel: string;
  finalEmoji: string;
}

const PLANTS: PlantInfo[] = [
  { key: 'DAHLIA', label: 'Dahlia',     emoji: '🌷', plantedLabel: 'Tuber planted', germinationDaysMin: 14, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 90,  finalLabel: 'Bloom',     finalEmoji: '🌸' },
  { key: 'CARROT', label: 'Carrots',    emoji: '🥕', plantedLabel: 'Seeds sown',    germinationDaysMin: 10, germinationDaysMax: 21, finalDaysMin: 70,  finalDaysMax: 80,  finalLabel: 'Harvest',   finalEmoji: '🥕' },
  { key: 'ONION',  label: 'Onions',     emoji: '🧅', plantedLabel: 'Sets planted',  germinationDaysMin: 7,  germinationDaysMax: 14, finalDaysMin: 100, finalDaysMax: 140, finalLabel: 'Harvest',   finalEmoji: '🧅' },
  { key: 'GRASS',  label: 'Grass seed', emoji: '🌱', plantedLabel: 'Seed sown',     germinationDaysMin: 7,  germinationDaysMax: 21, finalDaysMin: 28,  finalDaysMax: 35,  finalLabel: 'First mow', finalEmoji: '🟩' },
];

const SEASON_FACTOR: Record<Season, number> = { WARM: 0.9, AVERAGE: 1, COOL: 1.15 };

interface Bed {
  id: string;
  name: string;
  plant: PlantKey;
  plantedDate: string;
  season: Season;
}

function mid(a: number, b: number) { return Math.round((a + b) / 2); }
function daysBetween(a: Date, b: Date) { return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000)); }

function growthPercent(daysSince: number, finalMid: number) {
  if (daysSince <= 0) return 0;
  if (daysSince >= finalMid) return 100;
  return Math.round(100 * Math.pow(daysSince / finalMid, 0.7));
}

function stagesFor(plant: PlantInfo, germinationMid: number, finalMid: number) {
  return [
    { key: 'planted',  label: plant.plantedLabel, atDays: 0 },
    { key: 'sprouted', label: 'Sprouted',          atDays: germinationMid },
    { key: 'growing',  label: 'Growing strong',    atDays: Math.round(finalMid * 0.6) },
    { key: 'final',    label: plant.finalLabel,    atDays: finalMid },
  ];
}

// ── Grow Stem visual (read-only, ported from GardenGrowthTracker) ───────
function GrowStem({ percent, finalEmoji, glow }: { percent: number; finalEmoji: string; glow: string }) {
  const W = 200, H = 220;
  const baseY = 190, maxStemHeight = 140;
  const stemTopY = baseY - (percent / 100) * maxStemHeight;
  const leaf1Show = percent >= 40;
  const leaf2Show = percent >= 70;
  const flowerOpacity = Math.max(0, Math.min(1, (percent - 85) / 15));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
      <ellipse cx={100} cy={198} rx={54} ry={14} fill="rgba(120, 84, 52, 0.35)" />
      <ellipse cx={100} cy={194} rx={44} ry={10} fill="rgba(120, 84, 52, 0.5)" />

      <line x1={100} y1={baseY} x2={100} y2={stemTopY} stroke={`rgb(${glow})`} strokeWidth={5} strokeLinecap="round"
        style={{ transition: 'y2 0.8s ease-out' }} />

      <g style={{ opacity: leaf1Show ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <path d={`M 100 ${baseY - 56} Q 78 ${baseY - 66}, 76 ${baseY - 48} Q 90 ${baseY - 50}, 100 ${baseY - 56}`} fill={`rgb(${glow})`} />
        <path d={`M 100 ${baseY - 56} Q 122 ${baseY - 66}, 124 ${baseY - 48} Q 110 ${baseY - 50}, 100 ${baseY - 56}`} fill={`rgb(${glow})`} />
      </g>
      <g style={{ opacity: leaf2Show ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <path d={`M 100 ${baseY - 98} Q 74 ${baseY - 106}, 72 ${baseY - 88} Q 88 ${baseY - 92}, 100 ${baseY - 98}`} fill={`rgb(${glow})`} />
        <path d={`M 100 ${baseY - 98} Q 126 ${baseY - 106}, 128 ${baseY - 88} Q 112 ${baseY - 92}, 100 ${baseY - 98}`} fill={`rgb(${glow})`} />
      </g>

      <text x={100} y={stemTopY - 6} textAnchor="middle" fontSize={28} style={{ opacity: flowerOpacity, transition: 'opacity 0.8s ease' }}>
        {finalEmoji}
      </text>
    </svg>
  );
}

// ── Stage timeline strip (read-only) ─────────────────────────────────────
function StageTimeline({ stages, daysSince, glow }: { stages: { key: string; label: string; atDays: number }[]; daysSince: number; glow: string }) {
  return (
    <div className="flex items-center">
      {stages.map((s, i) => {
        const reached = daysSince >= s.atDays;
        const isCurrent = reached && (i === stages.length - 1 || daysSince < stages[i + 1].atDays);
        return (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5" style={{ minWidth: 64 }}>
              <div
                style={{
                  width: 16, height: 16, borderRadius: '50%',
                  background: reached ? `rgb(${glow})` : 'var(--border-hairline)',
                  boxShadow: isCurrent ? `0 0 10px rgba(${glow}, 0.7)` : 'none',
                  transition: 'background 0.4s ease',
                }}
              />
              <span className="text-caption text-center" style={{ color: reached ? `rgb(${glow})` : 'var(--text-tertiary)', fontWeight: reached ? 700 : 500 }}>
                {s.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-1" style={{ background: daysSince >= stages[i + 1].atDays ? `rgb(${glow})` : 'var(--border-hairline)', transition: 'background 0.4s ease', marginBottom: 20 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function BedCard({ bed }: { bed: Bed }) {
  const plant = PLANTS.find(p => p.key === bed.plant) ?? PLANTS[0];
  const factor = SEASON_FACTOR[bed.season] ?? 1;
  const germinationMid = Math.round(mid(plant.germinationDaysMin, plant.germinationDaysMax) * factor);
  const finalMid = Math.round(mid(plant.finalDaysMin, plant.finalDaysMax) * factor);
  const daysSince = daysBetween(new Date(bed.plantedDate), new Date());
  const percent = growthPercent(daysSince, finalMid);
  const stages = stagesFor(plant, germinationMid, finalMid);

  return (
    <div className="ios-card p-6 sm:p-8 mb-4" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>{plant.emoji} {plant.label.toUpperCase()}</p>
          <h3 className="text-headline">{bed.name}</h3>
        </div>
        <span className="text-caption font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{percent}%</span>
      </div>

      <div className="flex justify-center mb-4">
        <div style={{ maxWidth: 180 }}>
          <GrowStem percent={percent} finalEmoji={plant.finalEmoji} glow={GLOW} />
        </div>
      </div>

      <StageTimeline stages={stages} daysSince={daysSince} glow={GLOW} />

      <p className="text-caption text-center mt-3" style={{ color: 'var(--text-tertiary)' }}>
        Day {daysSince} since {plant.plantedLabel.toLowerCase()}
      </p>
    </div>
  );
}

export function GardenWatchView({ beds }: { beds: Bed[] }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>GARDEN WATCH</p>
        <h1 className="text-title1 mb-2">Someone's sharing their garden with you 🌱</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A read-only view — no personal notes are shared here, just each bed's growth stage.
        </p>
      </div>

      {beds.length === 0 ? (
        <div className="ios-card p-6 sm:p-8 text-center" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)` }}>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>No beds have been added yet.</p>
        </div>
      ) : (
        beds.map(bed => <BedCard key={bed.id} bed={bed} />)
      )}
    </div>
  );
}
