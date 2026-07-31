// FILE: src/app/api/keys/confirm-pending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const TIER_CREDIT_LIMITS: Record<'GROWTH' | 'SCALE', number> = {
  GROWTH: 20000,
  SCALE: 250000,
};

// Called from the client right after the PayPal subscribe button reports
// approval. Does NOT grant an active key — that only happens once the
// webhook below confirms the subscription actually activated/paid.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { subscriptionId, tier } = await req.json();
  if (!subscriptionId || (tier !== 'GROWTH' && tier !== 'SCALE')) {
    return NextResponse.json({ error: 'Missing or invalid subscriptionId/tier' }, { status: 400 });
  }

  const existing = await prisma.apiKey.findUnique({ where: { paypalSubscriptionId: subscriptionId } });
  if (existing) {
    return NextResponse.json({ ok: true, status: existing.status });
  }

  await prisma.apiKey.create({
    data: {
      key: `pending_${subscriptionId}`, // placeholder, replaced with a real key by the webhook on activation
      userId: session.user.id,
      tier,
      creditLimit: TIER_CREDIT_LIMITS[tier as 'GROWTH' | 'SCALE'],
      paypalSubscriptionId: subscriptionId,
      status: 'pending',
      periodEnd: new Date(), // placeholder, set for real once activated
    },
  });

  return NextResponse.json({ ok: true, status: 'pending' });
}
