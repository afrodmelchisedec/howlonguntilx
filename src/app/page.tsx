import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { CategoryStrip } from '@/components/ui/CategoryStrip';
import { WhyUs } from '@/components/ui/WhyUs';
import { RecentlyViewed } from '@/components/countdown/RecentlyViewed';
import { HeroTicker } from '@/components/countdown/HeroTicker';
import { SpinTheClock } from '@/components/countdown/SpinTheClock';
import { LiveTickerFeed } from '@/components/countdown/LiveTickerFeed';
import { InteractiveGlobe } from '@/components/countdown/InteractiveGlobe';
import { CommunityBarRace } from '@/components/countdown/CommunityBarRace';
import { CountdownBuilder } from '@/components/countdown/CountdownBuilder';
import { getPopularEvents } from '@/lib/events';

export default async function HomePage() {
  const events = await getPopularEvents(8);

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ minHeight: '580px', display: 'flex', alignItems: 'center' }}>
        <div className="hero-blob" style={{ width: 700, height: 700, top: -200, left: -200, background: 'radial-gradient(circle, #534AB7, #8B7CF8)', animationDelay: '-2s', opacity: 0.10 }} />
        <div className="hero-blob" style={{ width: 450, height: 450, top: 80, right: -100, background: 'radial-gradient(circle, #C084FC, #534AB7)', animationDelay: '-4s', animationDuration: '9s', opacity: 0.07 }} />
        <div className="hero-blob" style={{ width: 350, height: 350, bottom: -50, left: '45%', background: 'radial-gradient(circle, #1D9E75, #378ADD)', animationDelay: '-6s', animationDuration: '11s', opacity: 0.06 }} />

        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="sg">
            <p className="anim-fade-up text-caption mb-4" style={{ color: 'rgb(var(--accent-brand))' }}>LIVE · REAL-TIME · TO THE SECOND</p>
            <h1 className="anim-fade-up" style={{ fontSize: 'clamp(42px, 8vw, 72px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: 12 }}>
              How long<br />
              <span className="gradient-text">until…?</span>
            </h1>
            <div className="anim-fade-up"><HeroTicker /></div>
            <p className="anim-fade-up text-callout max-w-sm mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
              Not an AI guess — a live clock ticking to your exact moment.
            </p>
            <div className="anim-fade-up"><SearchBar /></div>
            <p className="anim-fade-up mt-4 text-caption" style={{ color: 'var(--text-tertiary)' }}>
              Try: "Christmas" · "FIFA World Cup" · "Solar Eclipse" · "Salary Day"
            </p>
          </div>
        </div>
      </div>

      {/* ── CATEGORY STRIP ──────────────────────────────────── */}
      <CategoryStrip />

      {/* ── POPULAR COUNTDOWNS ──────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px 0' }}>
        <PopularGrid events={events} />
      </div>

      {/* ── RECENTLY VIEWED ─────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 16px 32px' }}>
        <RecentlyViewed />
      </div>

      {/* ══════════════════════════════════════════════════════
          ADDICTIVE WIDGETS SECTION
      ══════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid var(--border-hairline)', background: 'var(--bg-elevated-2)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 16px' }}>

          {/* Section header */}
          <div className="text-center mb-10 anim-fade-up">
            <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>INTERACTIVE</p>
            <h2 className="text-title1 mb-2">Play with time</h2>
            <p className="text-callout max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Explore, discover, and track what matters to you.
            </p>
          </div>

          {/* Widget 1 + 2 — side by side on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <SpinTheClock />
            <CommunityBarRace />
          </div>

          {/* Widget 3 — Globe full width */}
          <div className="mb-5">
            <InteractiveGlobe />
          </div>

          {/* Widget 4 + 5 — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <LiveTickerFeed />
            <CountdownBuilder />
          </div>

        </div>
      </div>

      {/* ── WHY US ──────────────────────────────────────────── */}
      <WhyUs />
    </div>
  );
}
