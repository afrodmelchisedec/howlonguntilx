// FILE: src/app/api/admin/categories/route.ts
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

// GET — full tree (top-level categories with their subcategories nested), tools included.
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const all = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true, slug: true, name: true, emoji: true, description: true,
      parentId: true, tools: true,
      _count: {
        select: {
          events: true, eventsAsSubcategory: true,
          articlesAsCategory: true, articlesAsSubcategory: true,
          children: true,
        },
      },
    },
  });

  const topLevel = all.filter(c => !c.parentId).map(c => ({
    ...c,
    children: all.filter(sub => sub.parentId === c.id),
  }));

  return NextResponse.json({ categories: topLevel });
}

// POST — create a new top-level category or subcategory.
// Body: { name, emoji, description?, parentId? (omit/null = top-level) }
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.emoji) {
    return NextResponse.json({ error: 'name and emoji are required' }, { status: 400 });
  }

  const slug = slugify(body.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: `A category with slug "${slug}" already exists` }, { status: 409 });
  }

  const created = await prisma.category.create({
    data: {
      slug,
      name: body.name,
      emoji: body.emoji,
      description: body.description ?? '',
      parentId: body.parentId ?? null,
      tools: body.tools ?? [],
    },
  });

  revalidatePath('/categories');
  revalidatePath('/admin');
  return NextResponse.json(created, { status: 201 });
}
