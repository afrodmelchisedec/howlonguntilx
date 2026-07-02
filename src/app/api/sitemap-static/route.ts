import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BASE = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ where: { parentId: null } });
    const subcategories = await prisma.category.findMany({ where: { parentId: { not: null } } });

    let xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    xml += `<url><loc>${BASE}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;
    xml += `<url><loc>${BASE}/categories</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
    xml += `<url><loc>${BASE}/community</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`;

    for (const cat of categories) {
      xml += `<url><loc>${BASE}/categories/${cat.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
    }
    for (const sub of subcategories) {
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
