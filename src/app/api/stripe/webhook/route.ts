
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: 'Webhook error: ' + err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession;
    const userId  = session.metadata?.userId;
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { plan: 'PRO' } });
      console.log('[stripe] upgraded user', userId, 'to PRO');
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub    = event.data.object as Stripe.Subscription;
    const custId = sub.customer as string;
    // Find user by stripe customer — in production store stripeCustomerId on User
    console.log('[stripe] subscription cancelled for customer', custId);
    // For now log only — add stripeCustomerId field to schema for full implementation
  }

  return NextResponse.json({ ok: true });
}
