'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Magic link via NextAuth email provider
    const { signIn } = await import('next-auth/react');
    await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
    setSent(true);
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link href="/auth/signin" className="text-sm text-gray-400 hover:text-brand-500 mb-6 block">← Back to sign in</Link>
        <h1 className="text-2xl font-medium mb-1">Reset password</h1>
        <p className="text-sm text-gray-500 mb-8">Enter your email and we'll send a sign-in link to reset access.</p>
        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">📬</div>
            <p className="font-medium">Check your inbox</p>
            <p className="text-sm text-gray-500 mt-2">We sent a sign-in link to {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" required placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500" />
            <button type="submit" className="w-full bg-brand-500 text-white rounded-xl py-3 text-sm font-medium hover:bg-brand-600 transition-colors">
              Send reset link →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
