'use client';
import { useState, useEffect } from 'react';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  progress: number;
  isPast: boolean;
  justHit: boolean; // true the moment the clock hits 0:0:0:0
}

// Deterministic placeholder used for both the server render and the client's
// very first paint — guarantees they match, avoiding the hydration mismatch
// that comes from calling Date.now() during render (server time != client time).
const PLACEHOLDER: CountdownState = {
  days: 0, hours: 0, minutes: 0, seconds: 0,
  progress: 0, isPast: false, justHit: false,
};

export function useCountdown(target: Date): CountdownState {
  const [state, setState] = useState<CountdownState>(PLACEHOLDER);

  useEffect(() => {
    // Compute immediately on mount (client-only, so Date.now() here never
    // needs to match anything the server produced) then tick every second.
    setState(compute(target));
    const id = setInterval(() => setState(compute(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return state;
}

function compute(target: Date): CountdownState {
  const now  = Date.now();
  const diff = target.getTime() - now;

  // isPast ONLY when strictly negative — last second (diff=0) still shows 0d 0h 0m 0s
  const isPast   = diff < -1000;          // 1 s grace
  const justHit  = diff >= -1000 && diff < 0;
  const absDiff  = Math.abs(diff);

  const days    = Math.floor(absDiff / 86_400_000);
  const hours   = Math.floor((absDiff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((absDiff % 3_600_000)  / 60_000);
  const seconds = Math.floor((absDiff % 60_000)      / 1_000);

  const cycleMs = 365 * 86_400_000;
  const progress = isPast
    ? 100
    : Math.max(0, Math.min(100, Math.round(((cycleMs - absDiff) / cycleMs) * 100)));

  return { days: isPast ? 0 : days, hours: isPast ? 0 : hours,
    minutes: isPast ? 0 : minutes, seconds: isPast ? 0 : seconds,
    progress, isPast, justHit };
}
