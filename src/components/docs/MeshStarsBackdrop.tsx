// FILE: src/components/docs/MeshStarsBackdrop.tsx
'use client';

import { useEffect, useState } from 'react';

type Star = { x: number; y: number; size: number; delay: number; duration: number; drift: number };

// Simple deterministic PRNG so re-renders don't reshuffle the field mid-session.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateStars(count: number, seed: number): Star[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: 1 + rand() * 2,
    delay: rand() * 8,
    duration: 6 + rand() * 10,
    drift: 12 + rand() * 24,
  }));
}

// accent: 'orange' for the API page, 'violet' for the Embed page — keeps the
// two docs sections visually distinct while sharing the same signature motif.
export function MeshStarsBackdrop({ accent = 'orange' }: { accent?: 'orange' | 'violet' }) {
  const [stars, setStars] = useState<Star[] | null>(null);

  useEffect(() => {
    // Generated client-side only, after mount, so SSR/client markup always matches.
    setStars(generateStars(44, accent === 'orange' ? 7 : 13));
  }, [accent]);

  const accentColor = accent === 'orange' ? '255, 159, 10' : '125, 118, 255';

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <style>{`
        @keyframes meshDrift {
          0%   { transform: translate3d(0, 0, 0); }
          50%  { transform: translate3d(-16px, 10px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: var(--star-min-opacity, 0.15); }
          50%      { opacity: var(--star-max-opacity, 0.9); }
        }
        @keyframes starFloat {
          0%   { transform: translateY(0); }
          100% { transform: translateY(var(--drift, -18px)); }
        }
        .mesh-grid {
          position: absolute;
          inset: -20%;
          background-image:
            linear-gradient(rgba(${accentColor}, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(${accentColor}, 0.08) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: meshDrift 26s ease-in-out infinite;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 30%, black 0%, transparent 75%);
        }
        .mesh-star {
          position: absolute;
          border-radius: 50%;
          background: rgb(${accentColor});
          animation: starTwinkle var(--twinkle-duration, 8s) ease-in-out infinite,
                     starFloat var(--float-duration, 14s) ease-in-out infinite alternate;
        }
        @media (prefers-reduced-motion: reduce) {
          .mesh-grid, .mesh-star { animation: none !important; }
        }
      `}</style>

      <div className="mesh-grid" />

      {stars?.map((s, i) => (
        <div
          key={i}
          className="mesh-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s, ${s.delay * 0.6}s`,
            ['--twinkle-duration' as any]: `${s.duration}s`,
            ['--float-duration' as any]: `${s.duration + 6}s`,
            ['--drift' as any]: `-${s.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
