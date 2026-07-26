// FILE: src/app/api/admin/articles/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pingIndexNow } from '@/lib/indexnow';
import type { Prisma } from '@prisma/client';

const TOOL_SLUG = 'questions';
const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

interface QuestionImportItem {
  slug: string;
  motherQuestion: string;
  shortAnswer?: string;
  heroData?: Record<string, unknown>;
  blocks: unknown[];
  faqs?: { q: string; a: string }[];
  sources?: { label: string; url: string }[];
}

interface ImportResult {
  slug: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

function buildBlocks(item: QuestionImportItem): unknown[] {
  const blocks = [...(item.blocks ?? [])];
  if (item.faqs && item.faqs.length > 0) {
    blocks.push({ type: 'faq', items: item.faqs.map(f => ({ q: f.q, a: f.a })) });
  }
  return blocks;
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let items: QuestionImportItem[];
  try {
    const body = await req.json();
    items = Array.isArray(body) ? body : body.items;
    if (!Array.isArray(items)) throw new Error('Payload must be an array of question items, or an object with an "items" array.');
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Invalid JSON payload' }, { status: 400 });
  }

  const results: ImportResult[] = [];
  const publishedUrls: string[] = [];

  for (const item of items) {
    if (!item.slug || !item.motherQuestion || !Array.isArray(item.blocks)) {
      results.push({
        slug: item.slug ?? '(missing slug)',
        status: 'error',
        error: 'Missing required field: slug, motherQuestion, and blocks are all required.',
      });
      continue;
    }

    try {
      const existing = await prisma.article.findUnique({
        where: { toolSlug_slug: { toolSlug: TOOL_SLUG, slug: item.slug } },
      });

      const data = {
        title: item.motherQuestion,
        dek: item.shortAnswer ?? '',
        blocks: buildBlocks(item) as Prisma.InputJsonValue,
        heroData: (item.heroData ?? null) as Prisma.InputJsonValue,
        contentType: 'evergreen',
      };

      if (existing) {
        await prisma.article.update({
          where: { toolSlug_slug: { toolSlug: TOOL_SLUG, slug: item.slug } },
          data,
        });
        results.push({ slug: item.slug, status: 'updated' });
      } else {
        await prisma.article.create({
          data: {
            toolSlug: TOOL_SLUG,
            slug: item.slug,
            status: 'draft',
            categoryId: null,
            subcategoryId: null,
            heroImageUrl: null,
            heroImageAlt: null,
            ...data,
          },
        });
        results.push({ slug: item.slug, status: 'created' });
      }

      revalidatePath(`/tools/${TOOL_SLUG}/${item.slug}`);
      publishedUrls.push(`${BASE}/tools/${TOOL_SLUG}/${item.slug}`);
    } catch (err) {
      results.push({
        slug: item.slug,
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  revalidatePath(`/tools/${TOOL_SLUG}`);
  revalidatePath('/sitemap.xml');
  if (publishedUrls.length > 0) {
    await pingIndexNow(publishedUrls);
  }

  const created = results.filter(r => r.status === 'created').length;
  const updated = results.filter(r => r.status === 'updated').length;
  const failed = results.filter(r => r.status === 'error');

  return NextResponse.json({ created, updated, failed, errors: failed });
}
