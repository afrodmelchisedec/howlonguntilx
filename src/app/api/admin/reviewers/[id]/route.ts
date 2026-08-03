// FILE: src/app/api/admin/reviewers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// PATCH — update a reviewer's profile fields.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reviewer = await prisma.reviewer.findUnique({ where: { id: params.id } });
  if (!reviewer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  if (body.slug && body.slug !== reviewer.slug) {
    const clash = await prisma.reviewer.findUnique({ where: { slug: body.slug } });
    if (clash) return NextResponse.json({ error: `Slug "${body.slug}" is already in use` }, { status: 409 });
  }

  const data: Record<string, any> = {};
  if ('name' in body) data.name = body.name;
  if ('slug' in body) data.slug = body.slug;
  if ('bio' in body) data.bio = body.bio;
  if ('credentials' in body) data.credentials = body.credentials || null;
  if ('title' in body) data.title = body.title || null;
  if ('specialty' in body) data.specialty = body.specialty || null;
  if ('photoUrl' in body) data.photoUrl = body.photoUrl || null;
  if ('active' in body) data.active = !!body.active;

  const updated = await prisma.reviewer.update({ where: { id: params.id }, data });

  // Their profile page, plus every article/event page showing their badge.
  revalidatePath(`/reviewers/${updated.slug}`);
  revalidatePath('/admin');

  return NextResponse.json(updated);
}

// DELETE — blocked while any article/event still references this reviewer,
// so deleting can never silently leave dangling badges or a 404'd profile link.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const reviewer = await prisma.reviewer.findUnique({ where: { id: params.id } });
  if (!reviewer) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [articleCount, eventCount] = await Promise.all([
    prisma.article.count({ where: { reviewerId: params.id } }),
    prisma.event.count({ where: { reviewerId: params.id } }),
  ]);

  if (articleCount > 0 || eventCount > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete — still assigned to ${articleCount} article(s) and ${eventCount} event(s). Reassign those first, or deactivate instead of deleting.`,
      },
      { status: 409 }
    );
  }

  await prisma.reviewer.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
