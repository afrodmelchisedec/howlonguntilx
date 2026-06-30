import { NextResponse } from 'next/server';
import { getAllEventSlugs } from '@/lib/events';

export async function GET() {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const slugs = await getAllEventSlugs();
  const urls = [
    `<url><loc>${base}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...slugs.map(s =>
      `<url><loc>${base}/how-long-until-${s}</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>`
    ),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } });
}
