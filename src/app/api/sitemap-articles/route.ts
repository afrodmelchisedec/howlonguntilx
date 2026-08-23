import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { status: 'published' },
      select: { toolSlug: true, slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 50000,
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const a of articles) {
      // 'questions'-tool articles now live under the merged /questions/[slug]
      // route (see questions-merge roadmap); every other tool keeps its
      // existing /tools/<toolSlug>/<slug> path untouched.
      const loc = a.toolSlug === 'questions'
        ? `${BASE}/questions/${a.slug}`
        : `${BASE}/tools/${a.toolSlug}/${a.slug}`;
      xml += `<url><loc>${loc}</loc><lastmod>${a.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
    }
    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    console.error('sitemap-articles error:', e);
    return new NextResponse('Error', { status: 500 });
  }
}
