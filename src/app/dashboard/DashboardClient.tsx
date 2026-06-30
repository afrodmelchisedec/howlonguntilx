'use client';
import { useState } from 'react';
import Link from 'next/link';
import { buildCountdownResponse } from '@/lib/countdown';
import { AddTimerModal } from '@/components/countdown/AddTimerModal';
import { TimerCard } from '@/components/countdown/TimerCard';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { MilestoneBar } from '@/components/ui/MilestoneBar';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }
interface Event { slug: string; name: string; targetDate: Date | string; category: string }
interface Session { user: { id: string; name?: string | null; email?: string | null; image?: string | null } }

interface Props {
  session: Session;
  timers: Timer[];
  popular: Event[];
}

export function DashboardClient({ session, timers, popular }: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [localTimers, setLocalTimers] = useState<Timer[]>(timers);

  const name = session.user.name?.split(' ')[0] ?? 'there';
  const urgentTimers = localTimers.filter(t => {
    const { days_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
    return days_left <= 7 && days_left >= 0;
  });

  function onAdded(timer: Timer) {
    setLocalTimers(prev => [timer, ...prev]);
    setShowAdd(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium">Hey, {name} 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {localTimers.length === 0
              ? "You have no countdowns yet — add your first one!"
              : `You're tracking ${localTimers.length} countdown${localTimers.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          + Add countdown
        </button>
      </div>

      {/* Streak + milestone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <StreakBadge count={localTimers.length} />
        <MilestoneBar timers={localTimers} />
      </div>

      {/* Urgent alerts */}
      {urgentTimers.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
            ⚡ Coming up soon
          </p>
          {urgentTimers.map(t => {
            const { days_left, hours_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
            return (
              <p key={t.id} className="text-sm text-amber-600 dark:text-amber-300">
                <strong>{t.name}</strong> — {days_left === 0 ? `${hours_left}h left!` : `${days_left} day${days_left > 1 ? 's' : ''} away`}
              </p>
            );
          })}
        </div>
      )}

      {/* My timers */}
      {localTimers.length > 0 ? (
        <div className="mb-10">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">My countdowns</p>
          <div className="space-y-3">
            {localTimers.map(t => (
              <TimerCard key={t.id} timer={t} onDelete={id => setLocalTimers(prev => prev.filter(x => x.id !== id))} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10 text-center py-16 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
          <div className="text-4xl mb-3">⏳</div>
          <p className="font-medium mb-1">Nothing here yet</p>
          <p className="text-sm text-gray-400 mb-4">Add your first countdown — a deadline, birthday, or goal</p>
          <button onClick={() => setShowAdd(true)}
            className="bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            + Add my first countdown
          </button>
        </div>
      )}

      {/* Suggested popular */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Add a popular countdown</p>
        <div className="grid grid-cols-2 gap-3">
          {popular.map(ev => {
            const { days_left } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
            return (
              <Link key={ev.slug} href={`/how-long-until-${ev.slug}`}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-500 transition-colors group">
                <span className="text-sm font-medium group-hover:text-brand-500">{ev.name}</span>
                <span className="text-brand-500 font-medium text-sm">{days_left}d</span>
              </Link>
            );
          })}
        </div>
      </div>

      {showAdd && <AddTimerModal onClose={() => setShowAdd(false)} onAdded={onAdded} />}
    </div>
  );
}
