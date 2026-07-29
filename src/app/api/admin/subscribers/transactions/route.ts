// FILE: src/app/api/admin/subscribers/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

const SORTABLE = ['createdAt', 'amountCents', 'currency', 'type'] as const;
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
  const type = params.get('type'); // 'SALE' | 'REFUND' | null
  const q = params.get('q')?.trim();

  const where: Prisma.PaymentWhereInput = {};
  if (type === 'SALE' || type === 'REFUND') where.type = type;
  if (q) {
    where.OR = [
      { userEmail: { contains: q, mode: 'insensitive' } },
      { paypalTransactionId: { contains: q, mode: 'insensitive' } },
      { paypalSubscriptionId: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
    ];
  }

  try {
    const [total, rows] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          userEmail: true,
          user: { select: { name: true } },
          paypalTransactionId: true,
          paypalSubscriptionId: true,
          eventType: true,
          type: true,
          amountCents: true,
          currency: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      rows: rows.map(r => ({
        id: r.id,
        userEmail: r.userEmail,
        userName: r.user?.name ?? null,
        paypalTransactionId: r.paypalTransactionId,
        paypalSubscriptionId: r.paypalSubscriptionId,
        eventType: r.eventType,
        type: r.type,
        amountCents: r.amountCents,
        currency: r.currency,
        createdAt: r.createdAt,
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (err) {
    console.error('Transactions list error:', err);
    return NextResponse.json({ error: 'Failed to load transactions' }, { status: 500 });
  }
}