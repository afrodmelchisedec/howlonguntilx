'use client';
import { useEffect, useState } from 'react';

interface Props {
  isPro: boolean;
  previewSeconds?: number;
  title?: string;
  desc?: string;
  children: React.ReactNode;
}

// Same visual language as premium/shared.tsx's ProGate, but the lock
// engages on a timer instead of being static — used on public tool
// widgets where we want a real taste before the wall.
export function ToolProGate({
  isPro,
  previewSeconds = 3,
  title = 'Keep playing with Premium',
  desc = 'Unlock unlimited plays, saved history, and live updates.',
  children,
}: Props) {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (isPro) { setLocked(false); return; }
    const t = setTimeout(() => setLocked(true), previewSeconds * 1000);
    return () => clearTimeout(t);
  }, [isPro, previewSeconds]);

  return (
    <div className="relative">
      <div className={locked ? 'opacity-30 pointer-events-none select-none transition-opacity duration-500' : 'transition-opacity duration-500'}>
        {children}
      </div>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 anim-fade-up">
          <div className="ios-card p-6 text-center max-w-xs mx-4" style={{ boxShadow: 'var(--shadow-elevated)' }}>
            <div className="text-3xl mb-3">⭐</div>
            <p className="text-headline mb-1">{title}</p>
            <p className="text-footnote mb-5">{desc}</p>
            <button className="btn-filled w-full">Upgrade to Premium — $4/mo</button>
            <p className="text-footnote mt-2">Cancel anytime · No credit card trial</p>
          </div>
        </div>
      )}
    </div>
  );
}
