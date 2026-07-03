// FILE: src/lib/events-admin.ts

import { prisma } from '@/lib/db';

export interface EventUploadItem {
  slug: string;
  name: string;
  description?: string;
  content?: Record<string, unknown>;
  targetDate: string;       // ISO string
  categorySlug: string;     // REQUIRED — no silent default; see note below
  type?: 'COUNTDOWN' | string; // widen if you have more EventType values
  locale?: string;
  published?: boolean;
}

export interface UpsertResult {
  slug: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

/**
 * Single source of truth for writing an Event. Always resolves categoryId
 * from categorySlug via a real lookup, then writes BOTH categoryId and
 * categorySlug from that same resolved category — so the two fields your
 * sitemap routes rely on (relation vs. denormalized string) can never
 * disagree. Never use prisma.event.create/update directly for
 * admin-authored events; always go through this.
 */
export async function upsertEventFromJson(item: EventUploadItem): Promise<UpsertResult> {
  if (!item.slug || !item.name || !item.targetDate || !item.categorySlug) {
    return { slug: item.slug ?? '(missing slug)', status: 'error', error: 'Missing required field: slug, name, targetDate, and categorySlug are all required.' };
  }

  const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
  if (!category) {
    return { slug: item.slug, status: 'error', error: `Category "${item.categorySlug}" does not exist. Create it first or fix the slug.` };
  }

  const targetDate = new Date(item.targetDate);
  if (Number.isNaN(targetDate.getTime())) {
    return { slug: item.slug, status: 'error', error: `Invalid targetDate: "${item.targetDate}"` };
  }

  try {
    const existing = await prisma.event.findUnique({ where: { slug: item.slug } });

    const data = {
      name: item.name,
      description: item.description ?? null,
      content: item.content ?? undefined,
      targetDate,
      categoryId: category.id,
      categorySlug: category.slug, // ← always derived from the same lookup as categoryId, never taken separately from the payload
      published: item.published ?? true,
      locale: item.locale ?? 'en',
    };

    if (existing) {
      await prisma.event.update({ where: { slug: item.slug }, data });
      return { slug: item.slug, status: 'updated' };
    } else {
      await prisma.event.create({ data: { slug: item.slug, ...data } });
      return { slug: item.slug, status: 'created' };
    }
  } catch (err) {
    return { slug: item.slug, status: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
