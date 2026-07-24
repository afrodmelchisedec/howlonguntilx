import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';
const CHUNK_SIZE = 5000;

export async function GET() {
  try {
    // Group by categorySlug (the field every Event row + page actually uses),
    // not categoryId (an FK relation that's never populated in this app).
    const grouped = await prisma.event.groupBy({
      by: ['categorySlug'],
      where: { published: true },
      _count: { _all: true },
      _max: { updatedAt: true },
    });

    const staticLastmod = (await prisma.category.aggregate({ _max: { createdAt: true } }))._max.createdAt ?? new Date();
    const articlesMax = (await prisma.article.aggregate({ where: { status: 'published' }, _max: { updatedAt: true } }))._max.updatedAt;

    let xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<sitemap><loc>${BASE}/api/sitemap-static</loc><lastmod>${staticLastmod.toISOString()}</lastmod></sitemap>`;

    if (articlesMax) {
      xml += `<sitemap><loc>${BASE}/api/sitemap-articles</loc><lastmod>${articlesMax.toISOString()}</lastmod></sitemap>`;
    }

    for (const g of grouped) {
      const count = g._count._all;
      const lastmod = (g._max.updatedAt ?? new Date()).toISOString();
      const chunks = Math.ceil(count / CHUNK_SIZE) || 1;
      for (let i = 0; i < chunks; i++) {
        xml += `<sitemap><loc>${BASE}/api/sitemap-chunk?category=${g.categorySlug}&amp;chunk=${i}</loc><lastmod>${lastmod}</lastmod></sitemap>`;
      }
    }

    xml += `</sitemapindex>`;
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    console.error('sitemap-index error:', e);
    return new NextResponse('Error', { status: 500 });
  }
}
