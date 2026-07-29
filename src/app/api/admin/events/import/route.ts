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

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

interface EventImportItem {
  slug: string;
  // Required only when the slug doesn't match an existing event yet —
  // used to CREATE the base row before attaching rich content to it.
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
  console.log('=== EVENT IMPORT STARTED ===');
  
  const session = await isAdmin();
  if (!session) {
    console.log('❌ Unauthorized - no admin session');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  console.log('✅ Admin authorized:', session.user.email);

  let items: EventImportItem[];
  try {
    const body = await req.json();
    console.log('📦 Raw request body type:', typeof body);
    console.log('📦 Raw request body:', JSON.stringify(body).substring(0, 500));
    
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) {
      console.log('❌ Payload is not an array');
      throw new Error('Payload must be an array of event items, or an object with an "items" array.');
    }
    console.log(`✅ Parsed ${items.length} items from payload`);
  } catch (e) {
    console.error('❌ Failed to parse JSON:', e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : 'Invalid JSON payload' 
    }, { status: 400 });
  }

  const results: ImportResult[] = [];
  const publishedUrls: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n--- Processing item ${i + 1}/${items.length} ---`);
    console.log('Item slug:', item.slug);

    if (!item.slug) {
      console.log('❌ Missing slug');
      results.push({ 
        slug: item.slug ?? '(missing slug)', 
        status: 'error', 
        error: 'Missing required field: slug.' 
      });
      continue;
    }

    if (item.heroImageUrl && !item.heroImageAlt) {
      console.log('❌ heroImageUrl without alt text');
      results.push({ 
        slug: item.slug, 
        status: 'error', 
        error: 'heroImageUrl was provided but heroImageAlt is missing — every custom image needs descriptive alt text.' 
      });
      continue;
    }

    try {
      console.log(`🔍 Looking for event with slug: "${item.slug}"`);
      const existing = await prisma.event.findUnique({ 
        where: { slug: item.slug } 
      });
      
      if (!existing) {
        console.log(`⚠️ No event found with slug: "${item.slug}"`);

        // No matching row — the item can only be CREATED if enough base
        // data (name + targetDate) was supplied. Otherwise this is the
        // classic "content JSON for an event that hasn't been created yet"
        // mistake, so return a clear, actionable error.
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

        console.log(`➕ Creating new event with slug: "${item.slug}"`);
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
        console.log(`✅ Created event: "${created.name}" (${created.slug})`);

        results.push({ slug: item.slug, status: 'created' });
        revalidatePath(`/how-long-until-${item.slug}`);
        publishedUrls.push(`${BASE}/how-long-until-${item.slug}`);
        continue;
      }
      console.log(`✅ Found event: "${existing.name}" (ID: ${existing.id})`);

      const data: Prisma.EventUpdateInput = {};
      if (item.heroImageUrl !== undefined) data.heroImageUrl = item.heroImageUrl;
      if (item.heroImageAlt !== undefined) data.heroImageAlt = item.heroImageAlt;
      if (item.authorName !== undefined) data.authorName = item.authorName;
      if (item.reviewerName !== undefined) data.reviewerName = item.reviewerName;
      if (item.reviewerCredentials !== undefined) data.reviewerCredentials = item.reviewerCredentials;
      if (item.content !== undefined) {
        console.log('📝 Setting content (body length:', item.content.body?.length || 0, ')');
        data.content = item.content as Prisma.InputJsonValue;
      }

      console.log('💾 Updating event...');
      const updated = await prisma.event.update({ 
        where: { slug: item.slug }, 
        data 
      });
      console.log(`✅ Updated event: "${updated.name}" (${updated.slug})`);
      
      results.push({ slug: item.slug, status: 'updated' });

      revalidatePath(`/how-long-until-${item.slug}`);
      publishedUrls.push(`${BASE}/how-long-until-${item.slug}`);
    } catch (err) {
      console.error(`❌ Error updating ${item.slug}:`, err);
      results.push({ 
        slug: item.slug, 
        status: 'error', 
        error: err instanceof Error ? err.message : 'Unknown error' 
      });
    }
  }

  console.log('\n=== IMPORT RESULTS ===');
  console.log('✅ Updated:', results.filter(r => r.status === 'updated').length);
  console.log('➕ Created:', results.filter(r => r.status === 'created').length);
  console.log('❌ Failed:', results.filter(r => r.status === 'error').length);
  results.filter(r => r.status === 'error').forEach(r => {
    console.log(`  - ${r.slug}: ${r.error}`);
  });

  revalidatePath('/sitemap.xml');
  if (publishedUrls.length > 0) {
    console.log(`🔔 Pinging IndexNow for ${publishedUrls.length} URLs`);
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