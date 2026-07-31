// FILE: src/components/api/ApiSubscribeButton.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

type Tier = 'GROWTH' | 'SCALE';

const IS_LIVE = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live';

// NOTE: these must be static, literal `process.env.NEXT_PUBLIC_X` references —
// Next.js inlines NEXT_PUBLIC_* vars into the client bundle via a build-time
// find/replace. Dynamic bracket access like process.env[`FOO_${mode}`] can't
// be resolved at build time, so it silently returns undefined in the browser.
const CLIENT_ID = IS_LIVE
  ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE
  : process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_SANDBOX;

const PLAN_IDS: Record<Tier, string | undefined> = {
  GROWTH: IS_LIVE
    ? process.env.NEXT_PUBLIC_PAYPAL_API_GROWTH_PLAN_ID_LIVE
    : process.env.NEXT_PUBLIC_PAYPAL_API_GROWTH_PLAN_ID_SANDBOX,
  SCALE: IS_LIVE
    ? process.env.NEXT_PUBLIC_PAYPAL_API_SCALE_PLAN_ID_LIVE
    : process.env.NEXT_PUBLIC_PAYPAL_API_SCALE_PLAN_ID_SANDBOX,
};

let sdkLoadPromise: Promise<void> | null = null;
function loadPayPalSdk(clientId: string): Promise<void> {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    if ((window as any).paypal) return resolve();
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);
  });
  return sdkLoadPromise;
}

export function ApiSubscribeButton({ tier, label }: { tier: Tier; label: string }) {
  const { data: session, status: sessionStatus } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'pending' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session || !containerRef.current) return;
    const planId = PLAN_IDS[tier];
    if (!CLIENT_ID || !planId) {
      setError('API billing isn\u2019t configured yet — missing PayPal plan ID.');
      setState('error');
      return;
    }

    let cancelled = false;
    setState('loading');

    loadPayPalSdk(CLIENT_ID)
      .then(() => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = '';
        (window as any).paypal
          .Buttons({
            style: { layout: 'horizontal', color: 'gold', shape: 'pill', label: 'subscribe', height: 40 },
            createSubscription: (_data: any, actions: any) =>
              actions.subscription.create({ plan_id: planId }),
            onApprove: async (data: any) => {
              try {
                const res = await fetch('/api/keys/confirm-pending', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ subscriptionId: data.subscriptionID, tier }),
                });
                if (!res.ok) throw new Error('Confirm failed');
                setState('pending');
              } catch {
                setError('Subscription approved, but confirming it with our server failed. Contact support with your subscription ID: ' + data.subscriptionID);
                setState('error');
              }
            },
            onError: () => {
              setError('PayPal reported an error starting checkout. Please try again.');
              setState('error');
            },
          })
          .render(containerRef.current);
        setState('idle');
      })
      .catch(() => {
        setError('Could not load PayPal. Please try again.');
        setState('error');
      });

    return () => {
      cancelled = true;
    };
  }, [session, tier]);

  if (sessionStatus === 'loading') {
    return <div className="mt-auto h-10 rounded-lg shimmer" />;
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="mt-auto text-center text-footnote font-bold px-4 py-2.5 rounded-lg"
        style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border-hairline)' }}
      >
        Sign in to subscribe
      </Link>
    );
  }

  if (state === 'pending') {
    return (
      <div className="mt-auto text-center text-footnote font-semibold px-4 py-2.5 rounded-lg" style={{ background: 'rgba(48, 209, 88, 0.15)', color: '#30d158' }}>
        ✓ Subscribed — activating shortly
      </div>
    );
  }

  return (
    <div className="mt-auto">
      {error && <p className="text-caption mb-2" style={{ color: '#ff453a' }}>{error}</p>}
      <div ref={containerRef} aria-label={label} />
    </div>
  );
}
