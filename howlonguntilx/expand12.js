const fs = require('fs');
const path = require('path');
function wf(p, c) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c, 'utf8'); console.log('✓', p); }

// ============================================================
// 1. GLOBALS — complete iOS liquid system
// ============================================================
wf('src/app/globals.css', `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── tokens ─────────────────────────────────────────────── */
:root {
  --spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --ease-soft:   cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-bounce: cubic-bezier(0.68,-0.55,0.27,1.55);

  --glow-brand:         83,74,183;
  --glow-holidays:      83,74,183;
  --glow-sports:        29,158,117;
  --glow-finance:       216,90,48;
  --glow-personal:      212,83,126;
  --glow-tech:          186,117,23;
  --glow-nature:        55,138,221;
  --glow-entertainment: 99,153,34;
  --glow-shopping:      226,75,74;
  --glow-space:         123,94,167;
  --glow-health:        232,93,117;
  --glow-work:          74,144,217;
  --glow-family:        245,166,35;
  --glow-education:     126,211,33;
  --glow-travel:        80,227,194;
}

/* ─── base ───────────────────────────────────────────────── */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; -webkit-tap-highlight-color: transparent; }
::selection { background: rgba(83,74,183,0.18); }
.tabular { font-variant-numeric: tabular-nums; font-feature-settings: "tnum"; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }

/* ─── glass ──────────────────────────────────────────────── */
.glass {
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(24px) saturate(1.8);
  -webkit-backdrop-filter: blur(24px) saturate(1.8);
  border: 1px solid rgba(255,255,255,0.5);
}
.dark .glass {
  background: rgba(10,10,18,0.72);
  border: 1px solid rgba(255,255,255,0.06);
}

/* ─── gradient text ──────────────────────────────────────── */
.gradient-text {
  background: linear-gradient(135deg,#534AB7 0%,#8B7CF8 50%,#C084FC 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ════════════════════════════════════════════════════════════
   WATER FLOAT
   Every .float element bobs on an infinite sine-wave.
   nth-child offsets prevent synchronised movement.
   Hover pauses the idle bob and rises the element.
════════════════════════════════════════════════════════════ */
@keyframes bob {
  0%,100% { transform: translateY(0)    rotate(0deg)     scale(1); }
  25%      { transform: translateY(-4px) rotate( 0.18deg) scale(1.002); }
  50%      { transform: translateY(-7px) rotate(-0.12deg) scale(1.004); }
  75%      { transform: translateY(-3px) rotate( 0.14deg) scale(1.001); }
}
@keyframes rise {
  0%   { transform: translateY(0)    scale(1); }
  50%  { transform: translateY(-12px) scale(1.015); }
  100% { transform: translateY(-10px) scale(1.012); }
}

.float {
  animation: bob 5.5s var(--ease-soft) infinite;
  will-change: transform;
  cursor: default;
}
/* stagger so cards don't all move together */
.float:nth-child(2)  { animation-duration:6.1s;  animation-delay:-1.4s; }
.float:nth-child(3)  { animation-duration:5.8s;  animation-delay:-2.9s; }
.float:nth-child(4)  { animation-duration:6.4s;  animation-delay:-0.7s; }
.float:nth-child(5)  { animation-duration:5.2s;  animation-delay:-3.6s; }
.float:nth-child(6)  { animation-duration:6.7s;  animation-delay:-1.1s; }
.float:nth-child(7)  { animation-duration:5.6s;  animation-delay:-4.2s; }
.float:nth-child(8)  { animation-duration:6.0s;  animation-delay:-0.4s; }
.float:nth-child(odd)  { animation-timing-function: cubic-bezier(0.37,0,0.63,1); }
.float:nth-child(even) { animation-timing-function: cubic-bezier(0.45,0.05,0.55,0.95); }

.float:hover {
  animation: rise 0.55s var(--ease-out) forwards !important;
  z-index: 20;
  cursor: pointer;
}

/* ════════════════════════════════════════════════════════════
   BORDER GLOW
   --glow (RGB triplet) drives border + multi-layer shadow.
════════════════════════════════════════════════════════════ */
.glow {
  --glow: var(--glow-brand);
  position: relative;
  border: 1.5px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  transition:
    border-color .3s var(--ease-out),
    box-shadow   .35s var(--ease-out),
    transform    .55s var(--ease-out);
  will-change: transform, box-shadow;
}
.dark .glow { border-color: rgba(255,255,255,0.07); }

.glow:hover {
  border-color: rgba(var(--glow), 0.9) !important;
  box-shadow:
    0 0 0  1.5px rgba(var(--glow), 0.45),
    0 0  18px 3px rgba(var(--glow), 0.35),
    0 0  48px 6px rgba(var(--glow), 0.2),
    0 0 100px 12px rgba(var(--glow), 0.1),
    0 12px 32px     rgba(0,0,0,0.15) !important;
}

/* category colour shortcuts */
.gc-brand         { --glow: var(--glow-brand); }
.gc-holidays      { --glow: var(--glow-holidays); }
.gc-sports        { --glow: var(--glow-sports); }
.gc-finance       { --glow: var(--glow-finance); }
.gc-personal      { --glow: var(--glow-personal); }
.gc-tech          { --glow: var(--glow-tech); }
.gc-nature        { --glow: var(--glow-nature); }
.gc-entertainment { --glow: var(--glow-entertainment); }
.gc-shopping      { --glow: var(--glow-shopping); }
.gc-space         { --glow: var(--glow-space); }
.gc-health        { --glow: var(--glow-health); }
.gc-work          { --glow: var(--glow-work); }
.gc-family        { --glow: var(--glow-family); }
.gc-education     { --glow: var(--glow-education); }
.gc-travel        { --glow: var(--glow-travel); }

/* ─── spring press ───────────────────────────────────────── */
.press {
  transition: transform .14s var(--spring), box-shadow .18s var(--ease-out);
  will-change: transform;
}
.press:active { transform: scale(0.94) !important; animation: none !important; }

/* ─── nav link glow ──────────────────────────────────────── */
.nav-link {
  border-radius: 12px;
  padding: 7px 14px;
  transition: color .2s, background .2s, box-shadow .28s var(--ease-out), transform .28s var(--spring);
}
.nav-link:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0 18px rgba(var(--glow,var(--glow-brand)),0.4),
              0 0 48px rgba(var(--glow,var(--glow-brand)),0.18);
}

/* ─── sidebar nav item ───────────────────────────────────── */
.sidebar-item {
  border-radius: 14px;
  transition: background .2s, color .2s, box-shadow .3s var(--ease-out),
              transform .35s var(--spring), padding-left .25s var(--ease-out);
  cursor: pointer;
}
.sidebar-item:hover {
  transform: translateX(6px) scale(1.02);
  box-shadow: 0 0 16px rgba(var(--glow,var(--glow-brand)),0.3),
              0 0 40px rgba(var(--glow,var(--glow-brand)),0.14);
}
.sidebar-item.active {
  background: rgba(var(--glow,var(--glow-brand)),0.1) !important;
  color: rgb(var(--glow,var(--glow-brand))) !important;
  box-shadow: inset 0 0 0 1.5px rgba(var(--glow,var(--glow-brand)),0.35),
              0 0 20px rgba(var(--glow,var(--glow-brand)),0.25);
}

/* ─── input glow ─────────────────────────────────────────── */
.input-glow {
  transition: border-color .25s, box-shadow .3s var(--ease-out), transform .2s var(--spring);
}
.input-glow:focus {
  outline: none;
  border-color: rgba(var(--glow-brand),0.8) !important;
  transform: scale(1.01);
  box-shadow:
    0 0 0  1.5px rgba(var(--glow-brand),0.45),
    0 0 18px    rgba(var(--glow-brand),0.28),
    0 0 48px    rgba(var(--glow-brand),0.12);
}

/* ─── metric card ────────────────────────────────────────── */
.metric-card {
  transition: transform .45s var(--spring), box-shadow .35s var(--ease-out),
              border-color .3s var(--ease-out);
}
.metric-card:hover {
  transform: translateY(-6px) scale(1.03);
  box-shadow:
    0 0 0 1.5px rgba(var(--glow,var(--glow-brand)),0.5),
    0 0 24px rgba(var(--glow,var(--glow-brand)),0.3),
    0 0 60px rgba(var(--glow,var(--glow-brand)),0.15),
    0 16px 40px rgba(0,0,0,0.14);
  border-color: rgba(var(--glow,var(--glow-brand)),0.6) !important;
}

/* ─── chart card ─────────────────────────────────────────── */
.chart-card {
  transition: transform .45s var(--spring), box-shadow .35s var(--ease-out);
}
.chart-card:hover {
  transform: translateY(-4px) scale(1.005);
  box-shadow:
    0 0 0 1.5px rgba(var(--glow-brand),0.3),
    0 0 32px rgba(var(--glow-brand),0.18),
    0 12px 40px rgba(0,0,0,0.12);
}

/* ─── pulse dot ──────────────────────────────────────────── */
@keyframes pulseRing {
  0%   { box-shadow: 0 0 0 0 rgba(var(--glow,var(--glow-brand)),0.6); }
  70%  { box-shadow: 0 0 0 7px rgba(var(--glow,var(--glow-brand)),0); }
  100% { box-shadow: 0 0 0 0 rgba(var(--glow,var(--glow-brand)),0); }
}
.pulse-dot { animation: pulseRing 2.2s ease-out infinite; }

/* ─── entry animations ───────────────────────────────────── */
@keyframes fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn  { from{opacity:0} to{opacity:1} }
@keyframes scaleIn { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
@keyframes slideR  { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:translateX(0)} }
@keyframes slideU  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes ticker  { 0%{transform:translateY(0);opacity:1} 40%{transform:translateY(-5px);opacity:0} 60%{transform:translateY(5px);opacity:0} 100%{transform:translateY(0);opacity:1} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes float-hero { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.01)} }
@keyframes orbit { from{transform:rotate(0deg) translateX(40px) rotate(0deg)} to{transform:rotate(360deg) translateX(40px) rotate(-360deg)} }

.anim-fade-up  { animation: fadeUp  0.55s var(--ease-out) both; }
.anim-fade-in  { animation: fadeIn  0.4s  var(--ease-out) both; }
.anim-scale-in { animation: scaleIn 0.38s var(--spring)   both; }
.anim-slide-r  { animation: slideR  0.4s  var(--ease-out) both; }
.anim-slide-u  { animation: slideU  0.35s var(--ease-out) both; }
.tick          { animation: ticker  0.28s var(--ease-out); }

/* stagger */
.sg>*:nth-child(1){animation-delay:0ms}
.sg>*:nth-child(2){animation-delay:65ms}
.sg>*:nth-child(3){animation-delay:130ms}
.sg>*:nth-child(4){animation-delay:195ms}
.sg>*:nth-child(5){animation-delay:260ms}
.sg>*:nth-child(6){animation-delay:325ms}
.sg>*:nth-child(7){animation-delay:390ms}
.sg>*:nth-child(8){animation-delay:455ms}

/* shimmer */
.shimmer {
  background: linear-gradient(90deg,#f2f2f7 25%,#e5e5ea 50%,#f2f2f7 75%);
  background-size:200% 100%;
  animation: shimmer 1.4s infinite;
}
.dark .shimmer {
  background: linear-gradient(90deg,#1c1c2e 25%,#2c2c3e 50%,#1c1c2e 75%);
  background-size:200% 100%;
}

/* hero blob */
.hero-blob {
  position:absolute; border-radius:50%; filter:blur(80px);
  animation: float-hero 7s ease-in-out infinite;
  pointer-events:none;
}

/* progress gradient */
.prog-grad {
  background: linear-gradient(90deg, rgb(var(--glow,var(--glow-brand))), rgba(var(--glow,var(--glow-brand)),0.6));
}
`);

