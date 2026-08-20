// FILE: src/app/api/admin/default-follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// GET — current config (null if never set) + a small candidate user list for the picker.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const config = await prisma.defaultFollowConfig.findFirst({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      setBy: { select: { id: true, name: true, email: true } },
    },
  });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  let candidates: { id: string; name: string | null; email: string | null; image: string | null }[] = [];
  if (q && q.length >= 2) {
    candidates = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true, image: true },
      take: 10,
    });
  }

  return NextResponse.json({ config, candidates });
}

// POST — set the default-follow account. Refuses a second write; this is
// permanent and single-admin-set by design (resolved product decision).
export async function POST(req: NextRequest) {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const existing = await prisma.defaultFollowConfig.findFirst({ select: { id: true } });
  if (existing) {
    return NextResponse.json(
      { error: 'A default-follow account is already set and cannot be changed.' },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const config = await prisma.defaultFollowConfig.create({
    data: { userId: body.userId, setById: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      setBy: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(config, { status: 201 });
}

// PATCH — change the default-follow account after it's already set.
// Deliberately separate from POST (which still refuses a second write) —
// this exists purely as an admin escape hatch for testing/re-configuration
// before a real production default is locked in via POST.
export async function PATCH(req: NextRequest) {
  const session = await isAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: body.userId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const existing = await prisma.defaultFollowConfig.findFirst({ select: { id: true } });
  const config = existing
    ? await prisma.defaultFollowConfig.update({
        where: { id: existing.id },
        data: { userId: body.userId, setById: session.user.id },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          setBy: { select: { id: true, name: true, email: true } },
        },
      })
    : await prisma.defaultFollowConfig.create({
        data: { userId: body.userId, setById: session.user.id },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
          setBy: { select: { id: true, name: true, email: true } },
        },
      });

  return NextResponse.json(config);
}
