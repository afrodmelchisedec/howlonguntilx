// FILE: src/app/api/dashboard/billing/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET — the signed-in user's own plan/subscription/billing summary.
// Scoped strictly to session.user.id — mirrors the aggregation logic in
// /api/admin/subscribers/users but never touches other users' rows.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      subscriptionStatus: true,
      planRenewsAt: true,
      trialEndsAt: true,
      paypalSubscriptionId: true,
      payments: {
        select: { amountCents: true, type: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const lifetimeSpendCents = user.payments.reduce(
    (sum, p) => sum + (p.type === 'SALE' ? p.amountCents : -p.amountCents),
    0
  );

  return NextResponse.json({
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    planRenewsAt: user.planRenewsAt,
    trialEndsAt: user.trialEndsAt,
    paypalSubscriptionId: user.paypalSubscriptionId,
    lifetimeSpendCents,
  });
}