// ============================================================
// 2. PREMIUM SIDEBAR — liquid sidebar items
// ============================================================
wf('src/components/premium/PremiumSidebar.tsx', `'use client';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

const FREE = [
  { id:'overview',   label:'Overview',    dot:'83,74,183',  icon:'📊' },
  { id:'timeline',   label:'Timeline',    dot:'29,158,117', icon:'📅' },
  { id:'categories', label:'Categories',  dot:'216,90,48',  icon:'🏷️' },
];
const PRO = [
  { id:'crypto', label:'Crypto targets',  dot:'186,117,23',  icon:'₿' },
  { id:'life',   label:'Life expectancy', dot:'212,83,126',  icon:'❤️' },
  { id:'world',  label:'World events',    dot:'55,138,221',  icon:'🌍' },
];

interface Props { tab:string; setTab:(t:string)=>void; session:any; isPremium:boolean; isAdmin:boolean }

export function PremiumSidebar({ tab, setTab, session, isPremium, isAdmin }:Props) {
  return (
    <aside className="w-52 flex-shrink-0 border-r border-gray-200/60 dark:border-gray-800/60 glass flex flex-col"
      style={{ backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)' }}>

      {/* user badge */}
      <div className="p-4 border-b border-gray-100/60 dark:border-gray-800/60 flex items-center gap-3">
        <div className="float glow gc-brand press w-10 h-10 rounded-2xl bg-brand-500 text-white text-sm font-bold flex items-center justify-center shadow-lg flex-shrink-0"
          style={{ boxShadow:'0 4px 16px rgba(83,74,183,0.4)' }}>
          {(session.user.name?.[0] ?? session.user.email?.[0] ?? '?').toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
            {session.user.name?.split(' ')[0] ?? 'Account'}
          </p>
          <p className="text-[10px] text-gray-400 truncate">
            {isAdmin ? '⚙ Administrator' : isPremium ? '⭐ Premium' : '🔓 Free plan'}
          </p>
        </div>
      </div>

      {/* nav */}
      <nav className="p-2 flex-1 overflow-y-auto">
        <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-bold px-3 py-2 mt-1">My dashboard</p>
        {FREE.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={'sidebar-item w-full flex items-center gap-2.5 px-3 py-2.5 text-sm mb-0.5 font-medium ' + (active ? 'active' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60')}
              style={{ '--glow': t.dot } as React.CSSProperties}>
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background:'rgb('+t.dot+')' }} />}
            </button>
          );
        })}

        <p className="text-[9px] uppercase tracking-[0.18em] text-gray-400 font-bold px-3 py-2 mt-3">Premium analytics</p>
        {PRO.map(t => {
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={'sidebar-item w-full flex items-center gap-2.5 px-3 py-2.5 text-sm mb-0.5 font-medium ' + (active ? 'active' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/60 dark:hover:bg-gray-800/60')}
              style={{ '--glow': t.dot } as React.CSSProperties}>
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
              {!isPremium && <span className="ml-auto text-[8px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">PRO</span>}
              {active && isPremium && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background:'rgb('+t.dot+')' }} />}
            </button>
          );
        })}

        {isAdmin && (
          <>
            <p className="text-[9px] uppercase tracking-[0.18em] text-amber-500 font-bold px-3 py-2 mt-3">Admin</p>
            <Link href="/admin"
              className="sidebar-item flex items-center gap-2.5 px-3 py-2.5 text-sm text-amber-600 dark:text-amber-400 font-semibold"
              style={{ '--glow':'245,166,35' } as React.CSSProperties}>
              <span>⚙️</span><span>Admin panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* upgrade CTA */}
      {!isPremium && (
        <div className="p-3 border-t border-gray-100/60 dark:border-gray-800/60">
          <div className="float glow gc-brand press rounded-2xl p-4 text-center cursor-pointer"
            style={{ background:'linear-gradient(135deg,#534AB7,#8B7CF8)', '--glow':'83,74,183', boxShadow:'0 4px 20px rgba(83,74,183,0.4)' } as React.CSSProperties}>
            <p className="text-xs font-bold text-white mb-0.5">⭐ Go Premium</p>
            <p className="text-[10px] text-white/70 mb-2">Unlock all predictions</p>
            <div className="bg-white/20 hover:bg-white/30 transition-colors text-white text-xs font-bold py-1.5 rounded-xl">
              Upgrade — $4/mo
            </div>
          </div>
        </div>
      )}

      {/* bottom links */}
      <div className="p-2 border-t border-gray-100/60 dark:border-gray-800/60">
        {[
          { href:'/', label:'← Back to site' },
          { href:'/dashboard/settings', label:'⚙ Settings' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="sidebar-item flex items-center text-xs text-gray-400 hover:text-brand-500 px-3 py-2 font-medium"
            style={{ '--glow':'83,74,183' } as React.CSSProperties}>{l.label}</Link>
        ))}
        <button onClick={() => signOut({ callbackUrl:'/' })}
          className="sidebar-item w-full text-left text-xs text-red-400 hover:text-red-600 px-3 py-2 font-medium"
          style={{ '--glow':'226,75,74' } as React.CSSProperties}>← Sign out</button>
      </div>
    </aside>
  );
}
`);

