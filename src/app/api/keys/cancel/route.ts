// FILE: src/app/api/keys/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getAccessToken, API_BASE } from '@/lib/paypalKeys';

// POST — cancels the signed-in user's own API-key subscription via PayPal's
// real cancel API. Deliberately isolated from the Pro-plan cancel route —
// uses the Growth/Scale-specific PayPal credentials (paypalKeys.ts), never
// the main site's PAYPAL_CLIENT_ID/SECRET. A bug here can't touch Pro billing.
// Body: { id: string } — the ApiKey.id to cancel.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = body?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing key id' }, { status: 400 });
  }

  // Scoped to this user — findFirst with both id AND userId means a user
  // can never cancel a key that isn't theirs, even by guessing another id.
  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 });
  }

  if (!apiKey.paypalSubscriptionId) {
    return NextResponse.json({ error: 'No PayPal subscription linked to this key.' }, { status: 400 });
  }

  if (!['active', 'suspended'].includes(apiKey.status)) {
    return NextResponse.json({ error: 'This key is not currently active.' }, { status: 400 });
  }

  try {
    const accessToken = await getAccessToken();
    const res = await fetch(
      `${API_BASE}/v1/billing/subscriptions/${apiKey.paypalSubscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Customer requested cancellation' }),
      }
    );

    // 404 means PayPal already considers it gone — treat as success.
    if (!res.ok && res.status !== 404) {
      const errBody = await res.text().catch(() => '');
      console.error('[keys/cancel] PayPal cancel failed:', res.status, errBody);
      return NextResponse.json(
        { error: 'PayPal could not process the cancellation. Please try again or contact support.' },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error('[keys/cancel] PayPal request error:', err);
    return NextResponse.json({ error: 'Could not reach PayPal. Please try again.' }, { status: 502 });
  }

  // Same shape as the webhook's BILLING.SUBSCRIPTION.CANCELLED handler.
  const updated = await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { status: 'cancelled', revokedAt: new Date() },
  });

  return NextResponse.json({ ok: true, status: updated.status });
}
