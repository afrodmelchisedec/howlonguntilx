// FILE: src/app/about/page.tsx
import Link from 'next/link';

const GLOW = '162, 137, 255';

export const metadata = {
  title: 'About HowLongUntil',
  description: 'HowLongUntil is a live countdown and urgency-tracking platform spanning Tech, Finance, Food, Travel, Leisure, and Scam-safety tools.',
  alternates: { canonical: 'https://www.howlonguntilx.com/about' },
};

const CATEGORIES = [
  { emoji: '📱', name: 'Tech', desc: 'Product launches, keynotes, and conference dates you don\'t want to miss.' },
  { emoji: '💰', name: 'Finance', desc: 'Payroll runways, tax deadlines, savings goals, and milestone tracking.' },
  { emoji: '🍽️', name: 'Food', desc: 'Harvest seasons, food festivals, and recipe batch-scaling tools.' },
  { emoji: '✈️', name: 'Travel', desc: 'Jet-lag adjustment, time zone overlap, and trip-planning countdowns.' },
  { emoji: '🎮', name: 'Leisure', desc: 'Sports, entertainment watchlists, and everything worth waiting for.' },
  { emoji: '🛡️', name: 'Scam Safety', desc: 'Fraud response clocks and phishing-identity watch tools that keep you sharp.' },
];

const VALUES = [
  { emoji: '🎯', title: 'Built to be used, not just read', body: 'Every tool on this site is interactive by design — drag a slider, spin a dial, save a spot. We\'d rather you play with something than scroll past it.' },
  { emoji: '🔓', title: 'Free tier that\'s actually useful', body: 'Every tool works meaningfully for free. Pro unlocks more range and saved history — it never gates the core idea behind a paywall.' },
  { emoji: '🌱', title: 'Growing every week', body: 'New tools and articles ship continuously across every category. This is a living platform, not a one-time launch.' },
];

export default function AboutPage() {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 20px' }}>
      <style>{`
        .about-glow { transition: box-shadow 220ms ease, transform 220ms ease; }
        .about-glow:hover { transform: translateY(-3px); box-shadow: 0 0 0 1.5px rgba(${GLOW}, 0.5), 0 14px 32px rgba(${GLOW}, 0.18); }
      `}</style>

      <div className="text-center mb-14 anim-fade-up">
        <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>ABOUT US</p>
        <h1 className="text-title1 mb-3">
          How<span style={{ color: `rgb(${GLOW})` }}>Long</span>Until
        </h1>
        <p className="text-callout max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
          A live countdown and urgency-tracking platform — built for anyone counting down to something that matters, across tech, money, food, travel, leisure, and staying safe from scams.
        </p>
      </div>

      <div className="ios-card p-6 sm:p-8 mb-10 anim-fade-up" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.2), 0 0 40px rgba(${GLOW}, 0.08)`, animationDelay: '80ms' }}>
        <h2 className="text-title3 mb-3">What we're building</h2>
        <p className="text-callout mb-3" style={{ color: 'var(--text-secondary)' }}>
          HowLongUntil started as a simple idea: the countdown deserves to be interactive, not just a number ticking down. From there it grew into a full suite of purpose-built pro-tools — each with its own interaction pattern, its own free and Pro tier, and its own reason to exist.
        </p>
        <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
          Whether you're tracking a payroll runway, a jet-lag adjustment plan, a fraud response window, or just when the next big tech keynote drops — this is a home for the countdowns that actually matter to you.
        </p>
      </div>

      <h2 className="text-title3 mb-4 anim-fade-up">Explore by category</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-14">
        {CATEGORIES.map((c, i) => (
          <div key={c.name} className="about-glow ios-card-nested p-4 flex gap-3 items-start anim-fade-up" style={{ animationDelay: `${i * 60}ms`, border: `1px solid rgba(${GLOW}, 0.15)` }}>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `rgba(${GLOW}, 0.12)` }}>{c.emoji}</div>
            <div>
              <p className="text-headline mb-0.5">{c.name}</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-title3 mb-4 anim-fade-up">What we care about</h2>
      <div className="flex flex-col gap-3 mb-14">
        {VALUES.map((v, i) => (
          <div key={v.title} className="about-glow ios-card-nested p-5 flex gap-4 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="text-2xl flex-shrink-0">{v.emoji}</div>
            <div>
              <p className="text-headline mb-1">{v.title}</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{v.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="ios-card-nested p-6 text-center anim-fade-up" style={{ border: `1px solid rgba(${GLOW}, 0.25)` }}>
        <p className="text-headline mb-2">Have a tool idea, or found something that needs fixing?</p>
        <p className="text-footnote mb-4" style={{ color: 'var(--text-secondary)' }}>We'd genuinely like to hear it.</p>
        <Link href="/contact" className="btn-filled press inline-block px-6 py-2.5">Get in touch →</Link>
      </div>
    </div>
  );
}
