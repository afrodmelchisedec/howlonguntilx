// FILE: src/app/api/admin/subscribers/stats/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    const [
      totalUsers,
      proUsers,
      statusGroups,
      salesAllTime,
      refundsAllTime,
      salesThisMonth,
      refundsThisMonth,
      salesThisYear,
      refundsThisYear,
      totalTransactions,
      totalRefunds,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.groupBy({ by: ['subscriptionStatus'], _count: { _all: true } }),
      prisma.payment.aggregate({ where: { type: 'SALE' }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { type: 'REFUND' }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { type: 'SALE', createdAt: { gte: startOfMonth } }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { type: 'REFUND', createdAt: { gte: startOfMonth } }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { type: 'SALE', createdAt: { gte: startOfYear } }, _sum: { amountCents: true } }),
      prisma.payment.aggregate({ where: { type: 'REFUND', createdAt: { gte: startOfYear } }, _sum: { amountCents: true } }),
      prisma.payment.count({ where: { type: 'SALE' } }),
      prisma.payment.count({ where: { type: 'REFUND' } }),
    ]);

    const byStatus: Record<string, number> = {
      none: 0, pending: 0, trialing: 0, active: 0, cancelled: 0, suspended: 0, expired: 0,
    };
    statusGroups.forEach(g => { byStatus[g.subscriptionStatus] = g._count._all; });

    const net = (sales: number | null, refunds: number | null) => (sales ?? 0) - (refunds ?? 0);

    return NextResponse.json({
      totalUsers,
      proUsers,
      freeUsers: totalUsers - proUsers,
      byStatus,
      earnings: {
        allTimeCents: net(salesAllTime._sum.amountCents, refundsAllTime._sum.amountCents),
        thisMonthCents: net(salesThisMonth._sum.amountCents, refundsThisMonth._sum.amountCents),
        thisYearCents: net(salesThisYear._sum.amountCents, refundsThisYear._sum.amountCents),
      },
      totalTransactions,
      totalRefunds,
    });
  } catch (err) {
    console.error('Subscriber stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}