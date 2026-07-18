import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { subscriptionId } = await req.json();
  if (!subscriptionId) {
    return NextResponse.json({ error: 'Missing subscriptionId' }, { status: 400 });
  }

  // Does NOT grant Pro access — that only happens via the verified webhook.
  await prisma.user.update({
    where: { id: session.user.id },
    data: { paypalSubscriptionId: subscriptionId, subscriptionStatus: 'pending' },
  });

  return NextResponse.json({ ok: true });
}
