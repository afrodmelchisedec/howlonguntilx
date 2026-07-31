// FILE: src/app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';
import { checkApiCredits, creditHeaders } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  // Burst protection — search wasn't rate-limited before; now that it's a
  // documented public endpoint, it gets the same guard as Countdown.
  const limited = await rateLimit(req);
  if (limited) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const access = await checkApiCredits(req);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) return NextResponse.json([], { headers: creditHeaders(access) });

  const [events, articles] = await Promise.all([
    prisma.event.findMany({
      where: {
        published: true,
        archived: false,
        name: { contains: q, mode: 'insensitive' },
      },
      select: { slug: true, name: true, categorySlug: true, views: true },
      orderBy: { views: 'desc' },
      take: 5,
    }),
    prisma.article.findMany({
      where: {
        status: 'published',
        title: { contains: q, mode: 'insensitive' },
      },
      select: {
        slug: true,
        title: true,
        toolSlug: true,
        likeCount: true,
        category: { select: { slug: true } },
      },
      orderBy: { likeCount: 'desc' },
      take: 5,
    }),
  ]);

  const eventResults = events.map(e => ({
    slug: e.slug,
    name: e.name,
    category: e.categorySlug,
    type: 'event' as const,
    href: `/how-long-until-${e.slug}`,
  }));

  const articleResults = articles.map(a => ({
    slug: a.slug,
    name: a.title,
    category: a.category?.slug ?? 'general',
    type: 'article' as const,
    href: `/tools/${a.toolSlug}/${a.slug}`,
  }));

  const combined = [...eventResults, ...articleResults].slice(0, 8);
  return NextResponse.json(combined, { headers: creditHeaders(access) });
}
