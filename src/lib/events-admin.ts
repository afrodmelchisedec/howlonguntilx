// FILE: src/lib/events-admin.ts

import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export interface EventUploadItem {
  slug: string;
  name: string;
  description?: string;
  content?: Record<string, unknown>;
  targetDate: string;
  categorySlug: string;
  type?: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE';
  locale?: string;
  published?: boolean;
  archived?: boolean;
}

export interface UpsertResult {
  slug: string;
  status: 'created' | 'updated' | 'error';
  error?: string;
}

export async function upsertEventFromJson(item: EventUploadItem): Promise<UpsertResult> {
  if (!item.slug || !item.name || !item.targetDate || !item.categorySlug) {
    return {
      slug: item.slug ?? '(missing slug)',
      status: 'error',
      error: 'Missing required field: slug, name, targetDate, and categorySlug are all required.',
    };
  }

  const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });
  if (!category) {
    return {
      slug: item.slug,
      status: 'error',
      error: `Category "${item.categorySlug}" does not exist. Create it first or fix the slug.`,
    };
  }

  const targetDate = new Date(item.targetDate);
  if (Number.isNaN(targetDate.getTime())) {
    return {
      slug: item.slug,
      status: 'error',
      error: `Invalid targetDate: "${item.targetDate}"`,
    };
  }

  try {
    const existing = await prisma.event.findUnique({ where: { slug: item.slug } });

    const data = {
      name: item.name,
      description: item.description ?? null,
      targetDate,
      categoryId: category.id,
      categorySlug: category.slug,
      published: item.published ?? true,
      archived: item.archived ?? false,
      locale: item.locale ?? 'en',
      ...(item.type ? { type: item.type } : {}),
      ...(item.content !== undefined ? { content: item.content as Prisma.InputJsonValue } : {}),
    };

    if (existing) {
      await prisma.event.update({ where: { slug: item.slug }, data });
      return { slug: item.slug, status: 'updated' };
    } else {
      await prisma.event.create({ data: { slug: item.slug, ...data } });
      return { slug: item.slug, status: 'created' };
    }
  } catch (err) {
    return {
      slug: item.slug,
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