// ============================================================
// 3. HOME PAGE — liquid hero with floating blobs
// ============================================================
wf('src/app/page.tsx', `import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { CategoryStrip } from '@/components/ui/CategoryStrip';
import { WhyUs } from '@/components/ui/WhyUs';
import { RecentlyViewed } from '@/components/countdown/RecentlyViewed';
import { getPopularEvents } from '@/lib/events';

export default async function HomePage() {
  const events = await getPopularEvents(8);
  return (
    <div>
      {/* ── hero ──────────────────────────────────── */}
      <div className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* animated blobs */}
        <div className="hero-blob w-[600px] h-[600px] opacity-[0.08] dark:opacity-[0.12] -top-40 -left-40"
          style={{ background:'radial-gradient(circle,#534AB7,#8B7CF8)', animationDelay:'-2s' }} />
        <div className="hero-blob w-[400px] h-[400px] opacity-[0.06] dark:opacity-[0.1] top-20 -right-20"
          style={{ background:'radial-gradient(circle,#C084FC,#534AB7)', animationDelay:'-4s', animationDuration:'9s' }} />
        <div className="hero-blob w-[300px] h-[300px] opacity-[0.05] bottom-0 left-1/2"
          style={{ background:'radial-gradient(circle,#1D9E75,#378ADD)', animationDelay:'-6s', animationDuration:'11s' }} />

        <div className="relative z-10 max-w-2xl mx-auto px-4 py-20 text-center w-full">
          <div className="anim-fade-up sg">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-500 mb-5">
                Live · Real-time · To the second
              </p>
              <h1 className="text-5xl sm:text-6xl font-black mb-5 leading-[1.05] tracking-tight">
                How long<br/>
                <span className="gradient-text">until…?</span>
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed max-w-md mx-auto">
                Not an AI guess — a live clock ticking to your exact moment.
              </p>
            </div>
            <div><SearchBar /></div>
            <p className="text-xs text-gray-400 mt-4">
              Try: "Christmas" · "FIFA World Cup" · "Solar Eclipse" · "Salary Day"
            </p>
          </div>
        </div>
      </div>

      <CategoryStrip />

      <div className="max-w-3xl mx-auto px-4 py-10">
        <PopularGrid events={events} />
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-8">
        <RecentlyViewed />
      </div>
      <WhyUs />
    </div>
  );
}
`);

