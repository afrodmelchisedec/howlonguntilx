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
import { prisma } from '@/lib/db';
import { CategoryPills } from '@/components/ui/CategoryPills';
import { FaqSection } from '@/components/ui/FaqSection';
import { FeaturedSpotlight } from '@/components/ui/FeaturedSpotlight';
import { getLiveFaqs } from '@/lib/faqs';
import { getArticleFaqs } from '@/lib/articleFaqs';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HowLongUntilX — Live countdown to any event',
  description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'HowLongUntilX — Live countdown to any event',
    description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
    url: '/',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HowLongUntilX — Live countdown to any event',
    description: 'Instant countdowns to any event — Christmas, World Cup, salary day and more. Real-time, to the second.',
  },
};



const GLOW_MAP: Record<string, string> = {
  biology: '48, 219, 91',
  family:  '255, 105, 180',
  finance: '255, 159, 10',
  food:    '88, 214, 113',
  culture: '175, 82, 222',
  health:  '255, 69, 58',
  science: '100, 240, 235',
  time:    '64, 156, 255',
};

export default async function HomePage() {
  const [events, faqs, articleFaqs, categories] = await Promise.all([
    getPopularEvents(8),
    getLiveFaqs(),
    getArticleFaqs(),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
    }),
  ]);

  const pillCategories = categories.map(c => ({
    slug: c.slug,
    label: c.slug.charAt(0).toUpperCase() + c.slug.slice(1),
    emoji: c.emoji,
    color: GLOW_MAP[c.slug] || '83, 74, 217',
  }));

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

              {/* Hero mark */}
                <div className="anim-fade-up flex justify-center mb-6">
                  <svg width="64" height="64" viewBox="0 0 32 32" aria-hidden="true">
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#c98fe0" />
                        <stop offset="100%" stopColor="#e07ab0" />
                      </linearGradient>
                    </defs>
                    <rect width="32" height="32" rx="8" fill="url(#heroGrad)" />
                    <path d="M9 7h14M9 25h14M11 7c0 6 4 7 5 9-1 2-5 3-5 9h10c0-6-4-7-5-9 1-2 5-3 5-9" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>

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
                How long 
                <span className="gradient-text"> until x?</span>
              </h1>
              <br/>


              {/* Eyebrow */}
              <p className="anim-fade-up text-caption mb-4" style={{ color: 'rgb(var(--accent-brand))' }}>
                X = EVENT
              </p>
              
              {/* Subtext */}
              <p className="anim-fade-up text-callout mb-2" style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 24px' }}>
                Not an AI guess but a live clock ticking to your exact moment.
              </p>

              {/* Wider search bar — elevated above HeroTicker's own stacking
                  context, since anim-fade-up creates a stacking context via
                  its transform-based keyframe animation on both wrappers */}
              <div className="anim-fade-up w-full mx-auto mb-2" style={{ maxWidth: 680, position: 'relative', zIndex: 300 }}>
                <SearchBar />
              </div>

              <p className="anim-fade-up text-caption mb-6" style={{ color: 'var(--text-tertiary)' }}>
                Try: "How" . "When" . "Christmas" · "FIFA World Cup" · "Solar Eclipse" · "Salary Day"
              </p>

              {/* Hero Ticker — wide, swipeable */}
              <div className="anim-fade-up" style={{ position: 'relative', zIndex: 1 }}>
                <HeroTicker />
              </div>

              <CategoryPills categories={pillCategories} />

            </div>
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

<div className="mb-5">
  <Link href="/calendar" className="ios-card interactive glow gc-travel block p-6 group">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-caption mb-1" style={{ color: 'rgb(var(--accent-brand))' }}>NEW</p>
        <div className="text-headline group-hover:text-brand-500 transition-colors">📅 Event Calendar</div>
        <p className="text-footnote mt-1" style={{ color: 'var(--text-secondary)' }}>
          Click any day, anywhere in the year, for a random fact.
        </p>
      </div>
      <span className="text-2xl" style={{ color: 'var(--text-tertiary)' }}>›</span>
    </div>
  </Link>
</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <LiveTickerFeed />
              <CountdownBuilder />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            FEATURED SPOTLIGHT — rotates weekly (history / fact / quote / meme)
        ══════════════════════════════════════════════════════ */}
        <FeaturedSpotlight />

        {/* ══════════════════════════════════════════════════════
            FAQ — live slider + paginated archive
        ══════════════════════════════════════════════════════ */}
        <FaqSection initialFaqs={faqs} articleFaqs={articleFaqs} />

        {/* ══════════════════════════════════════════════════════
            WHY US
        ══════════════════════════════════════════════════════ */}
        <WhyUs />
      </div>
    </div>
  );
}
