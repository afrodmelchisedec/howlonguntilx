// FILE: src/app/api/user-events/categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { userEvents: { some: { visibility: 'PUBLIC', moderationStatus: 'APPROVED' } } },
    select: { slug: true, name: true, emoji: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(categories);
}
