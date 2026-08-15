// FILE: src/components/pro-tools/LitterWatchView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';

const GLOW = '255, 173, 74';
const GESTATION_DAYS = 64;

const GESTATION_STAGES: { week: number; label: string; emoji: string }[] = [
  { week: 1, label: 'Fertilization',    emoji: '🧬' },
  { week: 2, label: 'Implantation',     emoji: '🌱' },
  { week: 3, label: 'Embryo forms',     emoji: '💗' },
  { week: 4, label: 'Organs develop',   emoji: '🫀' },
  { week: 5, label: 'Whiskers & claws', emoji: '🐾' },
  { week: 6, label: 'Fur begins',       emoji: '🧶' },
  { week: 7, label: 'Skeleton hardens', emoji: '🦴' },
  { week: 8, label: 'Rapid growth',     emoji: '📈' },
  { week: 9, label: 'Birth-ready',      emoji: '🍼' },
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, startDeg: number, endDeg: number) {
  const so = polar(cx, cy, rOuter, startDeg), eo = polar(cx, cy, rOuter, endDeg);
  const si = polar(cx, cy, rInner, endDeg), ei = polar(cx, cy, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${so.x} ${so.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${eo.x} ${eo.y} L ${si.x} ${si.y} A ${rInner} ${rInner} 0 ${large} 0 ${ei.x} ${ei.y} Z`;
}

function LitterWheel({ currentWeek }: { currentWeek: number }) {
  const size = 220, cx = 110, cy = 110, rOuter = 100, rInner = 62;
  const segAngle = 360 / GESTATION_STAGES.length;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {GESTATION_STAGES.map((s, i) => {
        const start = i * segAngle, end = start + segAngle - 3;
        const passed = s.week < currentWeek;
        const isCurrent = s.week === currentWeek;
        const color = passed || isCurrent ? GLOW : '148, 148, 158';
        const mid = polar(cx, cy, (rOuter + rInner) / 2, start + segAngle / 2);
        return (
          <g key={s.week}>
            <path d={wedgePath(cx, cy, rOuter, rInner, start, end)}
              fill={`rgba(${color}, ${isCurrent ? 0.9 : passed ? 0.45 : 0.12})`}
              stroke={isCurrent ? `rgb(${GLOW})` : 'transparent'} strokeWidth={isCurrent ? 2 : 0}
              className={isCurrent ? 'lw-pulse' : undefined}
            />
            <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize={14}>{s.emoji}</text>
          </g>
        );
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={22} fontWeight={800} fill={`rgb(${GLOW})`}>Wk {Math.min(9, Math.max(1, currentWeek))}</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fontSize={9} fill="var(--text-tertiary)">of ~9</text>
    </svg>
  );
}

function useCountdown(targetIso: string | null) {
  const [parts, setParts] = useState({ days: 0, hours: 0, minutes: 0 });
  useEffect(() => {
    if (!targetIso) { setParts({ days: 0, hours: 0, minutes: 0 }); return; }
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
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, [targetIso]);
  return parts;
}

interface WatchPet {
  id?: string;
  name?: string;
  species: 'CAT' | 'DOG';
  birthDate: string;
  matingDate?: string;
}

function LitterCard({ pet }: { pet: WatchPet }) {
  const anchorDate = pet.matingDate ?? pet.birthDate;
  const dueDate = useMemo(() => new Date(new Date(anchorDate).getTime() + GESTATION_DAYS * 86400000).toISOString(), [anchorDate]);
  const gestationDay = Math.max(1, Math.round((Date.now() - new Date(anchorDate).getTime()) / 86400000));
  const currentWeek = Math.min(9, Math.max(1, Math.ceil(gestationDay / 7)));
  const isDue = gestationDay >= GESTATION_DAYS;
  const countdown = useCountdown(isDue ? null : dueDate);

  return (
    <div className="ios-card p-6 sm:p-8 mb-6" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>
      <p className="text-headline mb-4 text-center">{pet.species === 'CAT' ? '🐱' : '🐶'} {pet.name || 'A litter'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="ios-card-nested p-5 flex items-center justify-center">
          <LitterWheel currentWeek={currentWeek} />
        </div>
        <div className="ios-card-nested p-5 flex flex-col items-center justify-center text-center">
          <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            {isDue ? 'STATISTICALLY DUE NOW' : 'TIME UNTIL DUE DATE'}
          </p>
          {isDue ? (
            <span className="text-largetitle">🍼</span>
          ) : (
            <div className="flex items-center justify-center gap-2">
              {[{ v: countdown.days, l: 'd' }, { v: countdown.hours, l: 'h' }, { v: countdown.minutes, l: 'm' }].map(u => (
                <div key={u.l} className="ios-card-nested px-2.5 py-1.5 text-center min-w-[48px]">
                  <div className="text-headline font-bold tabular" style={{ color: `rgb(${GLOW})` }}>{u.v}</div>
                  <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{u.l}</div>
                </div>
              ))}
            </div>
          )}
          <p className="text-caption mt-3" style={{ color: 'var(--text-tertiary)' }}>Due around {new Date(dueDate).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}

export function LitterWatchView({ pets }: { pets: WatchPet[] }) {
  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>LITTER WATCH</p>
        <h1 className="text-title1 mb-2">Someone's sharing a litter countdown with you 🐾</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A read-only view — just the development wheel and the due date.
        </p>
      </div>
      {pets.length === 0 ? (
        <p className="text-callout text-center" style={{ color: 'var(--text-secondary)' }}>No litter is being tracked on this link yet.</p>
      ) : (
        pets.map((p, i) => <LitterCard key={p.id ?? i} pet={p} />)
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .lw-pulse { animation: lwPulse 1.8s ease-in-out infinite; }
        @keyframes lwPulse { 0%, 100% { filter: none; } 50% { filter: drop-shadow(0 0 6px rgba(${GLOW}, 0.7)); } }
        @media (prefers-reduced-motion: reduce) { .lw-pulse { animation: none; } }
      `}} />
    </div>
  );
}
