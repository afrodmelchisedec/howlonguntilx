// FILE: src/app/api/admin/api-keys/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Isolated from the site's Pro-plan admin stats (subscribers/stats/route.ts) —
// this reads the ApiKey model only, never touches User.plan/Payment.
async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // PayPal subscription prices are fixed per tier ($10 Growth / $100 Scale),
    // not stored per-row — so "earnings" here is derived by counting active
    // keys per tier per month rather than summing a Payment table (there is
    // no Payment table for this isolated system; PayPal is the ledger).
    const TIER_PRICE_CENTS: Record<string, number> = { GROWTH: 1000, SCALE: 10000 };

    const [totalKeys, tierGroups, statusGroups, createdThisMonth, createdThisYear] = await Promise.all([
      prisma.apiKey.count(),
      prisma.apiKey.groupBy({ by: ['tier'], _count: { _all: true }, where: { status: 'active' } }),
      prisma.apiKey.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.apiKey.findMany({
        where: { status: 'active', createdAt: { gte: startOfMonth } },
        select: { tier: true },
      }),
      prisma.apiKey.findMany({
        where: { status: 'active', createdAt: { gte: startOfYear } },
        select: { tier: true },
      }),
    ]);

    const byTier: Record<string, number> = { GROWTH: 0, SCALE: 0 };
    tierGroups.forEach(g => { byTier[g.tier] = g._count._all; });

    const byStatus: Record<string, number> = { pending: 0, active: 0, suspended: 0, cancelled: 0 };
    statusGroups.forEach(g => { byStatus[g.status] = g._count._all; });

    // Recurring monthly revenue estimate — active keys * their tier price.
    // Not a substitute for PayPal's own transaction records, just a live
    // at-a-glance figure for the admin dashboard.
    const mrrCents = byTier.GROWTH * TIER_PRICE_CENTS.GROWTH + byTier.SCALE * TIER_PRICE_CENTS.SCALE;
    const sumTierCents = (rows: { tier: string }[]) =>
      rows.reduce((sum, r) => sum + (TIER_PRICE_CENTS[r.tier] ?? 0), 0);

    return NextResponse.json({
      totalKeys,
      byTier,
      byStatus,
      mrrCents,
      newThisMonthCents: sumTierCents(createdThisMonth),
      newThisYearCents: sumTierCents(createdThisYear),
    });
  } catch (err) {
    console.error('API key stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
