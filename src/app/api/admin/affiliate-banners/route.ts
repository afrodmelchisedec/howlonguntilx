// FILE: src/app/api/admin/affiliate-banners/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// GET — all affiliate banners, keyed by categorySlug on the client.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const banners = await prisma.affiliateBanner.findMany({
    orderBy: { categorySlug: 'asc' },
  });

  return NextResponse.json({ banners });
}
