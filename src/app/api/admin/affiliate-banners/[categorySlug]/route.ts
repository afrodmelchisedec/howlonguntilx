// FILE: src/app/api/admin/affiliate-banners/[categorySlug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// Page-level banner slots that aren't backed by a real Category row. Kept as
// an explicit allowlist (not "any unrecognized slug passes") so a typo in the
// category slug still fails loudly instead of silently creating orphan rows.
const RESERVED_PAGE_SLUGS = ['tools'];

// PATCH — upsert the banner for a given category slug, or a reserved page slug.
// Body: { title, description, ctaLabel?, href, imageUrl?, active? }
export async function PATCH(req: NextRequest, { params }: { params: { categorySlug: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });

  if (!body.title || !body.description || !body.href) {
    return NextResponse.json({ error: 'title, description, and href are required' }, { status: 400 });
  }

  try {
    new URL(body.href);
  } catch {
    return NextResponse.json({ error: 'href must be a valid absolute URL' }, { status: 400 });
  }

  const isReservedPageSlug = RESERVED_PAGE_SLUGS.includes(params.categorySlug);
  if (!isReservedPageSlug) {
    const category = await prisma.category.findUnique({ where: { slug: params.categorySlug } });
    if (!category) {
      return NextResponse.json({ error: `No category with slug "${params.categorySlug}"` }, { status: 404 });
    }
  }

  const data = {
    title: body.title,
    description: body.description,
    ctaLabel: body.ctaLabel || 'Learn more',
    href: body.href,
    imageUrl: body.imageUrl ?? null,
    active: typeof body.active === 'boolean' ? body.active : true,
  };

  const banner = await prisma.affiliateBanner.upsert({
    where: { categorySlug: params.categorySlug },
    update: data,
    create: { categorySlug: params.categorySlug, ...data },
  });

  revalidatePath('/categories');
  revalidatePath('/tools');
  revalidatePath('/admin');
  return NextResponse.json(banner);
}

// DELETE — remove the banner for a category or reserved page slug (falls back to no banner shown).
export async function DELETE(req: NextRequest, { params }: { params: { categorySlug: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.affiliateBanner.delete({ where: { categorySlug: params.categorySlug } });
  } catch {
    return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
  }

  revalidatePath('/categories');
  revalidatePath('/tools');
  revalidatePath('/admin');
  return NextResponse.json({ deleted: true });
}
