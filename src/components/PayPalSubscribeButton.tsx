'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

declare global {
  interface Window {
    paypal?: any;
  }
}

const MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE === 'live' ? 'live' : 'sandbox';

const CLIENT_ID =
  MODE === 'live'
    ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE!
    : process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_SANDBOX!;

const PLAN_ID =
  MODE === 'live'
    ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_LIVE!
    : process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_SANDBOX!;

export default function PayPalSubscribeButton() {
  const { data: session, status } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [uiState, setUiState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (document.getElementById('paypal-sdk')) { setSdkReady(true); return; }
    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&vault=true&intent=subscription`;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current || status !== 'authenticated' || !session?.user?.id) return;
    containerRef.current.innerHTML = '';

    window.paypal.Buttons({
      style: { shape: 'pill', color: 'gold', layout: 'vertical', label: 'subscribe' },
      createSubscription: (_data: any, actions: any) => {
        return actions.subscription.create({
          plan_id: PLAN_ID,
          custom_id: session.user.id,
        });
      },
      onApprove: async (data: any) => {
        setUiState('processing');
        try {
          await fetch('/api/paypal/subscribe/confirm-pending', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId: data.subscriptionID }),
          });
        } catch {}
        setUiState('success');
      },
      onError: () => setUiState('error'),
      onCancel: () => setUiState('idle'),
    }).render(containerRef.current);
  }, [sdkReady, status, session]);

  if (status !== 'authenticated') {
    return <p className="text-sm ios-muted">Sign in to start your free trial.</p>;
  }

  if (uiState === 'success') {
    return (
      <div className="ios-card-nested p-4 text-center">
        <p className="font-medium">Trial started! 🎉</p>
        <p className="text-sm ios-muted mt-1">
          You've got 7 days of free Pro access. Activating now — this can take up to a minute.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div ref={containerRef} />
      {uiState === 'processing' && <p className="text-sm ios-muted mt-2">Confirming your trial…</p>}
      {uiState === 'error' && <p className="text-sm text-red-500 mt-2">Something went wrong — please try again.</p>}
      {!sdkReady && <p className="text-sm ios-muted">Loading payment options…</p>}
    </div>
  );
}
