'use client';
import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const PERKS = [
  ['⏱️','Unlimited saved countdowns'],
  ['🔔','Reminders before events'],
  ['📊','Personal milestone dashboard'],
  ['🎯','Custom events & goals'],
  ['🌍','Share your countdowns'],
  ['⭐','Premium predictive analytics'],
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

  return (
    <div className="min-h-[calc(100vh-57px)] flex">
      {/* LEFT — dark value prop */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gray-950 text-white px-12 py-16 flex-shrink-0">
        <Link href="/" className="text-xl font-medium mb-12 block text-white">
          How<span className="text-brand-500">Long</span>Until
        </Link>
        <h1 className="text-4xl font-medium mb-4 leading-tight">Your personal<br/>time command centre</h1>
        <p className="text-gray-400 text-base mb-10 leading-relaxed">
          Free account. No credit card. Everything you need to stay ahead of every date that matters.
        </p>
        <div className="space-y-4">
          {PERKS.map(([icon, label]) => (
            <div key={label as string} className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <span className="text-sm text-gray-300">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex items-center gap-3">
          <div className="flex">
            {['🧑','👩','👨','🧕','👦'].map((e, i) => (
              <div key={i} style={{ marginLeft: i > 0 ? -8 : 0 }}
                className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-950 flex items-center justify-center text-sm">
                {e}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-400"><strong className="text-white">12,400+</strong> people tracking their countdowns</p>
        </div>
      </div>

      {/* RIGHT — signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden text-lg font-medium block mb-8 text-gray-900 dark:text-white">
            How<span className="text-brand-500">Long</span>Until
          </Link>

          <h2 className="text-2xl font-medium mb-1 text-gray-900 dark:text-white">Create free account</h2>
          <p className="text-sm text-gray-500 mb-8">
            Already have one?{' '}
            <Link href="/auth/signin" className="text-brand-500 hover:underline font-medium">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">
                Your name <span className="text-gray-300">(optional)</span>
              </label>
              <input
                type="text" autoComplete="name"
                placeholder="Alex"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">
                Email address
              </label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">
                Password
              </label>
              <input
                type="password" required autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5">
                Confirm password
              </label>
              <input
                type="password" required autoComplete="new-password"
                placeholder="Repeat password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Password strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex-1 h-1 rounded-full transition-colors" style={{
                    background: password.length >= i * 3
                      ? password.length >= 12 ? '#1D9E75' : password.length >= 8 ? '#BA7517' : '#D85A30'
                      : '#e5e7eb'
                  }} />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing up you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-brand-500">Terms</Link>
            {' & '}
            <Link href="/legal/privacy" className="underline hover:text-brand-500">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
