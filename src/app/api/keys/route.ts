// FILE: src/app/api/keys/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Lets a signed-in user fetch their own API key(s) and current usage. Never
// exposes other users' keys; scoped strictly to session.user.id.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      key: true,
      tier: true,
      status: true,
      creditLimit: true,
      creditsUsed: true,
      periodStart: true,
      periodEnd: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ keys });
}
