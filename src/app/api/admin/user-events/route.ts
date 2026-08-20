import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const events = await prisma.userEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      author: { select: { id: true, name: true, email: true, blockedAt: true } },
      category: { select: { id: true, slug: true, name: true } },
    },
  });
  return NextResponse.json({ userEvents: events });
}
