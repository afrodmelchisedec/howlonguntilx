import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
const CHUNK_SIZE = 5000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const chunk = parseInt(searchParams.get('chunk') ?? '0');

    if (!category) return new NextResponse('Missing category', { status: 400 });

    const events = await prisma.event.findMany({
      where: { categorySlug: category, published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: CHUNK_SIZE,
      skip: chunk * CHUNK_SIZE,
    });

    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    for (const ev of events) {
      xml += `<url><loc>${BASE}/how-long-until-${ev.slug}</loc><lastmod>${ev.updatedAt.toISOString()}</lastmod><changefreq>hourly</changefreq><priority>0.8</priority></url>`;
    }
    xml += `</urlset>`;

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (e) {
    return new NextResponse('Error', { status: 500 });
  }
}
