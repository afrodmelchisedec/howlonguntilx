'use client';
import { Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import PayPalSubscribeButton from '@/components/PayPalSubscribeButton';
import { useEntitlement } from '@/hooks/useEntitlement';

const FEATURES_FREE = [
  'Up to 5 saved countdowns',
  'All public countdown pages',
  'Basic embed widget',
  'API (60 req/min)',
];

const FEATURES_PRO = [
  'Unlimited saved countdowns',
  'Crypto price target predictions',
  'Life expectancy analytics',
  'World event AI forecasts',
  'Priority email reminders',
  'No ads ever',
  'Custom embed themes (no branding)',
  'API access (1,000 req/min)',
];

function UpgradeContent() {
  const { data: session } = useSession();
  const { tier, isTrialing, trialDaysLeft } = useEntitlement();

  const alreadyPro = tier === 'PRO' || tier === 'TRIAL';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3">Pricing</p>
        <h1 className="text-4xl font-black mb-3">Simple, honest pricing</h1>
        <p className="text-gray-500">Everything in free is free forever. Premium unlocks the analytics layer.</p>
      </div>

      {alreadyPro ? (
        <div className="max-w-md mx-auto text-center card-base rounded-3xl p-8 border border-gray-100 dark:border-gray-800">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-black mb-2">
            {isTrialing ? `You're on your free trial` : `You're on Premium`}
          </h2>
          <p className="text-gray-500 mb-6">
            {isTrialing
              ? `${trialDaysLeft ?? 7} day${trialDaysLeft === 1 ? '' : 's'} left before your card is charged $9.99/mo.`
              : 'All Premium features are unlocked. Thanks for supporting HowLongUntil.'}
          </p>
          <Link href="/dashboard" className="bg-brand-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-600 transition-colors inline-block">
            Go to dashboard →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="float glow gc-brand card-base border border-gray-100 dark:border-gray-800 rounded-3xl p-8"
            style={{'--glow':'83,74,183'} as React.CSSProperties}>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Free</p>
            <div className="text-4xl font-black mb-1">$0</div>
            <p className="text-gray-400 text-sm mb-6">Forever free</p>
            <ul className="space-y-3 mb-8">
              {FEATURES_FREE.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-brand-500 font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup"
              className="block w-full text-center border-2 border-gray-200 dark:border-gray-700 rounded-2xl py-3 font-bold text-sm hover:border-brand-500 hover:text-brand-500 transition-colors">
              Get started free
            </Link>
          </div>

          <div className="float glow gc-brand card-base rounded-3xl p-8 relative overflow-hidden"
            style={{'--glow':'83,74,183', background:'linear-gradient(135deg,#534AB7,#3C3489)', border:'none'} as React.CSSProperties}>
            <div className="absolute top-4 right-4 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              7-day free trial
            </div>
            <p className="text-sm font-bold text-white/70 uppercase tracking-widest mb-2">Premium</p>
            <div className="text-4xl font-black text-white mb-1">$9.99<span className="text-xl font-medium text-white/70">/mo</span></div>
            <p className="text-white/60 text-sm mb-6">
              7 days free, then $9.99/mo · $1 today to verify your card · Cancel anytime
            </p>
            <ul className="space-y-3 mb-8">
              {FEATURES_PRO.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/90">
                  <span className="text-white font-bold mt-0.5">✓</span> {f}
                </li>
              ))}
            </ul>
            {session ? (
              <div className="bg-white rounded-2xl p-3">
                <PayPalSubscribeButton />
              </div>
            ) : (
              <Link href="/auth/signin?callbackUrl=/upgrade"
                className="block w-full text-center bg-white text-brand-600 rounded-2xl py-3 font-black text-sm hover:bg-gray-50 transition-colors">
                Sign in to start your trial →
              </Link>
            )}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        Payments processed securely by PayPal. Cancel any time from your dashboard.
      </p>
    </div>
  );
}

export default function UpgradePage() {
  return <Suspense><UpgradeContent /></Suspense>;
}
