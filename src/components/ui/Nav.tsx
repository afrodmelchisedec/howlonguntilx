'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

const NAV_LINKS = [
  { label:'Categories', href:'/categories',                    cls:'gc-brand'  },
  { label:'Calendar',   href:'/calendar',                      cls:'gc-travel' },
  { label:'Embed',      href:'/embed',                         cls:'gc-sports' },
  { label:'API',        href:'/api/countdown?event=christmas', cls:'gc-finance', ext:true },
];

const INFO_LINKS = [
  { label:'About',   href:'/about'   },
  { label:'Contact', href:'/contact' },
  { label:'Privacy', href:'/privacy' },
];

export function Nav() {
  const { data:session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <nav className="sticky top-0 z-40 glass px-4 sm:px-6 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="press font-black text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
          How<span className="gradient-text">Long</span>Until
        </Link>
        <div className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href}
              {...(l.ext ? { target:'_blank' } : {})}
              className={`nav-link glow ${l.cls} press text-sm font-semibold`}
              style={{ color: 'var(--text-secondary)' }}>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" className="nav-link glow gc-family press text-sm font-bold" style={{ color: 'rgb(var(--accent-orange))' }}>
              ⚙ Admin
            </Link>
          )}
          <div className="hidden lg:flex items-center gap-0.5 ml-2 pl-2" style={{ borderLeft: '1px solid var(--border-hairline)' }}>
            {INFO_LINKS.map(l => (
              <Link key={l.label} href={l.href}
                className="press text-xs font-medium px-2.5 py-1.5 rounded-full transition-opacity hover:opacity-100"
                style={{ color: 'var(--text-tertiary)', opacity: 0.85 }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        {status==='loading' ? (
          <div className="w-24 h-8 rounded-full shimmer" />
        ) : session ? (
          <div className="relative">
            <button onClick={()=>setOpen(!open)}
              className="ios-card interactive press flex items-center gap-2 px-3 py-1.5 rounded-full">
              {session.user.image
                ? <img src={session.user.image} className="w-6 h-6 rounded-full" alt="" />
                : <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center font-bold"
                    style={{ background: 'rgb(var(--accent-brand))' }}>
                    {(session.user.name?.[0]??session.user.email?.[0]??'?').toUpperCase()}
                  </span>}
              <span className="hidden sm:block max-w-[80px] truncate text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                {session.user.name?.split(' ')[0]??session.user.email?.split('@')[0]}
              </span>
              {isAdmin && <span className="pill" style={{ background: 'rgba(var(--accent-orange),0.15)', color: 'rgb(var(--accent-orange))', fontSize: 9 }}>ADMIN</span>}
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>▾</span>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)} />
                <div className="ios-card anim-scale-in absolute right-0 mt-2 w-56 overflow-hidden z-50" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
                    <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{session.user.email}</p>
                    <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: isAdmin ? 'rgb(var(--accent-orange))' : session.user.plan==='PRO' ? 'rgb(var(--accent-brand))' : 'var(--text-tertiary)' }} />
                      {isAdmin?'Administrator':session.user.plan==='PRO'?'⭐ Premium':'Free plan'}
                    </p>
                  </div>
                  {[
                    { href:'/dashboard', label:'📊 My dashboard', cls:'gc-brand' },
                    ...(isAdmin?[{ href:'/admin', label:'⚙️ Admin panel', cls:'gc-family' }]:[]),
                    { href:'/dashboard/settings', label:'⚙ Settings', cls:'gc-brand' },
                  ].map(item=>(
                    <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
                      className={`sidebar-item ${item.cls} flex items-center px-4 py-2.5 text-sm font-medium`}
                      style={{ color: 'var(--text-secondary)' }}>
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={()=>{setOpen(false);signOut({callbackUrl:'/'});}}
                    className="sidebar-item w-full flex items-center px-4 py-2.5 text-sm font-medium"
                    style={{ color: 'rgb(var(--accent-red))', borderTop: '1px solid var(--border-hairline)' }}>
                    ← Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/signin" className="nav-link glow gc-brand press text-sm font-semibold hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
              Sign in
            </Link>
            <Link href="/auth/signup" className="btn-filled press text-sm">
              Sign up free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
