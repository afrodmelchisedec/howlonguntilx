'use client';
import { useState } from 'react';
import { useCountUp } from '@/hooks/useCountUp';

interface Props { name: string; days: number; rgb: string; }

export function AnimatedMilestoneCard({ name, days, rgb }: Props) {
  const [hovered, setHovered] = useState(false);
  const display = useCountUp({ end: days, duration: 800, trigger: hovered });
  const urgency = days === 0 ? '🔥 Today!' : days <= 3 ? '⚡ Very soon' : days <= 7 ? '📅 This week' : '🗓️ Upcoming';

  return (
    <div
      className="ios-card interactive anim-fade-up p-4 cursor-default"
      style={{ '--glow': rgb } as React.CSSProperties}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-caption mb-1">Next milestone</p>
      <p className="text-headline truncate">{name}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-2xl font-black tabular transition-all duration-300 inline-block"
          style={{
            color: 'rgb(' + rgb + ')',
            textShadow: hovered ? '0 0 20px rgba(' + rgb + ',0.7), 0 0 40px rgba(' + rgb + ',0.35)' : 'none',
            transform: hovered ? 'scale(1.1)' : 'scale(1)',
          }}>
          {hovered ? display : String(days)}
        </span>
        <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>days</span>
      </div>
      <p className="text-xs mt-0.5 font-semibold" style={{ color: 'rgb(' + rgb + ')' }}>{urgency}</p>
    </div>
  );
}
