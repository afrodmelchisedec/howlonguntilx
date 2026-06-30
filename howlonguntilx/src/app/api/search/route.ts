
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (q.length < 2) return NextResponse.json([]);

  const events = await prisma.event.findMany({
    where: { name: { contains: q } },
    take: 8,
    orderBy: { views: 'desc' },
    select: { slug: true, name: true, category: true },
  });

  return NextResponse.json(events);
}