// ============================================================
// 4. NAV — full liquid glass nav
// ============================================================
wf('src/components/ui/Nav.tsx', `'use client';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from './ThemeToggle';
import { useState } from 'react';

const NAV_LINKS = [
  { label:'Categories', href:'/categories',                    glow:'83,74,183'  },
  { label:'Embed',      href:'/embed',                         glow:'29,158,117' },
  { label:'API',        href:'/api/countdown?event=christmas', glow:'216,90,48', ext:true },
];

export function Nav() {
  const { data:session, status } = useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = session?.user?.role === 'ADMIN';

  return (
    <nav className="sticky top-0 z-40 glass border-b border-white/30 dark:border-white/[0.06] px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* logo */}
      <div className="flex items-center gap-4">
        <Link href="/" className="font-black text-lg tracking-tight text-gray-900 dark:text-white press float"
          style={{ animationDuration:'6s' }}>
          How<span className="gradient-text">Long</span>Until
        </Link>
        <div className="hidden sm:flex items-center gap-0.5">
          {NAV_LINKS.map(l => (
            <Link key={l.label} href={l.href}
              {...(l.ext ? { target:'_blank' } : {})}
              className="nav-link glow gc-brand text-sm text-gray-500 dark:text-gray-400 hover:text-brand-500 font-semibold press"
              style={{ '--glow':l.glow } as React.CSSProperties}>
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link href="/admin"
              className="nav-link glow gc-family text-sm font-bold text-amber-600 dark:text-amber-400 press"
              style={{ '--glow':'245,166,35' } as React.CSSProperties}>
              ⚙ Admin
            </Link>
          )}
        </div>
      </div>

      {/* right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {status==='loading' ? (
          <div className="w-24 h-8 rounded-full shimmer" />
        ) : session ? (
          <div className="relative">
            <button onClick={()=>setOpen(!open)}
              className="float glow gc-brand press flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ '--glow':'83,74,183', animationDuration:'7s' } as React.CSSProperties}>
              {session.user.image
                ? <img src={session.user.image} className="w-6 h-6 rounded-full" alt="" />
                : <span className="w-6 h-6 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center font-bold">
                    {(session.user.name?.[0]??session.user.email?.[0]??'?').toUpperCase()}
                  </span>}
              <span className="hidden sm:block max-w-[80px] truncate text-sm font-semibold text-gray-700 dark:text-gray-300">
                {session.user.name?.split(' ')[0]??session.user.email?.split('@')[0]}
              </span>
              {isAdmin && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 px-1.5 rounded-full font-bold">ADMIN</span>}
              <span className="text-gray-400 text-xs">▾</span>
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={()=>setOpen(false)} />
                <div className="anim-scale-in absolute right-0 mt-2 w-56 glass rounded-2xl shadow-2xl overflow-hidden z-50"
                  style={{ boxShadow:'0 8px 40px rgba(83,74,183,0.22),0 4px 16px rgba(0,0,0,0.12)' }}>
                  <div className="px-4 py-3 border-b border-white/20 dark:border-gray-800/60">
                    <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{session.user.email}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full inline-block"
                        style={{ background: isAdmin?'#BA7517':session.user.plan==='PRO'?'#534AB7':'#9ca3af' }} />
                      {isAdmin?'Administrator':session.user.plan==='PRO'?'⭐ Premium':'Free plan'}
                    </p>
                  </div>
                  {[
                    { href:'/dashboard', label:'📊 My dashboard', glow:'83,74,183' },
                    ...(isAdmin?[{ href:'/admin', label:'⚙️ Admin panel', glow:'245,166,35' }]:[]),
                    { href:'/dashboard/settings', label:'⚙ Settings', glow:'83,74,183' },
                  ].map(item=>(
                    <Link key={item.href} href={item.href} onClick={()=>setOpen(false)}
                      className="sidebar-item flex items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-gray-800/60 font-medium"
                      style={{ '--glow':item.glow } as React.CSSProperties}>
                      {item.label}
                    </Link>
                  ))}
                  <button onClick={()=>{setOpen(false);signOut({callbackUrl:'/'});}}
                    className="sidebar-item w-full flex items-center px-4 py-2.5 text-sm text-red-500 hover:bg-red-50/80 dark:hover:bg-red-900/20 border-t border-white/20 dark:border-gray-800/60 font-medium"
                    style={{ '--glow':'226,75,74' } as React.CSSProperties}>
                    ← Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/auth/signin"
              className="nav-link glow gc-brand press text-sm font-semibold text-gray-600 dark:text-gray-300 hidden sm:block">
              Sign in
            </Link>
            <Link href="/auth/signup"
              className="float glow gc-brand press bg-brand-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-brand-600 transition-colors"
              style={{ '--glow':'83,74,183', boxShadow:'0 4px 20px rgba(83,74,183,0.4)', animationDuration:'6s' } as React.CSSProperties}>
              Sign up free
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
`);

