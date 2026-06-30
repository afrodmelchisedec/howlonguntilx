
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { stripe, PLANS } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';

  // Get or create Stripe customer
  let user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email ?? undefined,
    line_items: [{ price: PLANS.PRO_MONTHLY.priceId, quantity: 1 }],
    success_url: base + '/dashboard?upgraded=1',
    cancel_url:  base + '/dashboard?cancelled=1',
    metadata: { userId: session.user.id },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}
