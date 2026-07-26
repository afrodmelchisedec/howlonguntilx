'use client';
import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StarField } from '@/components/ui/StarField';

const PERKS: [string, string, string][] = [
  ['⏱️', 'Unlimited saved countdowns', 'Never lose track of what matters'],
  ['🔔', 'Reminders before events', 'Get notified 1 week, 1 day, 1 hour before'],
  ['📊', 'Personal dashboard', 'Track all your milestones in one place'],
  ['⭐', 'Premium analytics', 'Crypto, life expectancy & world event forecasts'],
];

export default function SignInForm() {
  const [email, setEmail]       = useState('');
  // Set to empty string by default as it's no longer required by the database
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Sends the payload to Next-Auth credentials backend bypass
    const res = await signIn('credentials', {
      email,
      password, // Passed silently to fulfill Next-Auth credential payload types
      redirect: false,
      callbackUrl: '/dashboard',
    });

    setLoading(false);
    if (res?.error) {
      setError('Invalid email address or unauthorized access.');
    } else if (res?.url) {
      router.push('/dashboard');
    }
  }

  async function handleGoogle() {
    await signIn('google', { callbackUrl: '/dashboard' });
  }

  const inputStyle = {
    width: '100%',
    border: '1px solid var(--border-hairline)',
    borderRadius: 'var(--r-md)',
    padding: '12px 16px',
    fontSize: 14,
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    outline: 'none',
  };

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 57px)', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <StarField />

      <div className="relative z-10 flex" style={{ minHeight: 'calc(100vh - 57px)' }}>
        {/* LEFT — value prop panel, transparent so starfield shows through */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 px-12 py-16 flex-shrink-0">
          <Link href="/" className="text-xl font-medium mb-12 block no-underline" style={{ color: 'var(--text-primary)' }}>
            How Long<span className="gradient-text"> Until X</span>
          </Link>
          <h1 className="text-title1 mb-4" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="text-callout mb-10" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your countdown dashboard, saved events and premium analytics.
          </p>
          <div className="space-y-5">
            {PERKS.map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-footnote font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
                  <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8" style={{ borderTop: '1px solid var(--border-hairline)' }}>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-medium" style={{ color: `rgb(var(--accent-brand))` }}>
                Create one free →
              </Link>
            </p>
          </div>
        </div>

        {/* RIGHT — sign in form, floating card over the starfield */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div
            className="w-full max-w-sm"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--r-lg)',
              padding: 32,
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            {/* Mobile logo */}
            <Link href="/" className="lg:hidden text-lg font-medium block mb-8 no-underline" style={{ color: 'var(--text-primary)' }}>
              How<span style={{ color: `rgb(var(--accent-brand))` }}>Long</span>Until
            </Link>

            <h2 className="text-title2 mb-1" style={{ color: 'var(--text-primary)' }}>Sign in</h2>
            <p className="text-footnote mb-8" style={{ color: 'var(--text-secondary)' }}>
              New here?{' '}
              <Link href="/auth/signup" className="font-medium" style={{ color: `rgb(var(--accent-brand))` }}>
                Create a free account
              </Link>
            </p>

            {/* Google */}
            {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 rounded-xl py-3 px-4 text-sm font-medium transition-colors mb-5"
                style={{ border: '1px solid var(--border-hairline)', color: 'var(--text-primary)', background: 'transparent' }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            )}

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email" required autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = `rgb(var(--accent-brand))`)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  type="password" required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = `rgb(var(--accent-brand))`)}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-hairline)')}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                  <p className="text-sm" style={{ color: 'rgb(var(--accent-red))' }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                style={{ background: `rgb(var(--accent-brand))`, color: '#fff' }}
              >
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
              By signing in you agree to our{' '}
              <Link href="/legal/terms" className="underline" style={{ color: 'var(--text-tertiary)' }}>Terms</Link>
              {' & '}
              <Link href="/legal/privacy" className="underline" style={{ color: 'var(--text-tertiary)' }}>Privacy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