// ============================================================
// 5. OVERVIEW PANEL — 4-col liquid metric cards + charts
// ============================================================
wf('src/components/premium/panels/OverviewPanel.tsx', `'use client';
import { TimerCard } from '@/components/countdown/TimerCard';
import { buildCountdownResponse } from '@/lib/countdown';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface Timer { id:string; name:string; targetDate:Date|string; category:string }
const CAT_COLORS: Record<string,{ hex:string; rgb:string }> = {
  holidays:{hex:'#534AB7',rgb:'83,74,183'}, sports:{hex:'#1D9E75',rgb:'29,158,117'},
  finance:{hex:'#D85A30',rgb:'216,90,48'}, personal:{hex:'#D4537E',rgb:'212,83,126'},
  tech:{hex:'#BA7517',rgb:'186,117,23'}, nature:{hex:'#378ADD',rgb:'55,138,221'},
  entertainment:{hex:'#639922',rgb:'99,153,34'}, shopping:{hex:'#E24B4A',rgb:'226,75,74'},
  space:{hex:'#7B5EA7',rgb:'123,94,167'}, health:{hex:'#E85D75',rgb:'232,93,117'},
  work:{hex:'#4A90D9',rgb:'74,144,217'}, family:{hex:'#F5A623',rgb:'245,166,35'},
  education:{hex:'#7ED321',rgb:'126,211,33'}, travel:{hex:'#50E3C2',rgb:'80,227,194'},
};
const fb = {hex:'#534AB7',rgb:'83,74,183'};

export function OverviewPanel({ timers, popular, onAdd, onDelete, session }: any) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const donutRef = useRef<HTMLCanvasElement>(null);
  const name = session.user.name?.split(' ')[0] ?? 'there';
  const isAdmin = session.user.role === 'ADMIN';

  const urgent = timers.filter((t:Timer) => {
    const { days_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
    return days_left <= 7 && days_left >= 0;
  });
  const avgProgress = timers.length ? Math.round(timers.reduce((s:number,t:Timer) =>
    s + buildCountdownResponse(t.name, new Date(t.targetDate)).progress_percent, 0) / timers.length) : 0;
  const nearest = [...timers]
    .map((t:Timer) => ({...t, days:buildCountdownResponse(t.name,new Date(t.targetDate)).days_left}))
    .filter((t:any) => t.days >= 0).sort((a:any,b:any) => a.days-b.days)[0];

  useEffect(() => {
    if (!chartRef.current || !timers.length) return;
    import('chart.js').then(({Chart,registerables}) => {
      Chart.register(...registerables);
      const ex = Chart.getChart(chartRef.current!); if(ex) ex.destroy();
      new Chart(chartRef.current!, {
        type:'bar',
        data:{ labels:timers.slice(0,8).map((t:Timer)=>t.name.slice(0,10)),
          datasets:[{data:timers.slice(0,8).map((t:Timer)=>buildCountdownResponse(t.name,new Date(t.targetDate)).days_left),
            backgroundColor:timers.slice(0,8).map((t:Timer)=>(CAT_COLORS[t.category]??fb).hex),
            borderRadius:8,borderSkipped:false}]},
        options:{ responsive:true,maintainAspectRatio:false,
          animation:{duration:900,easing:'easeOutQuart'},
          plugins:{legend:{display:false}},
          scales:{x:{ticks:{font:{size:10},color:'#888'},grid:{display:false}},
            y:{ticks:{font:{size:10},color:'#888'},grid:{color:'rgba(0,0,0,0.04)'}}}}
      });
    });
  }, [timers]);

  const catEntries = Object.entries(timers.reduce((acc:any,t:Timer)=>{ acc[t.category]=(acc[t.category]??0)+1; return acc; },{}));
  useEffect(() => {
    if (!donutRef.current || !catEntries.length) return;
    import('chart.js').then(({Chart,registerables}) => {
      Chart.register(...registerables);
      const ex = Chart.getChart(donutRef.current!); if(ex) ex.destroy();
      new Chart(donutRef.current!, {
        type:'doughnut',
        data:{ labels:catEntries.map(([k])=>k),
          datasets:[{data:catEntries.map(([,v])=>v),
            backgroundColor:catEntries.map(([k])=>(CAT_COLORS[k as string]??fb).hex),
            borderWidth:2,borderColor:'transparent',hoverOffset:8}]},
        options:{ responsive:true,maintainAspectRatio:false,cutout:'68%',
          animation:{duration:900},plugins:{legend:{display:false}}}
      });
    });
  }, [timers]);

  const METRICS = [
    { label:'Tracking',    value:String(timers.length),  sub:'countdowns',       rgb:'83,74,183'  },
    { label:'Nearest',     value:nearest?nearest.days+'d':'—', sub:nearest?.name?.slice(0,12)??'none', rgb:'216,90,48'  },
    { label:'Avg progress',value:avgProgress+'%',         sub:'to events',        rgb:'29,158,117' },
    { label:'Urgent',      value:String(urgent.length),   sub:'within 7 days',    rgb:urgent.length>0?'239,68,68':'136,136,136' },
  ];

  return (
    <div className="anim-fade-in">
      {isAdmin && (
        <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-2xl px-4 py-2.5">
          ⚙ Admin mode — all features unlocked
          <Link href="/admin" className="ml-auto underline">Admin panel →</Link>
        </div>
      )}

      {/* header */}
      <div className="flex items-center justify-between mb-6 anim-fade-up">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Hey, {name} <span className="inline-block animate-bounce">👋</span></h1>
          <p className="text-sm text-gray-500 mt-0.5">{timers.length===0?'Add your first countdown':'Tracking '+timers.length+' countdown'+(timers.length>1?'s':'')}</p>
        </div>
        <button onClick={onAdd}
          className="float glow gc-brand press bg-brand-500 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-brand-600 transition-colors"
          style={{ '--glow':'83,74,183', boxShadow:'0 4px 20px rgba(83,74,183,0.4)', animationDuration:'5s' } as React.CSSProperties}>
          + Add countdown
        </button>
      </div>

      {/* 4-col metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 sg">
        {METRICS.map(m => (
          <div key={m.label}
            className="float glow metric-card press anim-fade-up bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800"
            style={{ '--glow':m.rgb } as React.CSSProperties}>
            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">{m.label}</p>
            <p className="text-2xl font-black tabular" style={{ color:'rgb('+m.rgb+')' }}>{m.value}</p>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* streak + milestone */}
      <div className="grid grid-cols-2 gap-3 mb-5 sg">
        <StreakCard count={timers.length} />
        <MilestoneCard timers={timers} />
      </div>

      {/* urgent */}
      {urgent.length > 0 && (
        <div className="float glow press mb-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/60 dark:border-amber-700/40 rounded-2xl anim-scale-in"
          style={{ '--glow':'245,166,35', animationDuration:'7s' } as React.CSSProperties}>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1.5 flex items-center gap-2">
            <span className="animate-bounce inline-block">⚡</span> Coming up soon
          </p>
          {urgent.map((t:Timer) => {
            const { days_left, hours_left } = buildCountdownResponse(t.name, new Date(t.targetDate));
            return <p key={t.id} className="text-sm text-amber-600 dark:text-amber-300"><strong>{t.name}</strong> — {days_left===0?hours_left+'h left!':days_left+'d away'}</p>;
          })}
        </div>
      )}

      {/* charts */}
      {timers.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5 sg">
          <div className="col-span-2 float glow chart-card press anim-fade-up bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
            style={{ '--glow':'83,74,183' } as React.CSSProperties}>
            <p className="text-sm font-bold mb-3 text-gray-800 dark:text-gray-200">Days remaining</p>
            <div style={{ height:150 }}><canvas ref={chartRef} /></div>
          </div>
          <div className="float glow chart-card press anim-fade-up bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
            style={{ '--glow':'83,74,183' } as React.CSSProperties}>
            <p className="text-sm font-bold mb-3 text-gray-800 dark:text-gray-200">By category</p>
            <div style={{ height:100 }}><canvas ref={donutRef} /></div>
            <div className="flex flex-wrap gap-1 mt-2">
              {catEntries.map(([k]) => { const col = CAT_COLORS[k as string]??fb; return (
                <span key={k as string} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold capitalize"
                  style={{ background:'rgba('+col.rgb+',0.15)', color:col.hex }}>{k}</span>
              );})}
            </div>
          </div>
        </div>
      )}

      {/* progress bars */}
      {timers.length > 0 && (
        <div className="float glow chart-card press anim-fade-up bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 mb-5"
          style={{ '--glow':'83,74,183' } as React.CSSProperties}>
          <p className="text-sm font-bold mb-4 text-gray-800 dark:text-gray-200">Progress to each event</p>
          {timers.slice(0,8).map((t:Timer) => {
            const { progress_percent } = buildCountdownResponse(t.name, new Date(t.targetDate));
            const col = CAT_COLORS[t.category]??fb;
            return (
              <div key={t.id} className="flex items-center gap-3 mb-2.5 group">
                <span className="text-xs text-gray-500 w-24 text-right flex-shrink-0 truncate">{t.name.slice(0,14)}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background:'rgba('+col.rgb+',0.12)' }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width:progress_percent+'%', background:'linear-gradient(90deg,'+col.hex+','+col.hex+'99)' }} />
                </div>
                <span className="text-xs font-bold w-8 flex-shrink-0" style={{ color:col.hex }}>{progress_percent}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* timer cards — 4 per row compact */}
      {timers.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Live countdowns</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sg">
            {timers.map((t:Timer) => <TimerCard key={t.id} timer={t} onDelete={onDelete} />)}
          </div>
        </div>
      )}

      {/* empty */}
      {timers.length === 0 && (
        <div className="float glow gc-brand press anim-scale-in text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl"
          style={{ '--glow':'83,74,183' } as React.CSSProperties}>
          <div className="text-5xl mb-4 animate-bounce">⏳</div>
          <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">No countdowns yet</p>
          <p className="text-sm text-gray-400 mb-5">Add a deadline, birthday, or any event</p>
          <button onClick={onAdd}
            className="float glow gc-brand press bg-brand-500 text-white px-6 py-3 rounded-2xl text-sm font-bold"
            style={{ '--glow':'83,74,183', boxShadow:'0 4px 20px rgba(83,74,183,0.4)', animationDuration:'5s' } as React.CSSProperties}>
            + Add my first countdown
          </button>
        </div>
      )}

      {/* popular */}
      <div className="anim-fade-up mt-4">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">Popular — add in one click</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sg">
          {popular.map((ev:any) => {
            const { days_left } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
            const col = CAT_COLORS[ev.category]??fb;
            return (
              <a key={ev.slug} href={'/how-long-until-'+ev.slug}
                className="float glow press anim-fade-up flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl group text-sm"
                style={{ '--glow':col.rgb } as React.CSSProperties}>
                <span className="font-semibold text-gray-700 dark:text-gray-300 group-hover:text-current transition-colors truncate text-xs">{ev.name}</span>
                <span className="font-black text-sm ml-2 flex-shrink-0 tabular" style={{ color:col.hex }}>{days_left}d</span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StreakCard({ count }: { count:number }) {
  const levels = ['Start','Beginner','Tracker','Planner','Master'];
  const thr = [0,3,10,25,50];
  const idx = thr.filter(t=>count>=t).length-1;
  const level = levels[Math.min(idx,levels.length-1)];
  const next = thr[Math.min(idx+1,thr.length-1)];
  const prog = Math.min(100,Math.round((count/next)*100));
  return (
    <div className="float glow gc-brand press anim-fade-up metric-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4"
      style={{ '--glow':'83,74,183' } as React.CSSProperties}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Your level</p>
          <p className="text-base font-black text-gray-900 dark:text-white mt-0.5">⭐ {level}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-brand-500 tabular">{count}</p>
          <p className="text-[9px] text-gray-400">countdowns</p>
        </div>
      </div>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width:prog+'%', background:'linear-gradient(90deg,#534AB7,#8B7CF8,#C084FC)' }} />
      </div>
      <p className="text-[9px] text-gray-400 mt-1">{count}/{next} to {levels[Math.min(idx+1,levels.length-1)]}</p>
    </div>
  );
}

function MilestoneCard({ timers }: { timers:any[] }) {
  const nearest = timers.map(t=>({name:t.name,ms:new Date(t.targetDate).getTime()-Date.now()})).filter(t=>t.ms>0).sort((a,b)=>a.ms-b.ms)[0];
  const days = nearest ? Math.floor(nearest.ms/86400000) : null;
  const rgb = days===null?'136,136,136':days===0?'239,68,68':days<=3?'249,115,22':days<=7?'251,191,36':'29,158,117';
  return (
    <div className="float glow press anim-fade-up metric-card bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4"
      style={{ '--glow':rgb } as React.CSSProperties}>
      <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-1">Next milestone</p>
      {nearest ? (
        <>
          <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-200">{nearest.name}</p>
          <p className="text-2xl font-black tabular mt-0.5" style={{ color:'rgb('+rgb+')' }}>{days} <span className="text-sm font-normal text-gray-400">days</span></p>
          <p className="text-[10px] mt-0.5" style={{ color:'rgb('+rgb+')' }}>
            {days===0?'🔥 Today!':days!<=3?'⚡ Very soon':days!<=7?'📅 This week':'🗓️ Upcoming'}
          </p>
        </>
      ) : <p className="text-sm text-gray-400 mt-2">Add a countdown!</p>}
    </div>
  );
}
`);

