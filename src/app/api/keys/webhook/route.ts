// FILE: src/app/api/keys/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyApiKeysWebhookSignature, generateApiKey } from '@/lib/paypalKeys';

const PERIOD_LENGTH_DAYS = 30;

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let verified = false;
  try {
    verified = await verifyApiKeysWebhookSignature(req.headers, rawBody);
  } catch (err) {
    console.error('[keys/webhook] signature verification error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }

  if (!verified) {
    console.warn('[keys/webhook] rejected: signature did not verify');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event.event_type;
  const subscriptionId: string | undefined = event.resource?.id;

  if (!subscriptionId) {
    // Not a subscription-related event we care about — ack and move on.
    return NextResponse.json({ ok: true });
  }

  const apiKey = await prisma.apiKey.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
  if (!apiKey) {
    console.warn('[keys/webhook] no ApiKey found for subscription', subscriptionId);
    return NextResponse.json({ ok: true }); // ack anyway — nothing to do, avoid PayPal retry storms
  }

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setUTCDate(periodEnd.getUTCDate() + PERIOD_LENGTH_DAYS);

      // Only mint a new key string the first time it goes active — a
      // reactivation after a suspension should keep the same key so the
      // developer's existing integration doesn't break.
      const key = apiKey.status === 'pending' ? generateApiKey() : apiKey.key;

      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { status: 'active', key, periodStart: now, periodEnd, creditsUsed: 0 },
      });
      console.log('[keys/webhook] activated', { subscriptionId, tier: apiKey.tier });
      break;
    }

    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
      await prisma.apiKey.update({ where: { id: apiKey.id }, data: { status: 'suspended' } });
      console.log('[keys/webhook] suspended', { subscriptionId });
      break;
    }

    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED': {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { status: 'cancelled', revokedAt: new Date() },
      });
      console.log('[keys/webhook] cancelled/expired', { subscriptionId });
      break;
    }

    default:
      // Other event types (e.g. payment receipts) — nothing to do, the
      // lazy rollover in apiAuth.ts handles period renewal on next request.
      break;
  }

  return NextResponse.json({ ok: true });
}
