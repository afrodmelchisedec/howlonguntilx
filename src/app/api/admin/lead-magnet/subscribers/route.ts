// FILE: src/app/api/admin/lead-magnet/subscribers/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// GET — all lead magnet subscribers, most recent first.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subscribers = await prisma.leadMagnetSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ subscribers });
}
