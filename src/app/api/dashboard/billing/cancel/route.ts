// FILE: src/app/api/dashboard/billing/cancel/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`PayPal OAuth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

// POST — cancels the signed-in user's own Pro subscription via PayPal's
// real cancel API (not just a DB flag — this actually stops future billing).
// The resulting DB update mirrors exactly what the webhook applies on a
// confirmed BILLING.SUBSCRIPTION.CANCELLED event, so whichever path lands
// first (this route, or PayPal's webhook confirming it), the end state matches.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, paypalSubscriptionId: true, subscriptionStatus: true, plan: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user.paypalSubscriptionId) {
    return NextResponse.json({ error: 'No active subscription found on this account.' }, { status: 400 });
  }

  if (!['trialing', 'active'].includes(user.subscriptionStatus)) {
    return NextResponse.json({ error: 'Subscription is not currently active or trialing.' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      `${PAYPAL_API_BASE}/v1/billing/subscriptions/${user.paypalSubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' }),
      }
    );

    // PayPal returns 204 No Content on success. A 404 means PayPal already
    // considers the subscription gone — treat that as success too, since
    // the actual goal (no further billing) is already true either way.
    if (!res.ok && res.status !== 404) {
      const errBody = await res.text().catch(() => '');
      console.error('PayPal cancel failed:', res.status, errBody);
      return NextResponse.json(
        { error: 'PayPal could not process the cancellation. Please try again or contact support.' },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error('PayPal cancel request error:', err);
    return NextResponse.json({ error: 'Could not reach PayPal. Please try again.' }, { status: 502 });
  }

  // Same shape as the webhook's BILLING.SUBSCRIPTION.CANCELLED handler —
  // paypalSubscriptionId is deliberately kept for the audit trail; only
  // status/plan/trial change.
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: 'FREE', subscriptionStatus: 'cancelled', trialEndsAt: null },
  });

  return NextResponse.json({
    ok: true,
    plan: updated.plan,
    subscriptionStatus: updated.subscriptionStatus,
  });
}
