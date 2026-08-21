// FILE: src/app/users/settings/SettingsClient.tsx
'use client';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { UpgradeButton } from '@/components/premium/UpgradeButton';

interface Props { session: { user: { name?: string | null; email?: string | null; image?: string | null } } }

type SubStatus = 'none' | 'pending' | 'trialing' | 'active' | 'cancelled' | 'suspended' | 'expired';

interface Billing {
  plan: 'FREE' | 'PRO';
  subscriptionStatus: SubStatus;
  planRenewsAt: string | null;
  trialEndsAt: string | null;
  paypalSubscriptionId: string | null;
  lifetimeSpendCents: number;
}

interface ApiKeyInfo {
  id: string;
  key: string;
  tier: 'GROWTH' | 'SCALE';
  status: 'pending' | 'active' | 'suspended' | 'cancelled';
  creditLimit: number;
  creditsUsed: number;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

const STATUS_STYLES: Record<SubStatus, string> = {
  none: 'bg-gray-700/40 text-gray-400',
  pending: 'bg-amber-500/10 text-amber-400',
  trialing: 'bg-sky-500/10 text-sky-400',
  active: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  expired: 'bg-gray-600/20 text-gray-500',
};

const KEY_STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  pending: 'bg-amber-500/10 text-amber-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function shortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function SettingsClient({ session }: Props) {
  const [billing, setBilling] = useState<Billing | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancellingKeyId, setCancellingKeyId] = useState<string | null>(null);
  const [apiKeyError, setApiKeyError] = useState('');

  useEffect(() => {
    Promise.all([loadBilling(), loadKeys()]).finally(() => setLoading(false));
  }, []);

  function loadBilling() {
    return fetch('/api/dashboard/billing')
      .then(r => r.json())
      .then(setBilling)
      .catch(() => {});
  }

  function loadKeys() {
    return fetch('/api/keys')
      .then(r => r.json())
      .then(data => setKeys(data.keys || []))
      .catch(() => {});
  }

  async function cancelApiKey(k: ApiKeyInfo) {
    const confirmed = confirm(
      `Cancel your ${k.tier} API subscription? Your key will stop working immediately.`
    );
    if (!confirmed) return;

    setCancellingKeyId(k.id);
    setApiKeyError('');
    try {
      const res = await fetch('/api/keys/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: k.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setApiKeyError(data.error || 'Could not cancel this API key.');
        return;
      }
      await loadKeys();
    } catch {
      setApiKeyError('Network error — please try again.');
    } finally {
      setCancellingKeyId(null);
    }
  }

  async function deleteAccount() {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return;
    await fetch('/api/user', { method: 'DELETE' });
    signOut({ callbackUrl: '/' });
  }

  async function cancelSubscription() {
    if (!billing) return;
    const confirmed = confirm(
      billing.subscriptionStatus === 'trialing'
        ? 'Cancel your trial? You\'ll lose Pro access immediately.'
        : 'Cancel your Pro subscription? You\'ll keep access until the current billing period ends, then move to the Free plan.'
    );
    if (!confirmed) return;

    setCancelling(true);
    setCancelError('');
    try {
      const res = await fetch('/api/dashboard/billing/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setCancelError(data.error || 'Could not cancel your subscription.');
        return;
      }
      await loadBilling();
    } catch {
      setCancelError('Network error — please try again.');
    } finally {
      setCancelling(false);
    }
  }

  function maskKey(key: string) {
    if (revealedKey === key || key.length <= 16) return key;
    return `${key.slice(0, 12)}${'•'.repeat(8)}${key.slice(-4)}`;
  }

  const canCancel = billing && billing.plan === 'PRO' && ['trialing', 'active'].includes(billing.subscriptionStatus);

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href="/users" className="text-sm text-gray-400 hover:text-brand-500 mb-6 block">← Dashboard</Link>
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
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : billing ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">{billing.plan === 'PRO' ? 'Pro plan' : 'Free plan'}</p>
                  <p className="text-sm text-gray-400">
                    {billing.plan === 'PRO' ? 'All premium features unlocked' : 'Unlimited countdowns, basic features'}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    billing.plan === 'PRO'
                      ? 'bg-purple-500/15 text-purple-300'
                      : 'bg-brand-50 dark:bg-brand-900/30 text-brand-500'
                  }`}
                >
                  {billing.plan}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[billing.subscriptionStatus]}`}>
                  {billing.subscriptionStatus}
                </span>
                {billing.subscriptionStatus === 'trialing' && billing.trialEndsAt && (
                  <span className="text-xs text-gray-400">Trial ends {shortDate(billing.trialEndsAt)}</span>
                )}
                {billing.subscriptionStatus === 'active' && billing.planRenewsAt && (
                  <span className="text-xs text-gray-400">Renews {shortDate(billing.planRenewsAt)}</span>
                )}
                {billing.subscriptionStatus === 'cancelled' && (
                  <span className="text-xs text-gray-400">You've moved to the Free plan</span>
                )}
              </div>

              {billing.lifetimeSpendCents > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  Lifetime spend: <span className="text-gray-700 dark:text-gray-200 font-medium">{money(billing.lifetimeSpendCents)}</span>
                </p>
              )}

              {billing.plan !== 'PRO' && (
                <div className="mt-3">
                  <UpgradeButton />
                </div>
              )}

              {canCancel && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {cancelError && (
                    <p className="text-xs text-red-500 mb-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
                      {cancelError}
                    </p>
                  )}
                  <button
                    onClick={cancelSubscription}
                    disabled={cancelling}
                    className="text-sm text-red-500 hover:text-red-600 font-medium disabled:opacity-50"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel subscription'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400">Could not load plan details.</p>
          )}
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">API access</p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : keys.length === 0 ? (
            <div>
              <p className="text-sm text-gray-400 mb-2">You don't have an API key yet.</p>
              <Link href="/api" className="text-xs font-medium text-brand-500 hover:underline">
                See API plans →
              </Link>
            </div>
          ) : (
            <div className="space-y-5">
              {apiKeyError && (
                <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
                  {apiKeyError}
                </p>
              )}
              {keys.map(k => {
                const pct = Math.min(100, Math.round((k.creditsUsed / k.creditLimit) * 100));
                const canCancelKey = ['active', 'suspended'].includes(k.status);
                return (
                  <div key={k.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400">{k.tier}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${KEY_STATUS_STYLES[k.status] ?? 'bg-gray-700/40 text-gray-400'}`}>
                        {k.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md flex-1 truncate">
                        {maskKey(k.key)}
                      </code>
                      <button
                        onClick={() => setRevealedKey(revealedKey === k.key ? null : k.key)}
                        className="text-xs text-gray-400 hover:text-brand-500 flex-shrink-0"
                      >
                        {revealedKey === k.key ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {k.creditsUsed.toLocaleString()} / {k.creditLimit.toLocaleString()} credits used · resets {shortDate(k.periodEnd)}
                      </p>
                    </div>
                    {canCancelKey && (
                      <button
                        onClick={() => cancelApiKey(k)}
                        disabled={cancellingKeyId === k.id}
                        className="text-xs text-red-500 hover:text-red-600 font-medium mt-2 disabled:opacity-50"
                      >
                        {cancellingKeyId === k.id ? 'Cancelling…' : 'Cancel API subscription'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
