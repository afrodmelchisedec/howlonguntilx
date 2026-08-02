// FILE: src/app/api/admin/api-keys/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

const SORTABLE = ['createdAt', 'periodEnd', 'creditsUsed', 'creditLimit', 'tier', 'status'] as const;
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
  const tier = params.get('tier'); // 'GROWTH' | 'SCALE' | null
  const status = params.get('status'); // ApiKeyStatus | null
  const q = params.get('q')?.trim();

  const where: Prisma.ApiKeyWhereInput = {};
  if (tier === 'GROWTH' || tier === 'SCALE') where.tier = tier;
  if (status) where.status = status as Prisma.EnumApiKeyStatusFilter['equals'];
  if (q) {
    where.OR = [
      { key: { contains: q, mode: 'insensitive' } },
      { paypalSubscriptionId: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
    ];
  }

  try {
    const [total, keys] = await Promise.all([
      prisma.apiKey.count({ where }),
      prisma.apiKey.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          key: true,
          tier: true,
          status: true,
          creditLimit: true,
          creditsUsed: true,
          periodStart: true,
          periodEnd: true,
          paypalSubscriptionId: true,
          createdAt: true,
          revokedAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
    ]);

    // Only ever expose a masked key to the admin UI — never the raw secret,
    // even to admins, since this is the same string the developer uses as
    // their live Bearer token.
    const rows = keys.map(k => ({
      id: k.id,
      keyMasked: k.key.startsWith('pending_') ? 'pending' : `${k.key.slice(0, 12)}…${k.key.slice(-4)}`,
      tier: k.tier,
      status: k.status,
      creditLimit: k.creditLimit,
      creditsUsed: k.creditsUsed,
      creditsRemaining: Math.max(0, k.creditLimit - k.creditsUsed),
      periodStart: k.periodStart,
      periodEnd: k.periodEnd,
      paypalSubscriptionId: k.paypalSubscriptionId,
      createdAt: k.createdAt,
      revokedAt: k.revokedAt,
      userId: k.user?.id ?? null,
      userName: k.user?.name ?? null,
      userEmail: k.user?.email ?? null,
    }));

    return NextResponse.json({
      rows,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error('API key users list error:', err);
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 });
  }
}
