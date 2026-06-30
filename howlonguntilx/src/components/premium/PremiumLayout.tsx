'use client';
import { useState } from 'react';
import { PremiumSidebar } from './PremiumSidebar';
import { OverviewPanel } from './panels/OverviewPanel';
import { TimelinePanel } from './panels/TimelinePanel';
import { CategoriesPanel } from './panels/CategoriesPanel';
import { CryptoPanel } from './panels/CryptoPanel';
import { LifePanel } from './panels/LifePanel';
import { WorldPanel } from './panels/WorldPanel';
import { AddTimerModal } from '@/components/countdown/AddTimerModal';

interface Timer { id: string; name: string; targetDate: Date | string; category: string }
interface Session { user: { id: string; name?: string|null; email?: string|null; image?: string|null; role: string; plan: string } }
interface Props { session: Session; timers: Timer[]; popular: any[] }

export function PremiumLayout({ session, timers: initial, popular }: Props) {
  const [tab, setTab] = useState('overview');
  const [timers, setTimers] = useState<Timer[]>(initial);
  const [showAdd, setShowAdd] = useState(false);
  const isAdmin = session.user.role === 'ADMIN';
  const isPremium = session.user.plan === 'PRO' || isAdmin;

  function onAdded(t: Timer) { setTimers(p => [t, ...p]); setShowAdd(false); }
  function onDelete(id: string) { setTimers(p => p.filter(x => x.id !== id)); }

  const panels: Record<string, React.ReactNode> = {
    overview:   <OverviewPanel timers={timers} popular={popular} onAdd={() => setShowAdd(true)} onDelete={onDelete} session={session} />,
    timeline:   <TimelinePanel timers={timers} />,
    categories: <CategoriesPanel timers={timers} />,
    crypto:     <CryptoPanel isPremium={isPremium} />,
    life:       <LifePanel isPremium={isPremium} />,
    world:      <WorldPanel isPremium={isPremium} />,
  };

  return (
    <div className="flex min-h-[calc(100vh-57px)]" style={{ background: 'var(--bg-base)' }}>
      <PremiumSidebar tab={tab} setTab={setTab} session={session} isPremium={isPremium} isAdmin={isAdmin} />
      <main className="flex-1 overflow-auto p-6">
        {isAdmin && (
          <div className="ios-card mb-5 flex items-center gap-2 text-xs px-4 py-2.5"
            style={{ color: 'rgb(var(--accent-orange))', background: 'rgba(var(--accent-orange),0.08)', border: '1px solid rgba(var(--accent-orange),0.25)' }}>
            <span>⚙</span>
            <span className="font-semibold">Admin mode — all premium features unlocked</span>
            <a href="/admin" className="ml-auto underline hover:no-underline font-semibold">Go to admin panel →</a>
          </div>
        )}
        {panels[tab]}
      </main>
      {showAdd && <AddTimerModal onClose={() => setShowAdd(false)} onAdded={onAdded} />}
    </div>
  );
}
