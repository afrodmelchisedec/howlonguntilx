// FILE: src/app/api/admin/articles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { invalidateArticleCache } from '@/lib/articles';

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
  const data: {
    categoryId?: string | null;
    subcategoryId?: string | null;
    status?: string;
    publishedAt?: Date;
    reviewerId?: string | null;
    reviewEnabled?: boolean;
    reviewedAt?: Date | null;
  } = {};
  if ('categoryId' in body) data.categoryId = body.categoryId || null;
  if ('subcategoryId' in body) data.subcategoryId = body.subcategoryId || null;
  if ('status' in body && (body.status === 'draft' || body.status === 'published')) {
    data.status = body.status;
    if (body.status === 'published' && !article.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  // Reviewer assignment. reviewedAt is derived server-side (not trusted from the
  // client) so it always reflects the moment a reviewer+enabled combo actually
  // went live — this is what powers the "Last reviewed on {date}" public copy.
  if ('reviewerId' in body || 'reviewEnabled' in body) {
    const nextReviewerId = 'reviewerId' in body ? (body.reviewerId || null) : article.reviewerId;
    const nextReviewEnabled = 'reviewEnabled' in body ? !!body.reviewEnabled : article.reviewEnabled;

    if ('reviewerId' in body) data.reviewerId = nextReviewerId;
    if ('reviewEnabled' in body) data.reviewEnabled = nextReviewEnabled;

    const willShowPublicly = !!nextReviewerId && nextReviewEnabled;
    data.reviewedAt = willShowPublicly ? new Date() : null;
  }

  const updated = await prisma.article.update({
    where: { id: params.id },
    data,
    include: { category: true, subcategory: true, reviewer: true },
  });

  revalidatePath(`/tools/${updated.toolSlug}/${updated.slug}`);
  revalidatePath('/categories');
  await invalidateArticleCache(updated.toolSlug, updated.slug);

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
  await invalidateArticleCache(article.toolSlug, article.slug);

  return NextResponse.json({ ok: true });
}