// FILE: src/components/ui/Footer.tsx
import Link from 'next/link';
import { NAV_LINKS, INFO_LINKS } from '@/lib/nav-links';

const MORE_TOOLS = [
  { label: 'Percentages Calculator', icon: '％', href: 'https://percentagescalculator.io', color: '64, 156, 255' },
  { label: 'Study Calcs Hub', icon: '🎓', href: 'https://studycalcshub.com', color: '175, 82, 222' },
  { label: 'Health Calcs Hub', icon: '🩺', href: 'https://healthcalcshub.com', color: '255, 69, 58' },
  { label: 'Saudi Calculators', icon: '🧮', href: 'https://saudicalculators.com', color: '255, 159, 10' },
  { label: 'Finance Calcs Hub', icon: '💰', href: 'https://financecalcshub.com', color: '48, 219, 91' },
  { label: 'Is X Safe', icon: '⏳', href: 'https://isxsafe.com', color: '100, 240, 235' },
];

export function Footer() {
  return (
    <footer className="mt-16 py-10 text-sm" style={{ borderTop: '1px solid var(--border-hairline)', color: 'var(--text-tertiary)' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>
              How Long<span className="gradient-text"> Until X</span>
            </p>
            <p className="text-xs leading-relaxed">Live countdowns to anything. Real-time. To the second.</p>
          </div>
          <div>
            <p className="text-caption mb-3">Product</p>
            <div className="space-y-2 text-xs">
              {NAV_LINKS.map(l => (
                <Link key={l.label} href={l.href}
                  {...(l.ext ? { target: '_blank' } : {})}
                  className="block transition-colors hover:opacity-80">
                  {l.label}
                </Link>
              ))}
              <Link href="/upgrade" className="block transition-colors hover:opacity-80">Pricing</Link>
              <Link href="/auth/signup" className="block transition-colors hover:opacity-80">Sign up free</Link>
            </div>
          </div>
          <div>
            <p className="text-caption mb-3">Company</p>
            <div className="space-y-2 text-xs">
              {INFO_LINKS.map(l => (
                <Link key={l.label} href={l.href} className="block transition-colors hover:opacity-80">
                  {l.label}
                </Link>
              ))}
              <Link href="/editorial-guidelines" className="block transition-colors hover:opacity-80">Editorial Guidelines</Link>
            </div>
          </div>

        </div>

        {/* More tools — sibling sites, each with its own accent color */}
        <div className="pt-6 pb-2 text-center" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <p className="text-caption mb-4" style={{ letterSpacing: '0.08em' }}>MORE TOOLS</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {MORE_TOOLS.map(t => (
              <a
                key={t.label}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                className="more-tool-pill inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                style={{
                  background: `rgba(${t.color}, 0.08)`,
                  color: `rgb(${t.color})`,
                  border: `1px solid rgba(${t.color}, 0.3)`,
                }}
              >
                <span aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <p>© {new Date().getFullYear()} How Long Until x. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="transition-colors hover:opacity-80">Terms</Link>
            <Link href="/privacy" className="transition-colors hover:opacity-80">Privacy</Link>
            <Link href="/upgrade" className="font-bold" style={{ color: 'rgb(var(--accent-brand))' }}>⭐ Go Premium</Link>
          </div>
        </div>
      </div>

      <style>{`
        .more-tool-pill {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
                      box-shadow 0.25s ease,
                      background 0.2s ease,
                      border-color 0.2s ease;
        }
        .more-tool-pill:hover {
          transform: translateY(-4px) scale(1.06);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        }
        .more-tool-pill:active {
          transform: translateY(-1px) scale(0.96);
          transition-duration: 0.12s;
        }
      `}</style>
    </footer>
  );
}