// ============================================================
// 6. CATEGORY STRIP — all pills float + glow
// ============================================================
wf('src/components/ui/CategoryStrip.tsx', `import Link from 'next/link';

const CATS = [
  {slug:'holidays',    label:'Holidays',     emoji:'🎄', rgb:'83,74,183'  },
  {slug:'sports',      label:'Sports',       emoji:'⚽', rgb:'29,158,117' },
  {slug:'finance',     label:'Finance',      emoji:'💰', rgb:'216,90,48'  },
  {slug:'tech',        label:'Tech',         emoji:'💻', rgb:'186,117,23' },
  {slug:'nature',      label:'Nature',       emoji:'🌍', rgb:'55,138,221' },
  {slug:'shopping',    label:'Shopping',     emoji:'🛍️', rgb:'226,75,74'  },
  {slug:'entertainment',label:'Entertainment',emoji:'🎬',rgb:'99,153,34'  },
  {slug:'space',       label:'Space',        emoji:'🚀', rgb:'123,94,167' },
];

export function CategoryStrip() {
  return (
    <div className="border-y border-gray-100/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 py-3">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sg">
          {CATS.map(c => (
            <Link key={c.slug} href={'/categories/'+c.slug}
              className={'float glow press flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-900 text-sm font-semibold whitespace-nowrap text-gray-600 dark:text-gray-400 transition-all anim-fade-up'}
              style={{ '--glow':c.rgb } as React.CSSProperties}>
              <span>{c.emoji}</span><span>{c.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// ============================================================
// 7. WHY US — float + glow feature cards
// ============================================================
wf('src/components/ui/WhyUs.tsx', `const POINTS = [
  {icon:'⚡',title:'Real-time to the second',desc:'AI gives "about X days". We show a live clock ticking to the exact second.',rgb:'83,74,183'},
  {icon:'📊',title:'Progress visualisation',desc:'See exactly how far through the cycle you are. AI cannot show a live progress bar.',rgb:'29,158,117'},
  {icon:'🔗',title:'Shareable & embeddable',desc:'Share a live link or embed on any site. AI answers vanish when you close the tab.',rgb:'216,90,48'},
  {icon:'🌍',title:'Location-aware events',desc:'Salary days, local holidays, budgets — we know Uganda vs UK vs US dates.',rgb:'55,138,221'},
  {icon:'🔔',title:'Save & get notified',desc:'Sign in to save countdowns and get reminders. AI has no memory of yesterday.',rgb:'212,83,126'},
  {icon:'📱',title:'Works offline',desc:'Once loaded the clock keeps ticking. AI needs a live connection every time.',rgb:'186,117,23'},
];

export function WhyUs() {
  return (
    <div className="border-t border-gray-100 dark:border-gray-800 mt-8 py-16 bg-gray-50/60 dark:bg-gray-900/30">
      <div className="max-w-3xl mx-auto px-4">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-500 font-bold mb-2 anim-fade-up">Why not just ask AI?</p>
        <h2 className="text-2xl font-black mb-8 text-gray-900 dark:text-white anim-fade-up">6 things we do that AI cannot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sg">
          {POINTS.map((p,i) => (
            <div key={p.title}
              className="float glow press anim-fade-up bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800"
              style={{ '--glow':p.rgb, animationDelay:(i*80)+'ms' } as React.CSSProperties}>
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-black text-sm mb-1.5 text-gray-900 dark:text-white">{p.title}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// ============================================================
// 8. POPULAR GRID — float + glow cards
// ============================================================
wf('src/components/countdown/PopularGrid.tsx', `import Link from 'next/link';
import { buildCountdownResponse } from '@/lib/countdown';

interface Event { slug:string; name:string; targetDate:Date|string; category:string }
const CAT: Record<string,{hex:string;rgb:string}> = {
  holidays:{hex:'#534AB7',rgb:'83,74,183'}, sports:{hex:'#1D9E75',rgb:'29,158,117'},
  finance:{hex:'#D85A30',rgb:'216,90,48'}, personal:{hex:'#D4537E',rgb:'212,83,126'},
  tech:{hex:'#BA7517',rgb:'186,117,23'}, nature:{hex:'#378ADD',rgb:'55,138,221'},
  entertainment:{hex:'#639922',rgb:'99,153,34'}, shopping:{hex:'#E24B4A',rgb:'226,75,74'},
  space:{hex:'#7B5EA7',rgb:'123,94,167'},
};
const fb={hex:'#534AB7',rgb:'83,74,183'};

export function PopularGrid({ events }: { events: Event[] }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4">Popular countdowns</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sg">
        {events.map((ev,i) => {
          const { days_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
          const col = CAT[ev.category]??fb;
          return (
            <Link key={ev.slug} href={'/how-long-until-'+ev.slug}
              className="float glow press anim-fade-up block relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-4 group border border-gray-100 dark:border-gray-800"
              style={{ '--glow':col.rgb, animationDelay:(i*55)+'ms' } as React.CSSProperties}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background:col.hex }} />
              <div className="text-[9px] uppercase tracking-wider text-gray-400 mb-1 font-bold">{ev.category}</div>
              <div className="text-sm font-black mb-1.5 text-gray-800 dark:text-gray-200 line-clamp-1 leading-tight">{ev.name}</div>
              <div className="text-2xl font-black tabular leading-none mb-0.5" style={{ color:col.hex }}>{days_left}</div>
              <div className="text-[10px] text-gray-400 mb-2">days left</div>
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background:'rgba('+col.rgb+',0.15)' }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{ width:progress_percent+'%', background:col.hex }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
`);

// ============================================================
// 9. SEARCH BAR — focus glow
// ============================================================
wf('src/components/countdown/SearchBar.tsx', `'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion { slug:string; name:string; category:string }

export function SearchBar() {
  const [value, setValue]     = useState('');
  const [sugs, setSugs]       = useState<Suggestion[]>([]);
  const [open, setOpen]       = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) { setSugs([]); return; }
    const t = setTimeout(async () => {
      const res  = await fetch('/api/search?q='+encodeURIComponent(value));
      setSugs(await res.json()); setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function submit(e:FormEvent) {
    e.preventDefault(); if (!value.trim()) return;
    setOpen(false); router.push('/how-long-until-'+value.trim().toLowerCase().replace(/\\s+/g,'-'));
  }
  function pick(slug:string) { setOpen(false); router.push('/how-long-until-'+slug); }

  return (
    <div ref={ref} className="relative max-w-md mx-auto">
      <form onSubmit={submit}
        className="flex gap-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-1.5 transition-all duration-300"
        style={{ boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
        <input
          className="flex-1 bg-transparent px-3 py-2 text-base text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
          placeholder="Christmas, World Cup, Solar Eclipse…"
          value={value}
          onChange={e=>{setValue(e.target.value);setOpen(true);}}
          onFocus={()=>sugs.length&&setOpen(true)}
          autoComplete="off"
        />
        <button type="submit"
          className="float glow gc-brand press bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-600 transition-colors"
          style={{ '--glow':'83,74,183', boxShadow:'0 4px 16px rgba(83,74,183,0.4)', animationDuration:'4s' } as React.CSSProperties}>
          Go
        </button>
      </form>
      {open && sugs.length > 0 && (
        <div className="anim-scale-in absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 overflow-hidden"
          style={{ boxShadow:'0 8px 40px rgba(83,74,183,0.2),0 4px 16px rgba(0,0,0,0.1)' }}>
          {sugs.map(s=>(
            <button key={s.slug} onClick={()=>pick(s.slug)}
              className="sidebar-item w-full text-left px-4 py-3 flex items-center justify-between text-sm"
              style={{ '--glow':'83,74,183' } as React.CSSProperties}>
              <span className="font-bold text-gray-800 dark:text-gray-200">{s.name}</span>
              <span className="text-[10px] text-gray-400 capitalize bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`);

console.log('\n✅ Ultimate iOS liquid UI written — 9 files\n');
console.log('Run: npm run dev\n');
console.log('Every element now has:');
console.log('  🌊 Continuous water float animation (staggered, organic timing)');
console.log('  ✨ Intense border glow in category colour on hover');
console.log('  🎯 Sidebar items slide right + glow on hover');
console.log('  💎 Active sidebar item glows with inset border');
console.log('  🔮 Metric cards rise 6px + glow on hover');
console.log('  📊 Chart cards float + glow');
console.log('  🍬 Category strip pills all float and glow');
console.log('  🌟 WhyUs feature cards float organically');
console.log('  🔍 Search bar Go button floats + glows purple');
console.log('  🖱️  All hover states use spring easing');
console.log('  💫 Hero has floating blobs in background');
console.log('  🎨 Nav avatar and sign-up button float');
