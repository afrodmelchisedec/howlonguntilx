// FILE: src/components/ui/Nav.tsx
'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';
import { NAV_LINKS, INFO_LINKS } from '@/lib/nav-links';

export function Nav() {
  const { data:session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <nav className="sticky top-0 z-40 glass px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="press font-black text-lg tracking-tight flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#c98fe0" /><stop offset="100%" stopColor="#e07ab0" /></linearGradient></defs><rect width="32" height="32" rx="8" fill="url(#navGrad)" /><path d="M9 7h14M9 25h14M11 7c0 6 4 7 5 9-1 2-5 3-5 9h10c0-6-4-7-5-9 1-2 5-3 5-9" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg><span className="sm:hidden">HL<span className="gradient-text">UX</span></span><span className="hidden sm:inline">How Long<span className="gradient-text"> Until x</span></span>
          </Link>

          {/* Desktop: single organized "Explore" dropdown instead of a flat row of pills */}
          <div className="hidden sm:flex items-center gap-0.5">
            <div className="relative">
              <button
                onClick={() => setExploreOpen(v => !v)}
                className="nav-link press text-sm font-semibold flex items-center gap-1.5"
                style={{ color: 'var(--text-secondary)' }}
                aria-expanded={exploreOpen}
              >
                Explore
                <span
                  className="text-xs"
                  style={{ transition: 'transform 0.22s var(--spring)', transform: exploreOpen ? 'rotate(180deg)' : 'none', display: 'inline-block' }}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {exploreOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExploreOpen(false)} />
                  <div className="ios-card anim-scale-in absolute left-0 mt-2 w-72 overflow-hidden z-50 py-1.5" style={{ boxShadow: 'var(--shadow-elevated)' }}>
                    {NAV_LINKS.map(l => (
                      <Link key={l.label} href={l.href}
                        {...(l.ext ? { target: '_blank' } : {})}
                        onClick={() => setExploreOpen(false)}
                        className={`sidebar-item ${l.cls} flex items-center gap-3 px-4 py-2.5`}>
                        <span className="text-lg leading-none" aria-hidden="true">{l.icon}</span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{l.label}</span>
                          <span className="block text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{l.description}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

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

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="sm:hidden ios-card interactive press flex items-center justify-center w-9 h-9 rounded-full"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}>
            <span className="flex flex-col items-center justify-center gap-[3px]">
              <span style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--text-secondary)', transition: 'transform 0.2s', transform: mobileOpen ? 'translateY(5px) rotate(45deg)' : 'none' }} />
              <span style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--text-secondary)', transition: 'opacity 0.2s', opacity: mobileOpen ? 0 : 1 }} />
              <span style={{ width: 16, height: 2, borderRadius: 1, background: 'var(--text-secondary)', transition: 'transform 0.2s', transform: mobileOpen ? 'translateY(-5px) rotate(-45deg)' : 'none' }} />
            </span>
          </button>

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
                          style={{ background: isAdmin ? 'rgb(var(--accent-orange))' : session.user.plan==='PRO' ? 'rgb(var(--accent-brand))' : 'var(--text-tertiary)'}} />
                        {isAdmin?'Administrator':session.user.plan==='PRO'?'⭐ Premium':'Free plan'}
                      </p>
                    </div>
                    {[
                      { href:'/dashboard', label:'📊 My dashboard', cls:'gc-brand' },
                      { href:'/dashboard/events', label:'📅 My events', cls:'gc-brand' },
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
      </div>

      {/* Mobile dropdown panel — grouped into Explore / More so it doesn't read as a flat wall of links */}
      {mobileOpen && (
        <div className="sm:hidden mt-3 pt-3 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <p className="text-caption px-2 mb-1" style={{ color: 'var(--text-tertiary)' }}>Explore</p>
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href}
              {...(l.ext ? { target:'_blank' } : {})}
              onClick={() => setMobileOpen(false)}
              className="press text-sm font-semibold px-2 py-2.5 rounded-lg flex items-center gap-2.5"
              style={{ color: 'var(--text-secondary)' }}>
              <span className="text-base leading-none" aria-hidden="true">{l.icon}</span>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin" onClick={() => setMobileOpen(false)}
              className="press text-sm font-bold px-2 py-2.5 rounded-lg flex items-center gap-2.5" style={{ color: 'rgb(var(--accent-orange))' }}>
              ⚙ Admin
            </Link>
          )}
          <div className="mt-2 pt-2 flex flex-col gap-1" style={{ borderTop: '1px solid var(--border-hairline)' }}>
            <p className="text-caption px-2 mb-1" style={{ color: 'var(--text-tertiary)' }}>More</p>
            {INFO_LINKS.map(l => (
              <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="press text-xs font-medium px-2 py-2 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                {l.label}
              </Link>
            ))}
          </div>
          {!session && (
            <Link href="/auth/signin" onClick={() => setMobileOpen(false)}
              className="press text-sm font-semibold px-2 py-2.5 rounded-lg mt-1" style={{ color: 'var(--text-secondary)' }}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
