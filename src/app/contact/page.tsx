// FILE: src/app/contact/page.tsx
import Link from 'next/link';

const GLOW = '255, 159, 10'; // warm accent — distinct from About/Tech Events, matches "reach out" energy

// TODO: replace with your real support inbox
const CONTACT_EMAIL = 'hello@howlonguntilx.com';

export const metadata = {
  title: 'Contact HowLongUntil',
  description: 'Get in touch with the HowLongUntil team — tool suggestions, bug reports, partnerships, or general questions.',
  alternates: { canonical: 'https://www.howlonguntilx.com/contact' },
};

const REASONS = [
  { emoji: '💡', title: 'Suggest a tool', body: 'Have an idea for a countdown or tracker we haven\'t built yet? Tell us the category and the interaction you\'re picturing.' },
  { emoji: '🐛', title: 'Report a bug', body: 'Something broken or behaving oddly? Include the tool name and what you were doing right before it happened.' },
  { emoji: '🤝', title: 'Partnerships', body: 'Interested in integrating, embedding, or collaborating? We\'d love to hear the details.' },
  { emoji: '❓', title: 'Something else', body: 'Genuinely anything else — feedback, press, or just to say hi.' },
];

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px' }}>
      <style>{`
        .contact-glow { transition: box-shadow 220ms ease, transform 220ms ease; }
        .contact-glow:hover { transform: translateY(-3px); box-shadow: 0 0 0 1.5px rgba(${GLOW}, 0.5), 0 14px 32px rgba(${GLOW}, 0.18); }
      `}</style>

      <div className="text-center mb-10 anim-fade-up">
        <p className="text-caption font-bold mb-2 tracking-wide" style={{ color: `rgb(${GLOW})` }}>GET IN TOUCH</p>
        <h1 className="text-title1 mb-3">Let's talk</h1>
        <p className="text-callout max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Whether it's a bug, an idea, or a partnership — we read every message ourselves.
        </p>
      </div>

      <div className="ios-card p-6 sm:p-8 mb-10 text-center anim-fade-up" style={{ boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.25), 0 0 40px rgba(${GLOW}, 0.1)`, animationDelay: '80ms' }}>
        <p className="text-caption mb-2" style={{ color: 'var(--text-secondary)' }}>EMAIL US DIRECTLY</p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-title3 font-bold" style={{ color: `rgb(${GLOW})` }}>{CONTACT_EMAIL}</a>
        <p className="text-footnote mt-3" style={{ color: 'var(--text-secondary)' }}>We typically reply within a couple of business days.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {REASONS.map((r, i) => (
          <div key={r.title} className="contact-glow ios-card-nested p-4 flex gap-3 items-start anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="text-xl flex-shrink-0">{r.emoji}</div>
            <div>
              <p className="text-headline mb-0.5">{r.title}</p>
              <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{r.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center anim-fade-up">
        <p className="text-caption" style={{ color: 'var(--text-secondary)' }}>
          Curious what we're building? Read more <Link href="/about" className="underline" style={{ color: `rgb(${GLOW})` }}>about HowLongUntil</Link>.
        </p>
      </div>
    </div>
  );
}
