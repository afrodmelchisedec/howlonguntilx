'use client';
import { useState, useRef, useEffect } from 'react';

interface Props {
  label: string;
  percent: number;
  color: string;
  rgb: string;
}

export function AnimatedProgressBar({ label, percent, color, rgb }: Props) {
  const [hovered, setHovered] = useState(false);
  const [width, setWidth] = useState(percent);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (hovered) {
      setWidth(0);
      startRef.current = 0;
      cancelAnimationFrame(raf.current);
      function ease(t: number) { return 1 - Math.pow(1 - t, 3); }
      function step(ts: number) {
        if (!startRef.current) startRef.current = ts;
        const p = Math.min((ts - startRef.current) / 700, 1);
        setWidth(ease(p) * percent);
        if (p < 1) raf.current = requestAnimationFrame(step);
      }
      raf.current = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(raf.current);
      setWidth(percent);
    }
    return () => cancelAnimationFrame(raf.current);
  }, [hovered, percent]);

  return (
    <div
      className="flex items-center gap-3 mb-3 cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="text-xs w-24 text-right flex-shrink-0 truncate font-medium transition-all duration-200"
        style={{ color: hovered ? 'rgb(' + rgb + ')' : 'var(--text-secondary)' }}>
        {label}
      </span>
      <div className="flex-1 rounded-full overflow-hidden transition-all duration-200"
        style={{
          height: hovered ? '10px' : '7px',
          background: 'rgba(' + rgb + ',0.12)',
          boxShadow: hovered ? '0 0 12px rgba(' + rgb + ',0.3), inset 0 0 6px rgba(' + rgb + ',0.1)' : 'none',
        }}>
        <div className="h-full rounded-full"
          style={{
            width: width + '%',
            background: hovered
              ? 'linear-gradient(90deg,' + color + ',' + color + '99,' + color + ')'
              : 'linear-gradient(90deg,' + color + ',' + color + '80)',
            boxShadow: hovered ? '0 0 10px rgba(' + rgb + ',0.9), 0 0 24px rgba(' + rgb + ',0.5)' : 'none',
            transition: hovered ? 'none' : 'width 1s ease',
          }}
        />
      </div>
      <span className="text-xs font-black w-10 flex-shrink-0 text-right tabular transition-all duration-200 inline-block"
        style={{
          color: 'rgb(' + rgb + ')',
          textShadow: hovered ? '0 0 14px rgba(' + rgb + ',0.9)' : 'none',
          transform: hovered ? 'scale(1.15)' : 'scale(1)',
        }}>
        {Math.round(width)}%
      </span>
    </div>
  );
}
