'use client';
import { useRef, useState } from 'react';
import { ToolProGate } from './ToolProGate';

interface Particle { id: number; x: number }

function HypeTapInner({ eventName }: { eventName: string }) {
  const [taps, setTaps] = useState(0);
  const [communityTotal, setCommunityTotal] = useState(() => 1000 + Math.floor(Math.random() * 5000));
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  function tap() {
    setTaps(t => t + 1);
    setCommunityTotal(c => c + 1);
    const id = idRef.current++;
    const x = Math.random() * 60 - 30;
    setParticles(p => [...p, { id, x }]);
    setTimeout(() => setParticles(p => p.filter(pp => pp.id !== id)), 800);
  }

  return (
    <div className="ios-card p-6 gc-brand glow text-center">
      <h3 className="text-headline mb-1">🔥 Hype Tap</h3>
      <p className="text-footnote mb-4">How hyped are you for {eventName}? Tap to add to the count.</p>

      <div className="relative flex justify-center mb-4" style={{ height: 120 }}>
        <button
          onClick={tap}
          className="press"
          style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgb(var(--accent-brand))', color: 'white',
            fontSize: 28, fontWeight: 900, border: 'none', cursor: 'pointer',
          }}
        >
          {taps}
        </button>
        {particles.map(p => (
          <span key={p.id}
            style={{
              position: 'absolute', top: 10, left: `calc(50% + ${p.x}px)`,
              color: 'rgb(var(--accent-brand))', fontWeight: 700, fontSize: 14,
              animation: 'floatUp 0.8s ease-out forwards',
            }}
          >
            +1
          </span>
        ))}
      </div>

      <p className="text-footnote">
        Community hype: <strong style={{ color: 'rgb(var(--accent-brand))' }}>{communityTotal.toLocaleString()}</strong> taps
      </p>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-40px); }
        }
      `}</style>
    </div>
  );
}

export function HypeTap({ isPro = false, eventName }: { isPro?: boolean; eventName: string }) {
  return (
    <ToolProGate isPro={isPro} title="Save your hype history with Premium" desc="Unlock your all-time tap history and see your rank among top fans.">
      <HypeTapInner eventName={eventName} />
    </ToolProGate>
  );
}
