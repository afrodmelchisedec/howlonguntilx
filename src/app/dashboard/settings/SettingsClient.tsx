'use client';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface Props { session: { user: { name?: string | null; email?: string | null; image?: string | null } } }

export function SettingsClient({ session }: Props) {
  async function deleteAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return;
    await fetch('/api/user', { method: 'DELETE' });
    signOut({ callbackUrl: '/' });
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href="/dashboard" className="text-sm text-gray-400 hover:text-brand-500 mb-6 block">← Dashboard</Link>
      <h1 className="text-2xl font-medium mb-8">Account settings</h1>

      <div className="space-y-4">
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Profile</p>
          <div className="flex items-center gap-4">
            {session.user.image && <img src={session.user.image} className="w-12 h-12 rounded-full" alt="" />}
            <div>
              <p className="font-medium">{session.user.name ?? 'Anonymous'}</p>
              <p className="text-sm text-gray-400">{session.user.email}</p>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Plan</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free plan</p>
              <p className="text-sm text-gray-400">Unlimited countdowns, basic features</p>
            </div>
            <span className="text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-500 px-2 py-1 rounded-full font-medium">FREE</span>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Actions</p>
          <div className="space-y-2">
            <button onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left text-sm px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Sign out
            </button>
            <button onClick={deleteAccount}
              className="w-full text-left text-sm px-4 py-2.5 border border-red-200 dark:border-red-900 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
              Delete account & all data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
