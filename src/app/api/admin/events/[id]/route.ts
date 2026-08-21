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

  let body: {
    categoryId?: string | null;
    subcategoryId?: string | null;
    reviewerId?: string | null;
    reviewEnabled?: boolean;
    published?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Only touch fields that were actually sent, same convention as the articles PATCH route.
  const data: {
    categoryId?: string | null;
    subcategoryId?: string | null;
    categorySlug?: string;
    reviewerId?: string | null;
    reviewEnabled?: boolean;
    reviewedAt?: Date | null;
    published?: boolean;
    publishedAt?: Date | null;
  } = {};

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

  // Reviewer assignment. reviewedAt is derived server-side (not trusted from the
  // client) so it always reflects the moment a reviewer+enabled combo actually
  // went live — this is what powers the "Last reviewed on {date}" public copy.
  if ('reviewerId' in body || 'reviewEnabled' in body) {
    const nextReviewerId = 'reviewerId' in body ? (body.reviewerId || null) : event.reviewerId;
    const nextReviewEnabled = 'reviewEnabled' in body ? !!body.reviewEnabled : event.reviewEnabled;

    if ('reviewerId' in body) data.reviewerId = nextReviewerId;
    if ('reviewEnabled' in body) data.reviewEnabled = nextReviewEnabled;

    const willShowPublicly = !!nextReviewerId && nextReviewEnabled;
    data.reviewedAt = willShowPublicly ? new Date() : null;
  }

  // Publish/unpublish toggle, same convention as Articles: the boolean flips
  // freely, but publishedAt is a one-time stamp — set the first time an event
  // goes live, then left alone across later unpublish/republish cycles so the
  // "Published {date}" tooltip always reflects the original publish date.
  if ('published' in body) {
    const nextPublished = !!body.published;
    data.published = nextPublished;
    if (nextPublished && !event.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  const updated = await prisma.event.update({
    where: { id: params.id },
    data,
    include: { category: true, subcategory: true, reviewer: true },
  });

  revalidatePath('/users');
  revalidatePath('/categories');
  revalidatePath('/how-long-until-' + updated.slug);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.event.delete({ where: { id: params.id } });

  revalidatePath('/users');
  revalidatePath('/categories');

  return NextResponse.json({ ok: true });
}