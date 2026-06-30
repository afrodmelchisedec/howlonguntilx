'use client';
import { ChartCard } from '../shared';
import { buildCountdownResponse } from '@/lib/countdown';

interface Timer { id: string; name: string; targetDate: Date|string; category: string }

const CAT_VARS: Record<string,string> = {
  holidays:'--accent-purple', sports:'--accent-green', finance:'--accent-orange', personal:'--accent-pink',
  tech:'--accent-blue', nature:'--accent-teal', shopping:'--accent-red', entertainment:'--accent-yellow',
};

export function TimelinePanel({ timers }: { timers: Timer[] }) {
  const sorted = [...timers]
    .map(t => ({ ...t, ...buildCountdownResponse(t.name, new Date(t.targetDate)) }))
    .filter(t => !t.is_past)
    .sort((a, b) => a.days_left - b.days_left);

  return (
    <div className="anim-fade-in">
      <div className="mb-6 px-1">
        <h2 className="text-title2">Event timeline</h2>
        <p className="text-footnote mt-0.5">Your upcoming milestones in motion</p>
      </div>

      {sorted.length === 0 ? (
        <div className="p-20 rounded-[28px] text-center" style={{ border: '2px dashed var(--border-hairline)' }}>
          <p className="text-footnote">No upcoming events. Add some countdowns first.</p>
        </div>
      ) : (
        <div className="ios-card glow gc-brand p-1">
          <ChartCard title={`Upcoming Schedule (${sorted.length})`} className="!border-none !shadow-none">
            <div className="space-y-1">
              {sorted.map((t, i) => {
                const colorVar = CAT_VARS[t.category] ?? '--accent-brand';
                const weeks = Math.floor(t.days_left / 7);
                return (
                  <div key={t.id} className="flex gap-4 press rounded-2xl p-3 transition-colors anim-fade-up"
                    style={{ animationDelay: `${i*60}ms` }}>
                    <div className="flex flex-col items-center flex-shrink-0 w-6">
                      <div className="w-3.5 h-3.5 rounded-full mt-2.5 flex-shrink-0 z-10"
                        style={{ background: `rgb(var(${colorVar}))`, border: '3px solid var(--bg-elevated)' }} />
                      {i < sorted.length - 1 && <div className="w-0.5 flex-1 mt-1 rounded-full" style={{ background: 'var(--border-hairline)' }} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-headline">{t.name}</p>
                          <p className="text-caption mt-0.5">{t.category} · {new Date(t.targetDate).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black tabular" style={{ color: `rgb(var(${colorVar}))` }}>
                            {t.days_left}<span className="text-[10px] font-bold ml-0.5 opacity-60">d</span>
                          </p>
                          <p className="text-caption">{weeks > 0 ? `${weeks} weeks` : 'Due soon'}</p>
                        </div>
                      </div>
                      <div className="progress-track mt-3">
                        <div className="progress-fill" style={{ width: t.progress_percent + '%', background: `rgb(var(${colorVar}))` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
