// FILE: src/app/api/admin/subscribers/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

const SORTABLE = ['createdAt', 'lastSeen', 'planRenewsAt', 'trialEndsAt', 'name', 'email', 'plan', 'subscriptionStatus'] as const;
type SortField = (typeof SORTABLE)[number];

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get('pageSize') ?? '20', 10) || 20));
  const sortParam = params.get('sort') ?? 'createdAt';
  const sort: SortField = (SORTABLE as readonly string[]).includes(sortParam) ? (sortParam as SortField) : 'createdAt';
  const order: 'asc' | 'desc' = params.get('order') === 'asc' ? 'asc' : 'desc';
  const plan = params.get('plan'); // 'FREE' | 'PRO' | null
  const status = params.get('status'); // SubscriptionStatus | null
  const q = params.get('q')?.trim();

  const where: Prisma.UserWhereInput = {};
  if (plan === 'FREE' || plan === 'PRO') where.plan = plan;
  if (status) where.subscriptionStatus = status as Prisma.EnumSubscriptionStatusFilter['equals'];
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { paypalSubscriptionId: { contains: q, mode: 'insensitive' } },
    ];
  }

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          subscriptionStatus: true,
          planRenewsAt: true,
          trialEndsAt: true,
          paypalSubscriptionId: true,
          createdAt: true,
          lastSeen: true,
          payments: { select: { amountCents: true, type: true } },
        },
      }),
    ]);

    const rows = users.map(u => {
      const lifetimeCents = u.payments.reduce(
        (sum, p) => sum + (p.type === 'SALE' ? p.amountCents : -p.amountCents),
        0
      );
      const { payments, ...rest } = u;
      return { ...rest, lifetimeSpendCents: lifetimeCents };
    });

    return NextResponse.json({
      rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error('Subscriber users list error:', err);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}