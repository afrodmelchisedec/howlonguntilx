// FILE: src/app/api/admin/events/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pingIndexNow } from '@/lib/indexnow';
import type { Prisma } from '@prisma/client';
import type { EventContent } from '@/lib/seo';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';

async function isAdmin(req: NextRequest) {
  // Allow server-to-server calls (the SEO pipeline script, or the admin
  // dashboard's own server actions) via a shared secret, in addition to a
  // real ADMIN browser session. Never accept the token over a non-HTTPS
  // origin in production — set SEO_PIPELINE_TOKEN in .env.local only.
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline', name: 'SEO Pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

interface EventImportItem {
  slug: string;
  name?: string;
  targetDate?: string; // ISO date string
  description?: string;
  categorySlug?: string;
  heroImageUrl?: string;
  heroImageAlt?: string;
  authorName?: string;
  reviewerName?: string;
  reviewerCredentials?: string;
  content?: EventContent;
}

interface ImportResult {
  slug: string;
  status: 'updated' | 'created' | 'error';
  error?: string;
}

export async function POST(req: NextRequest) {
  const session = await isAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let items: EventImportItem[];
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) {
      throw new Error('Payload must be an array of event items, or an object with an "items" array.');
    }
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Invalid JSON payload'
    }, { status: 400 });
  }

  const results: ImportResult[] = [];
  const publishedUrls: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.slug) {
      results.push({
        slug: item.slug ?? '(missing slug)',
        status: 'error',
        error: 'Missing required field: slug.'
      });
      continue;
    }

    if (item.heroImageUrl && !item.heroImageAlt) {
      results.push({
        slug: item.slug,
        status: 'error',
        error: 'heroImageUrl was provided but heroImageAlt is missing — every custom image needs descriptive alt text.'
      });
      continue;
    }

    try {
      const existing = await prisma.event.findUnique({
        where: { slug: item.slug }
      });

      if (!existing) {
        if (!item.name || !item.targetDate) {
          results.push({
            slug: item.slug,
            status: 'error',
            error: `No Event found with slug "${item.slug}", and no "name"/"targetDate" were provided to create one. Either create the event first in the admin UI, or include "name" and "targetDate" (ISO date) in the import JSON so it can be created.`,
          });
          continue;
        }

        const targetDate = new Date(item.targetDate);
        if (isNaN(targetDate.getTime())) {
          results.push({
            slug: item.slug,
            status: 'error',
            error: `"targetDate" for "${item.slug}" is not a valid date: "${item.targetDate}".`,
          });
          continue;
        }

        const created = await prisma.event.create({
          data: {
            slug: item.slug,
            name: item.name,
            description: item.description,
            targetDate,
            categorySlug: item.categorySlug ?? 'leisure',
            heroImageUrl: item.heroImageUrl,
            heroImageAlt: item.heroImageAlt,
            ...(item.authorName !== undefined ? { authorName: item.authorName } : {}),
            reviewerName: item.reviewerName,
            reviewerCredentials: item.reviewerCredentials,
            content: item.content !== undefined ? (item.content as Prisma.InputJsonValue) : undefined,
          },
        });

        results.push({ slug: item.slug, status: 'created' });
        revalidatePath(`/questions/how-long-until-${item.slug}`);
        publishedUrls.push(`${BASE}/questions/how-long-until-${item.slug}`);
        continue;
      }

      const data: Prisma.EventUpdateInput = {};
      if (item.heroImageUrl !== undefined) data.heroImageUrl = item.heroImageUrl;
      if (item.heroImageAlt !== undefined) data.heroImageAlt = item.heroImageAlt;
      if (item.authorName !== undefined) data.authorName = item.authorName;
      if (item.reviewerName !== undefined) data.reviewerName = item.reviewerName;
      if (item.reviewerCredentials !== undefined) data.reviewerCredentials = item.reviewerCredentials;
      if (item.content !== undefined) {
        data.content = item.content as Prisma.InputJsonValue;
      }

      const updated = await prisma.event.update({
        where: { slug: item.slug },
        data
      });

      results.push({ slug: item.slug, status: 'updated' });

      revalidatePath(`/questions/how-long-until-${item.slug}`);
      publishedUrls.push(`${BASE}/questions/how-long-until-${item.slug}`);
    } catch (err) {
      results.push({
        slug: item.slug,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error'
      });
    }
  }

  revalidatePath('/sitemap.xml');
  if (publishedUrls.length > 0) {
    await pingIndexNow(publishedUrls);
  }

  const updated = results.filter(r => r.status === 'updated').length;
  const created = results.filter(r => r.status === 'created').length;
  const failed = results.filter(r => r.status === 'error');

  return NextResponse.json({
    updated,
    created,
    failed: failed.map(f => ({ slug: f.slug, error: f.error })),
    errors: failed
  });
}
