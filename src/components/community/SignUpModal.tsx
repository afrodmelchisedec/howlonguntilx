'use client';
import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface SignUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl?: string;
}

export function SignUpModal({ isOpen, onClose, callbackUrl = '/dashboard' }: SignUpModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return; }
    setLoading(true);

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

    const signInRes = await signIn('credentials', {
      email, password, redirect: false, callbackUrl,
    });

    setLoading(false);
    if (signInRes?.error) {
      setError('Account created! Please sign in.');
      window.location.href = '/auth/signin';
    } else {
      window.location.href = callbackUrl;
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-hairline)',
          borderRadius: 'var(--r-lg)',
          padding: 32,
          boxShadow: 'var(--shadow-elevated)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-title2" style={{ color: 'var(--text-primary)' }}>Create free account</h2>
          <button type="button" onClick={onClose} aria-label="Close"
            className="text-lg leading-none" style={{ color: 'var(--text-tertiary)' }}>
            &#x2715;
          </button>
        </div>
        <p className="text-footnote mb-6" style={{ color: 'var(--text-secondary)' }}>
          Sign up free to create and share your own countdown.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" autoComplete="name" placeholder="Your name (optional)"
            value={name} onChange={e => setName(e.target.value)} style={inputStyle}
          />
          <input
            type="email" required autoComplete="email" placeholder="you@email.com"
            value={email} onChange={e => setEmail(e.target.value)} style={inputStyle}
          />
          <input
            type="password" required autoComplete="new-password" placeholder="Min. 8 characters"
            value={password} onChange={e => setPassword(e.target.value)} style={inputStyle}
          />
          <input
            type="password" required autoComplete="new-password" placeholder="Repeat password"
            value={confirm} onChange={e => setConfirm(e.target.value)} style={inputStyle}
          />

          {error && (
            <div style={{ background: 'rgba(255, 69, 58, 0.1)', border: '1px solid rgba(255, 69, 58, 0.3)', borderRadius: 'var(--r-md)', padding: '10px 14px' }}>
              <p className="text-sm" style={{ color: 'rgb(var(--accent-red))' }}>{error}</p>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: `rgb(var(--accent-brand))`, color: '#fff' }}
          >
            {loading ? 'Creating account…' : 'Create account \u2192'}
          </button>
        </form>

        <p className="text-center text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
          Already have an account?{' '}
          <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium" style={{ color: `rgb(var(--accent-brand))` }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
