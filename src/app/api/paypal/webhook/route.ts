// FILE: src/app/api/paypal/webhook/route.ts
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

// PayPal's `resource.id` means a DIFFERENT thing depending on the event:
// - On BILLING.SUBSCRIPTION.* events, resource.id IS the subscription id.
// - On PAYMENT.SALE.* events, resource.id is the SALE/transaction id —
//   the subscription id instead lives at resource.billing_agreement_id.
// The original code used `resource.id ?? resource.billing_agreement_id`
// for every event type, which silently mismatched sales/refunds against
// the wrong id and meant findUser() likely never resolved a user for
// PAYMENT.SALE.COMPLETED. This resolves it per event type instead.
function resolveSubscriptionId(eventType: string, resource: any): string | undefined {
  if (eventType.startsWith('PAYMENT.SALE.')) {
    return resource.billing_agreement_id ?? resource.id;
  }
  return resource.id;
}

function centsFromAmount(amount: { total?: string; value?: string; currency?: string; currency_code?: string } | undefined) {
  const raw = amount?.total ?? amount?.value;
  const currency = amount?.currency ?? amount?.currency_code ?? 'USD';
  if (!raw) return null;
  const cents = Math.round(parseFloat(raw) * 100);
  if (Number.isNaN(cents)) return null;
  return { cents, currency };
}

// Idempotent insert — PayPal can and does redeliver the same webhook.
// paypalTransactionId is unique, so a redelivery is a silent no-op.
async function logPayment(opts: {
  userId?: string;
  userEmail?: string | null;
  paypalTransactionId: string;
  paypalSubscriptionId?: string;
  eventType: string;
  type: 'SALE' | 'REFUND';
  amountCents: number;
  currency: string;
}) {
  try {
    await prisma.payment.create({
      data: {
        userId: opts.userId,
        userEmail: opts.userEmail ?? undefined,
        paypalTransactionId: opts.paypalTransactionId,
        paypalSubscriptionId: opts.paypalSubscriptionId,
        eventType: opts.eventType,
        type: opts.type,
        amountCents: opts.amountCents,
        currency: opts.currency,
      },
    });
  } catch (err: any) {
    // Unique constraint violation = duplicate webhook delivery, not a real error.
    if (err?.code !== 'P2002') {
      console.error('Failed to log Payment:', err);
    }
  }
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
  const subscriptionId = resolveSubscriptionId(eventType, resource);

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
      if (!user) console.error('No matching user for PAYMENT.SALE.COMPLETED', { userId, subscriptionId });

      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data: { plan: 'PRO', subscriptionStatus: 'active', trialEndsAt: null },
        });
      }

      const money = centsFromAmount(resource.amount);
      if (money && resource.id) {
        await logPayment({
          userId: user?.id,
          userEmail: user?.email,
          paypalTransactionId: resource.id,
          paypalSubscriptionId: subscriptionId,
          eventType,
          type: 'SALE',
          amountCents: money.cents,
          currency: money.currency,
        });
      }
      break;
    }
    case 'PAYMENT.SALE.REFUNDED': {
      // Not previously handled at all — refunds silently didn't show up
      // anywhere, which would have quietly inflated earnings totals.
      const user = await findUser();
      const money = centsFromAmount(resource.amount);
      if (money && resource.id) {
        await logPayment({
          userId: user?.id,
          userEmail: user?.email,
          paypalTransactionId: resource.id,
          paypalSubscriptionId: subscriptionId,
          eventType,
          type: 'REFUND',
          amountCents: Math.abs(money.cents),
          currency: money.currency,
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}