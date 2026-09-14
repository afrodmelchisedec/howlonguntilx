// FILE: src/app/api/admin/events/bulk-delete/route.ts
//
// ONE-TIME cleanup route. Deletes a fixed list of stale/duplicate Event rows,
// purges their Redis cache entries, and revalidates the paths that would
// otherwise keep serving a stale 200. Delete this file once you've run it —
// it's not meant to be a permanent endpoint.
//
// Usage:
//   curl -X POST https://howlonguntilx.com/api/admin/events/bulk-delete \
//     -H "Authorization: Bearer $SEO_PIPELINE_TOKEN"
//
// (or hit it from an authenticated admin browser session instead of the token)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { invalidateEventCache } from '@/lib/events';

// Same dual-auth pattern as src/app/api/admin/events/import/route.ts, so this
// can be curled directly with SEO_PIPELINE_TOKEN instead of needing a browser session.
async function isAdmin(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token && process.env.SEO_PIPELINE_TOKEN && token === process.env.SEO_PIPELINE_TOKEN) {
    return { user: { role: 'ADMIN', id: 'seo-pipeline', name: 'SEO Pipeline' } };
  }
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

// The 13 confirmed-stale slugs (bare DB slug, no "how-long-until-" prefix):
// 11 yearly Christmas/Easter duplicates now redundant thanks to the evergreen
// bare-slug pages' recurrenceKey, + 2 rows whose slug was itself already a
// full phrase, producing the ugly "how-long-until-how-many-days-..." double-up.
const SLUGS_TO_DELETE = [
  'christmas-2026',
  'christmas-2027',
  'christmas-2028',
  'christmas-2029',
  'christmas-2030',
  'christmas-2031',
  'easter-2027',
  'easter-2028',
  'easter-2029',
  'easter-2030',
  'easter-2031',
  'how-many-days-until-january-1',
  'how-many-days-ago-was-2020',
];

interface DeleteResult {
  slug: string;
  status: 'deleted' | 'not_found' | 'error';
  error?: string;
}

export async function POST(req: NextRequest) {
  const session = await isAdmin(req);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: DeleteResult[] = [];

  for (const slug of SLUGS_TO_DELETE) {
    try {
      const existing = await prisma.event.findUnique({ where: { slug } });
      if (!existing) {
        results.push({ slug, status: 'not_found' });
        continue;
      }

      await prisma.event.delete({ where: { slug } });

      // Purge Redis (event:slug:<slug>) so getEventBySlug() can't keep
      // serving a cached hit for a row that no longer exists in the DB.
      await invalidateEventCache(slug);

      // Both the unified route and the legacy root-level route need
      // revalidating — the legacy one is a no-op if that route already 404s.
      revalidatePath(`/questions/how-long-until-${slug}`);
      revalidatePath(`/how-long-until-${slug}`);

      results.push({ slug, status: 'deleted' });
    } catch (err) {
      results.push({
        slug,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // sitemap-chunk is force-dynamic + revalidate:0, so it re-queries Prisma on
  // every request already — no Next-side cache to bust there. Its
  // `Cache-Control: max-age=600` is a CDN/browser header, so a stale copy can
  // linger up to 10 minutes at the edge even after this runs; that's expected.
  revalidatePath('/sitemap.xml');

  const deleted = results.filter(r => r.status === 'deleted').length;
  const notFound = results.filter(r => r.status === 'not_found').length;
  const errors = results.filter(r => r.status === 'error');

  return NextResponse.json({ deleted, notFound, errors, results });
}
