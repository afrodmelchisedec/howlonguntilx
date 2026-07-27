// FILE: src/app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// PATCH — update name/emoji/description/slug/tools on a category or subcategory.
// `tools` is the full replacement array: [{ slug, label, path }, ...]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  const existing = await prisma.category.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') data.name = body.name;
  if (typeof body.emoji === 'string') data.emoji = body.emoji;
  if (typeof body.description === 'string') data.description = body.description;
  if (Array.isArray(body.tools)) {
    // Light shape validation — each tool needs at least slug + path.
    for (const t of body.tools) {
      if (!t?.slug || !t?.path) {
        return NextResponse.json({ error: 'Each tool needs at least "slug" and "path"' }, { status: 400 });
      }
    }
    data.tools = body.tools;
  }

  let slugChanged = false;
  let newSlug = existing.slug;
  if (typeof body.slug === 'string' && body.slug.trim()) {
    newSlug = slugify(body.slug);
    if (!newSlug) {
      return NextResponse.json({ error: 'Slug cannot be empty after normalization' }, { status: 400 });
    }
    if (newSlug !== existing.slug) {
      const clash = await prisma.category.findUnique({ where: { slug: newSlug } });
      if (clash && clash.id !== params.id) {
        return NextResponse.json({ error: `A category with slug "${newSlug}" already exists` }, { status: 409 });
      }
      data.slug = newSlug;
      slugChanged = true;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  try {
    // If the slug changed, cascade it to every Event's denormalized categorySlug
    // in the same transaction — otherwise events assigned to this category keep
    // pointing sitemap chunks at the old slug (the same drift class fixed in Phase 5).
    const [updated] = await prisma.$transaction([
      prisma.category.update({ where: { id: params.id }, data }),
      ...(slugChanged
        ? [prisma.event.updateMany({ where: { categoryId: params.id }, data: { categorySlug: newSlug } })]
        : []),
    ]);

    revalidatePath('/categories');
    revalidatePath('/admin');
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
}

// DELETE — blocked if anything still references this category/subcategory
// (child subcategories, events, or articles), unless ?reassignTo=<categoryId>
// is provided, in which case references are moved there first.
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = params;
  const reassignTo = req.nextUrl.searchParams.get('reassignTo');

  const [children, eventsAsCategory, eventsAsSubcategory, articlesAsCategory, articlesAsSubcategory] = await Promise.all([
    prisma.category.count({ where: { parentId: id } }),
    prisma.event.count({ where: { categoryId: id } }),
    prisma.event.count({ where: { subcategoryId: id } }),
    prisma.article.count({ where: { categoryId: id } }),
    prisma.article.count({ where: { subcategoryId: id } }),
  ]);

  const totalRefs = children + eventsAsCategory + eventsAsSubcategory + articlesAsCategory + articlesAsSubcategory;

  if (totalRefs > 0 && !reassignTo) {
    return NextResponse.json({
      error: 'This category is still in use and cannot be deleted.',
      references: { children, eventsAsCategory, eventsAsSubcategory, articlesAsCategory, articlesAsSubcategory },
      hint: 'Pass ?reassignTo=<categoryId> to move everything there first, or clear the references manually.',
    }, { status: 409 });
  }

  if (totalRefs > 0 && reassignTo) {
    if (reassignTo === id) {
      return NextResponse.json({ error: 'Cannot reassign a category to itself' }, { status: 400 });
    }
    const target = await prisma.category.findUnique({ where: { id: reassignTo } });
    if (!target) {
      return NextResponse.json({ error: 'reassignTo category does not exist' }, { status: 400 });
    }
    await prisma.$transaction([
      prisma.category.updateMany({ where: { parentId: id }, data: { parentId: reassignTo } }),
      prisma.event.updateMany({ where: { categoryId: id }, data: { categoryId: reassignTo, categorySlug: target.slug } }),
      prisma.event.updateMany({ where: { subcategoryId: id }, data: { subcategoryId: reassignTo } }),
      prisma.article.updateMany({ where: { categoryId: id }, data: { categoryId: reassignTo } }),
      prisma.article.updateMany({ where: { subcategoryId: id }, data: { subcategoryId: reassignTo } }),
    ]);
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  revalidatePath('/categories');
  revalidatePath('/admin');
  return NextResponse.json({ deleted: true });
}
