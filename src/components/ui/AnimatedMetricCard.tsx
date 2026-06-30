'use client';
import { useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface Props {
  label: string;
  rawValue: number;
  suffix?: string;
  prefix?: string;
  sub: string;
  rgb: string;
  decimals?: number;
}

export function AnimatedMetricCard({ label, rawValue, suffix = '', prefix = '', sub, rgb, decimals = 0 }: Props) {
  const [hovered, setHovered] = useState(false);
  const display = useCountUp({ end: rawValue, duration: 800, suffix, prefix, decimals, trigger: hovered });

  return (
    <div
      className="ios-card interactive anim-fade-up p-4 cursor-default select-none"
      style={{ '--glow': rgb } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-caption mb-1">{label}</p>
      <p
        className="text-2xl font-black tabular transition-all duration-300 inline-block"
        style={{
          color: 'rgb(' + rgb + ')',
          textShadow: hovered ? '0 0 20px rgba(' + rgb + ',0.7), 0 0 40px rgba(' + rgb + ',0.35)' : 'none',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {hovered ? display : (prefix + rawValue.toFixed(decimals) + suffix)}
      </p>
      <p className="text-footnote mt-0.5 truncate">{sub}</p>
    </div>
  );
}
