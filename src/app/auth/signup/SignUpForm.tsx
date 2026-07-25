'use client';
import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import type { FocusEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StarField } from '@/components/ui/StarField';

const PERKS: [string, string][] = [
  ['⏱️', 'Unlimited saved countdowns'],
  ['🔔', 'Reminders before events'],
  ['📊', 'Personal milestone dashboard'],
  ['🎯', 'Custom events & goals'],
  ['🌍', 'Share your countdowns'],
  ['⭐', 'Premium predictive analytics'],
];

export default function SignUpForm() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);

    // 1. Register the user
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Registration failed. Please try again.');
      setLoading(false);
      return;
    }

    // 2. Auto sign in with credentials
    const signInRes = await signIn('credentials', {
      email, password, redirect: false, callbackUrl: '/dashboard',
    });

    setLoading(false);
    if (signInRes?.error) {
      setError('Account created! Please sign in.');
      router.push('/auth/signin');
    } else {
      router.push('/dashboard');
    }
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

  function focusBrand(e: FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = `rgb(var(--accent-brand))`;
  }
  function blurBrand(e: FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.borderColor = 'var(--border-hairline)';
  }

  return (
    <div className="relative" style={{ minHeight: 'calc(100vh - 57px)', background: 'var(--bg-base)', overflow: 'hidden' }}>
      <StarField />

      <div className="relative z-10 flex" style={{ minHeight: 'calc(100vh - 57px)' }}>
        {/* LEFT — value prop panel, transparent so starfield shows through */}
        <div className="hidden lg:flex flex-col justify-center w-1/2 px-12 py-16 flex-shrink-0">
          <Link href="/" className="text-xl font-medium mb-12 block no-underline" style={{ color: 'var(--text-primary)' }}>
            How Long<span className="gradient-text"> Until X</span>
          </Link>
          <h1 className="text-title1 mb-4" style={{ color: 'var(--text-primary)' }}>
            Your personal<br />time command centre
          </h1>
          <p className="text-callout mb-10" style={{ color: 'var(--text-secondary)' }}>
            Free account. No credit card. Everything you need to stay ahead of every date that matters.
          </p>
          <div className="space-y-4">
            {PERKS.map(([icon, label]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <span className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 flex items-center gap-3" style={{ borderTop: '1px solid var(--border-hairline)' }}>
            <div className="flex">
              {['🧑', '👩', '👨', '🧕', '👦'].map((e, i) => (
                <div
                  key={i}
                  style={{
                    marginLeft: i > 0 ? -8 : 0,
                    background: 'var(--bg-elevated-2)',
                    border: '2px solid var(--bg-base)',
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                >
                  {e}
                </div>
              ))}
            </div>
            <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>12,400+</strong> people tracking their countdowns
            </p>
          </div>
        </div>

        {/* RIGHT — signup form, floating card over the starfield */}
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
            <Link href="/" className="lg:hidden text-lg font-medium block mb-8 no-underline" style={{ color: 'var(--text-primary)' }}>
              How<span style={{ color: `rgb(var(--accent-brand))` }}>Long</span>Until
            </Link>

            <h2 className="text-title2 mb-1" style={{ color: 'var(--text-primary)' }}>Create free account</h2>
            <p className="text-footnote mb-8" style={{ color: 'var(--text-secondary)' }}>
              Already have one?{' '}
              <Link href="/auth/signin" className="font-medium" style={{ color: `rgb(var(--accent-brand))` }}>Sign in</Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Your name <span style={{ color: 'var(--text-tertiary)' }}>(optional)</span>
                </label>
                <input
                  type="text" autoComplete="name"
                  placeholder="Alex"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={inputStyle}
                  onFocus={focusBrand}
                  onBlur={blurBrand}
                />
              </div>
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
                  onFocus={focusBrand}
                  onBlur={blurBrand}
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <input
                  type="password" required autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={focusBrand}
                  onBlur={blurBrand}
                />
              </div>
              <div>
                <label className="block text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Confirm password
                </label>
                <input
                  type="password" required autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                  onFocus={focusBrand}
                  onBlur={blurBrand}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', borderRadius: 'var(--r-md)', padding: '12px 16px' }}>
                  <p className="text-sm" style={{ color: 'rgb(var(--accent-red))' }}>{error}</p>
                </div>
              )}

              {/* Password strength hint */}
              {password.length > 0 && (
                <div className="flex gap-1 items-center">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-colors"
                      style={{
                        background: password.length >= i * 3
                          ? password.length >= 12 ? `rgb(var(--accent-green))` : password.length >= 8 ? `rgb(var(--accent-orange))` : `rgb(var(--accent-red))`
                          : 'var(--border-hairline)',
                      }}
                    />
                  ))}
                  <span className="text-xs ml-1" style={{ color: 'var(--text-tertiary)' }}>
                    {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: `rgb(var(--accent-brand))`, color: '#fff' }}
              >
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <p className="text-center text-xs mt-6" style={{ color: 'var(--text-tertiary)' }}>
              By signing up you agree to our{' '}
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
