import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-16 py-10 text-sm" style={{ borderTop: '1px solid var(--border-hairline)', color: 'var(--text-tertiary)' }}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <p className="font-black mb-3" style={{ color: 'var(--text-primary)' }}>
              How<span style={{ color: 'rgb(var(--accent-brand))' }}>Long</span>Until
            </p>
            <p className="text-xs leading-relaxed">Live countdowns to anything. Real-time. To the second.</p>
          </div>
          <div>
            <p className="text-caption mb-3">Product</p>
            <div className="space-y-2 text-xs">
              <Link href="/categories" className="block transition-colors hover:opacity-80">Categories</Link>
              <Link href="/embed" className="block transition-colors hover:opacity-80">Embed widget</Link>
              <Link href="/upgrade" className="block transition-colors hover:opacity-80">Pricing</Link>
              <Link href="/auth/signup" className="block transition-colors hover:opacity-80">Sign up free</Link>
            </div>
          </div>
          <div>
            <p className="text-caption mb-3">Developers</p>
            <div className="space-y-2 text-xs">
              <a href="/api/countdown?event=christmas" target="_blank" className="block transition-colors hover:opacity-80">REST API</a>
              <Link href="/embed" className="block transition-colors hover:opacity-80">WordPress plugin</Link>
            </div>
          </div>
          <div>
            <p className="text-caption mb-3">Languages</p>
            <div className="space-y-2 text-xs">
              <Link href="/" className="block transition-colors hover:opacity-80">🇬🇧 English</Link>
              <Link href="/hi" className="block transition-colors hover:opacity-80">🇮🇳 हिंदी</Link>
              <Link href="/ar" className="block transition-colors hover:opacity-80">🇸🇦 العربية</Link>
            </div>
          </div>
        </div>
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs" style={{ borderTop: '1px solid var(--border-hairline)' }}>
          <p>© {new Date().getFullYear()} HowLongUntil. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/legal/terms" className="transition-colors hover:opacity-80">Terms</Link>
            <Link href="/legal/privacy" className="transition-colors hover:opacity-80">Privacy</Link>
            <Link href="/upgrade" className="font-bold" style={{ color: 'rgb(var(--accent-brand))' }}>⭐ Go Premium</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
