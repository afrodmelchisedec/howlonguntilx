import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
const CHUNK_SIZE = 5000;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      select: { slug: true, _count: { select: { events: true } } },
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<sitemap><loc>${BASE}/api/sitemap-static</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;

    for (const cat of categories) {
      const chunks = Math.ceil(cat._count.events / CHUNK_SIZE) || 1;
      for (let i = 0; i < chunks; i++) {
        xml += `<sitemap><loc>${BASE}/api/sitemap-chunk?category=${cat.slug}&amp;chunk=${i}</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`;
      }
    }

    xml += `</sitemapindex>`;
    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    return new NextResponse('Error', { status: 500 });
  }
}
