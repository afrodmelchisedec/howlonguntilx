import { NextRequest, NextResponse } from 'next/server';
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

async function verifySignature(headers: Headers, rawBody: string) {
  const accessToken = await getAccessToken();
  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

function resolveStatus(resource: any): 'trialing' | 'active' {
  const tenure = resource?.billing_info?.cycle_executions?.find(
    (c: any) => c.tenure_type === 'TRIAL'
  );
  if (tenure && tenure.cycles_remaining > 0) return 'trialing';
  return 'active';
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  let verified = false;
  try {
    verified = await verifySignature(req.headers, rawBody);
  } catch (err) {
    console.error('PayPal webhook verification error:', err);
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }
  if (!verified) {
    console.error('PayPal webhook signature invalid — rejecting.');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const eventType = event.event_type as string;
  const resource = event.resource ?? {};
  const userId: string | undefined = resource.custom_id;
  const subscriptionId: string | undefined = resource.id ?? resource.billing_agreement_id;

  const findUser = async () => {
    if (userId) {
      const u = await prisma.user.findUnique({ where: { id: userId } });
      if (u) return u;
    }
    if (subscriptionId) {
      return prisma.user.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
    }
    return null;
  };

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED': {
      const user = await findUser();
      if (!user) { console.error('No matching user for ACTIVATED', { userId, subscriptionId }); break; }
      const status = resolveStatus(resource);
      const trialEndsAt = status === 'trialing' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: 'PRO',
          subscriptionStatus: status,
          paypalSubscriptionId: subscriptionId ?? user.paypalSubscriptionId,
          planRenewsAt: resource.billing_info?.next_billing_time ? new Date(resource.billing_info.next_billing_time) : null,
          trialEndsAt,
        },
      });
      break;
    }
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED': {
      const user = await findUser();
      if (!user) break;
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'FREE', subscriptionStatus: eventType.endsWith('EXPIRED') ? 'expired' : 'cancelled', trialEndsAt: null },
      });
      break;
    }
    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
      const user = await findUser();
      if (!user) break;
      await prisma.user.update({ where: { id: user.id }, data: { subscriptionStatus: 'suspended' } });
      break;
    }
    case 'PAYMENT.SALE.COMPLETED': {
      const user = await findUser();
      if (!user) break;
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: 'PRO', subscriptionStatus: 'active', trialEndsAt: null },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
