'use client';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { UpgradeButton } from './UpgradeButton';

const FREE = [
  { id:'overview',   label:'Overview',    cls:'gc-brand',  icon:'📊' },
  { id:'timeline',   label:'Timeline',    cls:'gc-sports', icon:'📅' },
  { id:'categories', label:'Categories',  cls:'gc-finance',icon:'🏷️' },
];
const PRO = [
  { id:'crypto', label:'Crypto targets',  cls:'gc-tech',     icon:'₿' },
  { id:'life',   label:'Life expectancy', cls:'gc-personal', icon:'❤️' },
  { id:'world',  label:'World events',    cls:'gc-nature',   icon:'🌍' },
];

interface Props { tab:string; setTab:(t:string)=>void; session:any; isPremium:boolean; isAdmin:boolean }

export function PremiumSidebar({ tab, setTab, session, isPremium, isAdmin }:Props) {
  return (
    <aside className="w-52 flex-shrink-0 glass flex flex-col" style={{ borderRight: '1px solid var(--border-hairline)' }}>

      {/* user badge */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
        <div className="w-10 h-10 rounded-2xl text-white text-sm font-bold flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgb(var(--accent-brand))', boxShadow: '0 4px 16px rgba(var(--accent-brand),0.4)' }}>
          {(session.user.name?.[0] ?? session.user.email?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {session.user.name?.split(' ')[0] ?? 'Account'}
          </p>
          <p className="text-footnote truncate">
            {isAdmin ? '⚙ Administrator' : isPremium ? '⭐ Premium' : '🔓 Free plan'}
          </p>
        </div>
      </div>

      {/* nav */}
      <nav className="p-2 flex-1 overflow-y-auto">
        <p className="text-caption px-3 py-2 mt-1">My dashboard</p>
        {FREE.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`sidebar-item ${t.cls} w-full flex items-center gap-2.5 px-3 py-2.5 text-sm mb-0.5 font-medium ${active ? 'active' : ''}`}>
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(var(--glow))' }} />}
            </button>
          );
        })}

        <p className="text-caption px-3 py-2 mt-3">Premium analytics</p>
        {PRO.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`sidebar-item ${t.cls} w-full flex items-center gap-2.5 px-3 py-2.5 text-sm mb-0.5 font-medium ${active ? 'active' : ''}`}>
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
              {!isPremium && <span className="pill ml-auto" style={{ background: 'rgba(var(--accent-orange),0.15)', color: 'rgb(var(--accent-orange))', fontSize: 8 }}>PRO</span>}
              {active && isPremium && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(var(--glow))' }} />}
            </button>
          );
        })}

        {isAdmin && (
          <>
            <p className="text-caption px-3 py-2 mt-3" style={{ color: 'rgb(var(--accent-orange))' }}>Admin</p>
            <Link href="/admin" className="sidebar-item flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold"
              style={{ color: 'rgb(var(--accent-orange))' }}>
              <span>⚙️</span><span>Admin panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* upgrade CTA */}
      {!isPremium && (
        <div className="p-3" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <div className="rounded-2xl p-4 text-center"
            style={{ background: 'linear-gradient(135deg, rgb(var(--accent-brand)), rgb(var(--accent-purple)))', boxShadow: '0 4px 20px rgba(var(--accent-brand),0.4)' }}>
            <p className="text-xs font-bold text-white mb-0.5">⭐ Go Premium</p>
            <p className="text-[10px] text-white/70 mb-2">Unlock all predictions</p>
            <UpgradeButton />
          </div>
        </div>
      )}

      {/* bottom links */}
      <div className="p-2" style={{ borderTop: '1px solid var(--border-hairline)' }}>
        {[
          { href:'/', label:'← Back to site' },
          { href:'/dashboard/settings', label:'⚙ Settings' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="sidebar-item gc-brand flex items-center text-xs px-3 py-2 font-medium"
            style={{ color: 'var(--text-tertiary)' }}>{l.label}</Link>
        ))}
        <button onClick={() => signOut({ callbackUrl:'/' })}
          className="sidebar-item w-full text-left text-xs px-3 py-2 font-medium"
          style={{ color: 'rgb(var(--accent-red))' }}>← Sign out</button>
      </div>
    </aside>
  );
}
