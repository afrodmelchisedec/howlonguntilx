import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const ALLOWED_STATUSES = ['APPROVED', 'REJECTED', 'REMOVED'] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { moderationStatus?: string; moderationNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.moderationStatus || !ALLOWED_STATUSES.includes(body.moderationStatus as any)) {
    return NextResponse.json({ error: 'Invalid moderationStatus' }, { status: 400 });
  }

  const event = await prisma.userEvent.update({
    where: { id: params.id },
    data: {
      moderationStatus: body.moderationStatus as any,
      moderationNote: body.moderationNote ?? null,
      moderatedById: session.user.id,
      moderatedAt: new Date(),
    },
  });
  return NextResponse.json(event);
}
