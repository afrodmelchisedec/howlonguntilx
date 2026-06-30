export interface CountdownData {
  event: string;
  target_date: string;
  days_left: number;
  hours_left: number;
  minutes_left: number;
  seconds_left: number;
  progress_percent: number;
  is_past: boolean;
}

export function buildCountdownResponse(name: string, target: Date): CountdownData {
  const now = Date.now();
  const diff = target.getTime() - now;
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);

  const days = Math.floor(absDiff / 86_400_000);
  const hours = Math.floor((absDiff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((absDiff % 3_600_000) / 60_000);
  const seconds = Math.floor((absDiff % 60_000) / 1_000);

  // Approximate % of year elapsed toward target
  const cycleMs = 365 * 86_400_000;
  const elapsed = cycleMs - absDiff;
  const progress = isPast ? 100 : Math.max(0, Math.min(100, Math.round((elapsed / cycleMs) * 100)));
  
  return {
    event: name,
    target_date: target.toISOString(),
    days_left: isPast ? 0 : days,
    hours_left: isPast ? 0 : hours,
    minutes_left: isPast ? 0 : minutes,
    seconds_left: isPast ? 0 : seconds,
    progress_percent: progress,
    is_past: isPast,
  };
}
