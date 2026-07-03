import { SearchBar } from '@/components/countdown/SearchBar';
import { PopularGrid } from '@/components/countdown/PopularGrid';
import { WhyUs } from '@/components/ui/WhyUs';
import { RecentlyViewed } from '@/components/countdown/RecentlyViewed';
import { HeroTicker } from '@/components/countdown/HeroTicker';
import { StarField } from '@/components/ui/StarField';
import { SpinTheClock } from '@/components/countdown/SpinTheClock';
import { LiveTickerFeed } from '@/components/countdown/LiveTickerFeed';
import { InteractiveGlobe } from '@/components/countdown/InteractiveGlobe';
import { CommunityBarRace } from '@/components/countdown/CommunityBarRace';
import { CountdownBuilder } from '@/components/countdown/CountdownBuilder';
import { getPopularEvents } from '@/lib/events';
import { CategoryPills } from '@/components/ui/CategoryPills';
import { FaqSection } from '@/components/ui/FaqSection';
import { getLiveFaqs } from '@/lib/faqs';



export default async function HomePage() {
  const [events, faqs] = await Promise.all([
    getPopularEvents(8),
    getLiveFaqs(),
  ]);

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>

      {/* ══════════════════════════════════════════════════════
          STARFIELD — sized to the full page, sits behind everything
      ══════════════════════════════════════════════════════ */}
      <StarField />

      <div className="relative z-10">

        {/* ══════════════════════════════════════════════════════
            HERO — full bleed, transparent so starfield shows through
        ══════════════════════════════════════════════════════ */}
        <div className="relative overflow-hidden" style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Soft blob accents */}
          <div className="hero-blob" style={{ width: 800, height: 800, top: -300, left: -300, background: 'radial-gradient(circle, #534AB7, #8B7CF8)', opacity: 0.07 }} />
          <div className="hero-blob" style={{ width: 500, height: 500, top: 100, right: -150, background: 'radial-gradient(circle, #C084FC, #534AB7)', animationDuration: '9s', opacity: 0.05 }} />
          <div className="hero-blob" style={{ width: 400, height: 400, bottom: -100, left: '40%', background: 'radial-gradient(circle, #1D9E75, #378ADD)', animationDuration: '11s', opacity: 0.04 }} />

          {/* Content */}
          <div className="relative z-10 w-full px-4 py-16 text-center" style={{ maxWidth: 760 }}>
            <div className="sg">

              {/* Eyebrow */}
              <p className="anim-fade-up text-caption mb-4" style={{ color: 'rgb(var(--accent-brand))' }}>
                LIVE · REAL-TIME · TO THE SECOND
              </p>

              {/* Headline */}
              <h1 className="anim-fade-up" style={{
                fontSize: 'clamp(52px, 9vw, 88px)',
                fontWeight: 900,
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                marginBottom: 8,
              }}>
                How long<br />
                <span className="gradient-text">until…?</span>
              </h1>

              {/* Subtext */}
              <p className="anim-fade-up text-callout mb-2" style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 24px' }}>
                Not an AI guess — a live clock ticking to your exact moment.
              </p>

              {/* Wider search bar */}
              <div className="anim-fade-up w-full mx-auto mb-2" style={{ maxWidth: 680 }}>
                <SearchBar />
              </div>

              <p className="anim-fade-up text-caption mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Try: "Christmas" · "FIFA World Cup" · "Solar Eclipse" · "Salary Day"
              </p>

              {/* Hero Ticker — wide, swipeable */}
              <div className="anim-fade-up">
                <HeroTicker />
              </div>

              <CategoryPills />

            </div>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
            <p className="text-caption">Scroll to explore</p>
            <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom, var(--text-tertiary), transparent)' }} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            POPULAR COUNTDOWNS — transparent, starfield shows through
        ══════════════════════════════════════════════════════ */}
        <div>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 16px 16px' }}>
            <PopularGrid events={events} />
          </div>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 32px' }}>
            <RecentlyViewed />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            ADDICTIVE WIDGETS — no background, floats directly on starfield
        ══════════════════════════════════════════════════════ */}
        <div>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '56px 16px' }}>
            <div className="text-center mb-10 anim-fade-up">
              <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>INTERACTIVE</p>
              <h2 className="text-title1 mb-2">Play with time</h2>
              <p className="text-callout" style={{ color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto' }}>
                Explore, discover, and track what matters to you.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <SpinTheClock />
              <CommunityBarRace />
            </div>
            <div className="mb-5">
              <InteractiveGlobe />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <LiveTickerFeed />
              <CountdownBuilder />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            FAQ — live slider + paginated archive
        ══════════════════════════════════════════════════════ */}
        <FaqSection initialFaqs={faqs} />

        {/* ══════════════════════════════════════════════════════
            WHY US
        ══════════════════════════════════════════════════════ */}
        <WhyUs />
      </div>
    </div>
  );
}
