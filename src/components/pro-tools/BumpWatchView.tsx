// FILE: src/components/pro-tools/BumpWatchView.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';

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
    if (dpo >= a.dpo && dpo <= b.dpo) {
      const t = (dpo - a.dpo) / (b.dpo - a.dpo);
      return a.p + t * (b.p - a.p);
    }
  }
  return 0;
}

function daysBetween(a: Date, b: Date) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

interface HistoryPoint { date: string; dpo: number; probability: number }

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

function Horizon({ todayDpo, history }: { todayDpo: number; history: HistoryPoint[] }) {
  const minDpo = -3, maxDpo = 21;
  const W = 460, H = 150, PAD = 14;
  const xFor = (dpo: number) => PAD + ((dpo - minDpo) / (maxDpo - minDpo)) * (W - PAD * 2);
  const yFor = (p: number) => H - PAD - (p / 100) * (H - PAD * 2);

  const pts: { x: number; y: number }[] = [];
  for (let d = minDpo; d <= maxDpo; d += 0.5) pts.push({ x: xFor(d), y: yFor(detectionProbability(d)) });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${path} L ${xFor(maxDpo)},${H - PAD} L ${xFor(minDpo)},${H - PAD} Z`;

  const todayX = xFor(Math.max(minDpo, Math.min(maxDpo, todayDpo)));
  const todayY = yFor(detectionProbability(todayDpo));
  const thresholdY = yFor(85);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="bw-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(${GLOW})`} stopOpacity={0.28} />
          <stop offset="100%" stopColor={`rgb(${GLOW})`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <line x1={PAD} x2={W - PAD} y1={thresholdY} y2={thresholdY} stroke="rgb(255, 214, 108)" strokeDasharray="4 3" strokeWidth={1} opacity={0.55} />
      <text x={W - PAD} y={thresholdY - 4} fontSize={9} textAnchor="end" fill="rgb(255, 214, 108)">reliable zone</text>
      <path d={areaPath} fill="url(#bw-area)" />
      <path d={path} fill="none" stroke={`rgb(${GLOW})`} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {history.map(h => (
        <circle key={h.date} cx={xFor(h.dpo)} cy={yFor(h.probability)} r={3} fill={`rgb(${GLOW})`} opacity={0.45} />
      ))}
      <circle cx={todayX} cy={todayY} r={7} fill={`rgb(${GLOW})`} stroke="white" strokeWidth={2} className="bw-pulse" />
      <text x={PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)">Ovulation</text>
      <text x={W - PAD} y={H - 2} fontSize={9} fill="var(--text-tertiary)" textAnchor="end">DPO {maxDpo}</text>
    </svg>
  );
}

export function BumpWatchView({ lastPeriod, cycleLength, history }: { lastPeriod: string; cycleLength: number; history: HistoryPoint[] }) {
  const ovulationDate = useMemo(() => {
    const start = new Date(lastPeriod + 'T00:00:00');
    return new Date(start.getTime() + (cycleLength - 14) * 86400000);
  }, [lastPeriod, cycleLength]);

  const todayDpo = useMemo(() => daysBetween(ovulationDate, new Date()), [ovulationDate]);
  const testReadyDate = useMemo(() => new Date(ovulationDate.getTime() + 15 * 86400000).toISOString(), [ovulationDate]);
  const testReady = todayDpo >= 15;
  const countdown = useCountdown(testReady ? null : testReadyDate);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <div className="text-center mb-6">
        <p className="text-caption mb-1" style={{ color: `rgb(${GLOW})` }}>BUMP WATCH</p>
        <h1 className="text-title1 mb-2">Someone's sharing their countdown with you 💗</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          A read-only view — no symptoms or personal notes are shared here, just the horizon and the date.
        </p>
      </div>

      <div className="ios-card p-6 sm:p-8" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.12)` }}>
        <div className="ios-card-nested p-4 mb-6">
          <p className="text-footnote font-semibold mb-2">Hormone Horizon</p>
          <Horizon todayDpo={todayDpo} history={history} />
        </div>

        <div className="ios-card-nested p-5 flex flex-col items-center justify-center text-center">
          <p className="text-caption font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
            {testReady ? 'A TEST IS STATISTICALLY RELIABLE NOW' : 'TIME UNTIL A RELIABLE TEST'}
          </p>
          {testReady ? (
            <span className="text-largetitle" style={{ color: `rgb(${GLOW})` }}>🌕</span>
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
        </div>

        <div className="ios-card-nested p-4 mt-6 flex gap-3 items-start" style={{ borderLeft: `3px solid rgb(${GLOW})` }}>
          <span className="text-lg flex-shrink-0">ℹ️</span>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
            This is a statistical estimate for a typical cycle — it cannot confirm or rule out pregnancy for any individual.
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bw-pulse { animation: bwPulse 1.8s ease-in-out infinite; }
        @keyframes bwPulse {
          0%, 100% { r: 7; filter: drop-shadow(0 0 3px rgba(${GLOW}, 0.6)); }
          50% { r: 9; filter: drop-shadow(0 0 8px rgba(${GLOW}, 0.9)); }
        }
        @media (prefers-reduced-motion: reduce) { .bw-pulse { animation: none; } }
      `}} />
    </div>
  );
}
