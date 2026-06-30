'use client';
import { signIn, getProviders } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import Link from 'next/link';

interface Provider { id: string; name: string; type: string }

const PERKS = [
  { icon: '⏱️', title: 'Unlimited saved countdowns', desc: 'Never lose track of what matters to you' },
  { icon: '🔔', title: 'Get reminded before events', desc: 'Alerts 1 week, 1 day and 1 hour before' },
  { icon: '📊', title: 'Personal milestone tracker', desc: 'See your life progress in one beautiful dashboard' },
  { icon: '🎯', title: 'Custom events & goals', desc: 'Any date — birthdays, deadlines, adventures' },
  { icon: '🌍', title: 'Share your countdowns', desc: 'Send a live ticking link to anyone' },
  { icon: '⭐', title: 'Premium predictive analytics', desc: 'Crypto, life expectancy, world event forecasts' },
];

export function SignInClient({ mode }: { mode: 'signin' | 'signup' }) {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isSignup = mode === 'signup';

  useEffect(() => {
    getProviders().then(p => setProviders(p));
  }, []);

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const res = await signIn('email', { email: email.trim(), callbackUrl: '/dashboard', redirect: false });
    if (res?.error) {
      setError('Could not send email. Please check your address and try again.');
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  const hasGoogle = !!providers?.google;
  const hasEmail = !!providers?.email;
  const noProviders = providers !== null && !hasGoogle && !hasEmail;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 57px)' }}>

      {/* LEFT — dark value prop panel */}
      <div style={{
        width: '50%', background: '#0a0a0f', color: 'white',
        padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        flexShrink: 0,
      }} className="hidden lg:flex">
        <Link href="/" style={{ fontSize: 20, fontWeight: 500, marginBottom: 40, display: 'block', color: 'white', textDecoration: 'none' }}>
          How<span style={{ color: '#534AB7' }}>Long</span>Until
        </Link>
        <h1 style={{ fontSize: 32, fontWeight: 500, lineHeight: 1.2, marginBottom: 12 }}>
          {isSignup ? 'Your personal time\ncommand centre' : 'Welcome back'}
        </h1>
        <p style={{ color: '#9ca3af', marginBottom: 40, fontSize: 15, lineHeight: 1.6 }}>
          {isSignup
            ? 'Free account. No credit card. Everything you need to stay ahead of every date that matters.'
            : 'Sign in to access your countdowns, dashboard and premium analytics.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {PERKS.map(p => (
            <div key={p.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{p.icon}</span>
              <div>
                <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>{p.title}</div>
                <div style={{ color: '#9ca3af', fontSize: 13 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid #1f2937', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex' }}>
            {['🧑','👩','👨','🧕','👦'].map((e, i) => (
              <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, border: '2px solid #0a0a0f', marginLeft: i > 0 ? -8 : 0 }}>{e}</div>
            ))}
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>
            <strong style={{ color: 'white' }}>12,400+</strong> people tracking their countdowns
          </p>
        </div>
      </div>

      {/* RIGHT — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}
        className="bg-white dark:bg-gray-950">
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden" style={{ fontSize: 18, fontWeight: 500, display: 'block', marginBottom: 24, color: 'inherit', textDecoration: 'none' }}>
            How<span style={{ color: '#534AB7' }}>Long</span>Until
          </Link>

          {sent ? (
            /* Email sent */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
              <h2 className="text-xl font-medium mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                We sent a magic link to <strong>{email}</strong>.
                Click it to sign in instantly — no password needed.
              </p>
              <p className="text-xs text-gray-400 mt-2">Check your spam folder if you don't see it within 1 minute.</p>
              <Link href="/" className="mt-6 block text-sm text-brand-500 hover:underline">← Back to countdowns</Link>
            </div>

          ) : noProviders ? (
            /* No providers configured */
            <div>
              <h2 className="text-xl font-medium mb-2">Setup required</h2>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Add email credentials to your <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.env</code> file to enable sign-in.
              </p>
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-xs font-mono text-gray-600 dark:text-gray-300 leading-relaxed">
                EMAIL_SERVER_HOST="smtp.gmail.com"<br/>
                EMAIL_SERVER_PORT="587"<br/>
                EMAIL_SERVER_USER="you@gmail.com"<br/>
                EMAIL_SERVER_PASSWORD="app-password"<br/>
                EMAIL_FROM="you@gmail.com"
              </div>
              <Link href="/" className="mt-5 block text-sm text-center text-brand-500 hover:underline">← Continue without account</Link>
            </div>

          ) : (
            /* Normal form */
            <>
              <h2 className="text-2xl font-medium mb-1">
                {isSignup ? 'Create free account' : 'Sign in'}
              </h2>
              <p className="text-gray-500 text-sm mb-7">
                {isSignup ? 'Join in seconds. No password required.' : 'Enter your email to receive a sign-in link.'}
              </p>

              {/* Google */}
              {hasGoogle && (
                <button
                  onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-4">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              )}

              {hasGoogle && hasEmail && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
                </div>
              )}

              {/* Email magic link */}
              {hasEmail && (
                <form onSubmit={handleEmail} className="space-y-3">
                  <input
                    type="email" required
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500 placeholder-gray-400"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button type="submit" disabled={loading}
                    className="w-full bg-brand-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
                    {loading ? 'Sending…' : isSignup ? 'Send magic link →' : 'Send sign-in link →'}
                  </button>
                </form>
              )}

              {/* Switch between signin / signup */}
              <p className="text-center text-xs text-gray-400 mt-5">
                {isSignup ? (
                  <>Already have an account?{' '}
                    <Link href="/auth/signin" className="text-brand-500 hover:underline">Sign in</Link>
                  </>
                ) : (
                  <>No account yet?{' '}
                    <Link href="/auth/signup" className="text-brand-500 hover:underline">Create one free</Link>
                  </>
                )}
              </p>

              <p className="text-center text-xs text-gray-400 mt-3">
                By continuing you agree to our{' '}
                <Link href="/legal/terms" className="underline hover:text-brand-500">Terms</Link>
                {' & '}
                <Link href="/legal/privacy" className="underline hover:text-brand-500">Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
