import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

const EDITABLE_FIELDS = [
  'name',
  'email',
  'role',
  'plan',
  'subscriptionStatus',
  'planRenewsAt',
  'trialEndsAt',
] as const;

function pickEditableFields(body: Record<string, unknown>): Prisma.UserUpdateInput {
  const data: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (key in body) data[key] = body[key];
  }
  return data as Prisma.UserUpdateInput;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await isAdmin();
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.action === 'block' || body.action === 'unblock') {
    if (body.action === 'block' && params.id === session.user.id) {
      return NextResponse.json({ error: "Can't block your own account" }, { status: 400 });
    }
    const data: Prisma.UserUpdateInput =
      body.action === 'block'
        ? {
            blockedAt: new Date(),
            blockedBy: { connect: { id: session.user.id } },
            blockReason: typeof body.reason === 'string' ? body.reason : null,
          }
        : { blockedAt: null, blockedBy: { disconnect: true }, blockReason: null };
    try {
      const user = await prisma.user.update({ where: { id: params.id }, data });
      return NextResponse.json(user);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Block/unblock failed' },
        { status: 400 }
      );
    }
  }

  const data = pickEditableFields(body);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json(user);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!await isAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
