// FILE: src/app/api/sitemap-static/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: { _count: { select: { events: true, articlesAsCategory: true } } },
    });
    const subcategories = await prisma.category.findMany({
      where: { parentId: { not: null } },
      include: { _count: { select: { eventsAsSubcategory: true, articlesAsSubcategory: true } } },
    });

    // Same thin-content rule as the page-level noindex tags: a category counts
    // as empty only if it AND all its subcategories have nothing; a
    // subcategory counts as empty on its own counts. Keeping these two
    // definitions in sync with generateMetadata in the category pages is
    // what stops Google being pointed at pages we've told it not to index.
    const subsByParent = new Map<string, typeof subcategories>();
    for (const sub of subcategories) {
      if (!sub.parentId) continue;
      const list = subsByParent.get(sub.parentId) ?? [];
      list.push(sub);
      subsByParent.set(sub.parentId, list);
    }
    const isSubEmpty = (sub: (typeof subcategories)[number]) =>
      sub._count.eventsAsSubcategory === 0 && sub._count.articlesAsSubcategory === 0;
    const isCategoryEmpty = (cat: (typeof categories)[number]) =>
      cat._count.events === 0 &&
      cat._count.articlesAsCategory === 0 &&
      (subsByParent.get(cat.id) ?? []).every(isSubEmpty);

    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<url><loc>${BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;
    xml += `<url><loc>${BASE}/categories</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
    xml += `<url><loc>${BASE}/tools</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;

    for (const cat of categories) {
      if (isCategoryEmpty(cat)) continue;
      xml += `<url><loc>${BASE}/categories/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
    }
    for (const sub of subcategories) {
      if (isSubEmpty(sub)) continue;
      const parent = categories.find(c => c.id === sub.parentId);
      if (parent) {
        xml += `<url><loc>${BASE}/categories/${parent.slug}/${sub.slug}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`;
      }
    }

    xml += `</urlset>`;
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    return new NextResponse('Error', { status: 500 });
  }
}
