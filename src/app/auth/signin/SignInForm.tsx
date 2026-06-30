'use client';
import { signIn } from 'next-auth/react';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

  return (
    <div className="min-h-[calc(100vh-57px)] flex">
      {/* LEFT — dark panel */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-gray-950 text-white px-12 py-16 flex-shrink-0">
        <Link href="/" className="text-xl font-medium mb-12 block text-white no-underline">
          How<span className="text-brand-500">Long</span>Until
        </Link>
        <h1 className="text-4xl font-medium mb-4 leading-tight">Welcome back</h1>
        <p className="text-gray-400 text-base mb-10 leading-relaxed">
          Sign in to access your countdown dashboard, saved events and premium analytics.
        </p>
        <div className="space-y-5">
          {[
            ['⏱️','Unlimited saved countdowns','Never lose track of what matters'],
            ['🔔','Reminders before events','Get notified 1 week, 1 day, 1 hour before'],
            ['📊','Personal dashboard','Track all your milestones in one place'],
            ['⭐','Premium analytics','Crypto, life expectancy & world event forecasts'],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="flex items-start gap-4">
              <span className="text-2xl flex-shrink-0">{icon}</span>
              <div>
                <p className="font-medium text-sm text-white">{title}</p>
                <p className="text-sm text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-brand-400 hover:text-brand-300 font-medium">
              Create one free →
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — sign in form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden text-lg font-medium block mb-8 text-gray-900 dark:text-white">
            How<span className="text-brand-500">Long</span>Until
          </Link>

          <h2 className="text-2xl font-medium mb-1 text-gray-900 dark:text-white">Sign in</h2>
          <p className="text-sm text-gray-500 mb-8">
            New here?{' '}
            <Link href="/auth/signup" className="text-brand-500 hover:underline font-medium">
              Create a free account
            </Link>
          </p>

          {/* Google */}
          {process.env.NEXT_PUBLIC_GOOGLE_ENABLED === 'true' && (
            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 border border-gray-200 dark:border-gray-700 rounded-xl py-3 px-4 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors mb-5">
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

            {/* Note: Password structural elements and "Forgot Password" UI have been completely removed here */}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-brand-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            By signing in you agree to our{' '}
            <Link href="/legal/terms" className="underline hover:text-brand-500">Terms</Link>
            {' & '}
            <Link href="/legal/privacy" className="underline hover:text-brand-500">Privacy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}