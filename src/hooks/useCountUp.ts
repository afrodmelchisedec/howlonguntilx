'use client';
import { useEffect, useRef, useState } from 'react';

interface Options {
  end: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  trigger?: boolean;
}

export function useCountUp({ end, duration = 900, decimals = 0, suffix = '', prefix = '', trigger = true }: Options) {
  const [display, setDisplay] = useState(prefix + (0).toFixed(decimals) + suffix);
  const raf = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (!trigger) return;
    cancelAnimationFrame(raf.current);
    startTime.current = 0;
    function ease(t: number) { return 1 - Math.pow(1 - t, 3); }
    function step(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const value = ease(progress) * end;
      setDisplay(prefix + value.toFixed(decimals) + suffix);
      if (progress < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [end, duration, trigger]);

  return display;
}
