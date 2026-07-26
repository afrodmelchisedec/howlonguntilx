// FILE: src/app/api/admin/articles/[id]/route.ts
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

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const data: { categoryId?: string | null; subcategoryId?: string | null; status?: string; publishedAt?: Date } = {};
  if ('categoryId' in body) data.categoryId = body.categoryId || null;
  if ('subcategoryId' in body) data.subcategoryId = body.subcategoryId || null;
  if ('status' in body && (body.status === 'draft' || body.status === 'published')) {
    data.status = body.status;
    if (body.status === 'published' && !article.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const updated = await prisma.article.update({ where: { id: params.id }, data });

  revalidatePath(`/tools/${updated.toolSlug}/${updated.slug}`);
  revalidatePath('/categories');

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.article.delete({ where: { id: params.id } });

  revalidatePath(`/tools/${article.toolSlug}`);
  revalidatePath('/sitemap.xml');

  return NextResponse.json({ ok: true });
}
