// FILE: src/app/api/admin/events/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: { categoryId?: string | null; subcategoryId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only touch fields that were actually sent, same convention as the articles PATCH route.
  const data: { categoryId?: string | null; subcategoryId?: string | null; categorySlug?: string } = {};

  if ('categoryId' in body) {
    const categoryId = body.categoryId || null;
    data.categoryId = categoryId;
    // categorySlug is the denormalized field sitemap-index/sitemap-chunk group events by.
    // It must stay in sync with categoryId here, the same way upsertEventFromJson keeps
    // it in sync on import — otherwise recategorizing an event from this dropdown silently
    // leaves it in the wrong sitemap chunk even though the DB relation is correct.
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      data.categorySlug = category?.slug ?? 'leisure';
    } else {
      data.categorySlug = 'leisure';
    }
  }
  if ('subcategoryId' in body) data.subcategoryId = body.subcategoryId || null;

  const updated = await prisma.event.update({
    where: { id: params.id },
    data,
    include: { category: true, subcategory: true },
  });

  revalidatePath('/admin');
  revalidatePath('/categories');

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.event.delete({ where: { id: params.id } });

  revalidatePath('/admin');
  revalidatePath('/categories');

  return NextResponse.json({ ok: true });
}
