// FILE: src/app/api/admin/reviewers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// GET — all reviewers, with counts of how many articles/events reference each.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reviewers = await prisma.reviewer.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { articles: true, events: true } } },
  });

  return NextResponse.json({ reviewers });
}

// POST — create a new reviewer.
// Body: { slug, name, bio, credentials?, title?, specialty?, photoUrl?, active? }
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.slug || !body.bio) {
    return NextResponse.json({ error: 'name, slug, and bio are required' }, { status: 400 });
  }

  const existing = await prisma.reviewer.findUnique({ where: { slug: body.slug } });
  if (existing) {
    return NextResponse.json({ error: `A reviewer with slug "${body.slug}" already exists` }, { status: 409 });
  }

  const reviewer = await prisma.reviewer.create({
    data: {
      slug: body.slug,
      name: body.name,
      bio: body.bio,
      credentials: body.credentials || null,
      title: body.title || null,
      specialty: body.specialty || null,
      photoUrl: body.photoUrl || null,
      active: typeof body.active === 'boolean' ? body.active : true,
    },
  });

  return NextResponse.json(reviewer, { status: 201 });
}
