'use client';
import { useCountdown } from '@/hooks/useCountdown';
import { useEffect, useRef, useState } from 'react';
import { MilestoneCelebration } from '@/components/ui/MilestoneCelebration';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }
interface Props { timer: Timer; onDelete: (id: string) => void; index?: number }

/* category -> gc-* class defined in globals.css (theme-aware var(--glow-*)) */
const CAT_CLASS: Record<string, string> = {
  holidays: 'gc-holidays', sports: 'gc-sports', finance: 'gc-finance',
  personal: 'gc-personal', tech: 'gc-tech', nature: 'gc-nature',
  entertainment: 'gc-entertainment', shopping: 'gc-shopping', space: 'gc-space',
  health: 'gc-health', work: 'gc-work', family: 'gc-family',
  education: 'gc-education', travel: 'gc-travel',
};

export function TimerCard({ timer, onDelete, index = 0 }: Props) {
  const target = new Date(timer.targetDate);
  const { days, hours, minutes, seconds, progress, isPast, justHit } = useCountdown(target);
  const catClass = CAT_CLASS[timer.category] ?? 'gc-brand';
  const prev    = useRef(seconds);
  const secRef  = useRef<HTMLSpanElement>(null);
  const [celebrated, setCelebrated] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (seconds !== prev.current && secRef.current) {
      secRef.current.classList.remove('tick');
      void secRef.current.offsetWidth;
      secRef.current.classList.add('tick');
      prev.current = seconds;
    }
  }, [seconds]);

  useEffect(() => {
    if (justHit && !celebrated) {
      setCelebrated(true);
      setShowCelebration(true);
      fetch('/api/timers/celebrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timerName: timer.name }),
      }).catch(() => {});
    }
  }, [justHit, celebrated, timer.name]);

  async function del() {
    await fetch('/api/timers/' + timer.id, { method: 'DELETE' });
    onDelete(timer.id);
  }

  // urgency: today -> red, <=3 days -> orange, else category glow
  const urgencyVar = days === 0 && !isPast ? 'var(--accent-red)' : days <= 3 ? 'var(--accent-orange)' : 'rgb(var(--glow))';

  return (
    <>
      {showCelebration && (
        <MilestoneCelebration
          timerName={timer.name}
          onClose={() => setShowCelebration(false)}
        />
      )}

      <div
        className={`ios-card interactive glow ${catClass} anim-fade-up p-5 relative overflow-hidden group`}
        style={{ animationDelay: `${index * 60}ms` }}
      >
        {/* top accent stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 opacity-90"
          style={{ background: `linear-gradient(90deg, rgb(var(--glow)), rgba(var(--glow),0))` }} />

        {/* achieved badge */}
        {isPast && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
            style={{ background: 'rgb(var(--accent-green))', boxShadow: '0 0 16px rgba(var(--accent-green),0.45)' }}>
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <path d="M2 6 L5 9 L10 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="pulse-dot w-2.5 h-2.5 flex-shrink-0 inline-block"
              style={{ background: isPast ? 'rgb(var(--accent-green))' : 'rgb(var(--glow))' }} />
            <p className="text-headline truncate" style={{ color: 'var(--text-primary)' }}>{timer.name}</p>
          </div>
          <button onClick={del}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-1.5 w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center text-lg font-light press"
            style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgb(var(--accent-red))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
            ×
          </button>
        </div>

        {/* countdown */}
        {isPast ? (
          <div className="mb-4">
            <p className="text-title3" style={{ color: 'rgb(var(--accent-green))' }}>Milestone Reached</p>
            <p className="text-caption mt-1">
              {new Date(timer.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="flex items-baseline gap-1.5 mb-5 tabular">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-black leading-none" style={{ color: urgencyVar }}>{String(days).padStart(2, '0')}</span>
              <span className="text-caption mt-0.5">Days</span>
            </div>
            <span className="text-xl font-bold opacity-25 mb-2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{String(hours).padStart(2, '0')}</span>
              <span className="text-caption mt-0.5">Hrs</span>
            </div>
            <span className="text-xl font-bold opacity-25 mb-2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold leading-none" style={{ color: 'var(--text-primary)' }}>{String(minutes).padStart(2, '0')}</span>
              <span className="text-caption mt-0.5">Min</span>
            </div>
            <span className="text-xl font-bold opacity-25 mb-2" style={{ color: 'var(--text-tertiary)' }}>:</span>
            <div className="flex flex-col items-center">
              <span ref={secRef} className="text-sm font-medium leading-none" style={{ color: 'var(--text-secondary)' }}>{String(seconds).padStart(2, '0')}</span>
              <span className="text-caption mt-0.5">Sec</span>
            </div>
          </div>
        )}

        {/* progress */}
        <div className="progress-track mb-2">
          <div className="progress-fill" style={{
            width: progress + '%',
            background: isPast ? 'rgb(var(--accent-green))' : 'rgb(var(--glow))',
          }} />
        </div>

        <div className="flex justify-between items-center px-0.5">
          <span className="text-caption">{Math.round(progress)}% progress</span>
          <span className="pill" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>
            {new Date(timer.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </>
  );
}
