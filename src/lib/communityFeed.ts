// FILE: src/lib/communityFeed.ts
import { Prisma } from '@prisma/client';
import { prisma } from './db';

export type FeedSort = 'anticipated' | 'engagement' | 'recent';

export interface FeedParams {
  sort: FeedSort;
  categorySlug?: string;
  q?: string;
  cursor?: string;
  take?: number;
}

export interface FeedItemRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetDate: Date;
  images: unknown;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: Date;
  author: { id: string; name: string | null; username: string | null; image: string | null } | null;
  category: { slug: string; name: string; emoji: string } | null;
}

const DEFAULT_TAKE = 12;

function orderByForSort(sort: 'anticipated' | 'recent') {
  return sort === 'anticipated'
    ? [{ targetDate: 'asc' as const }, { id: 'asc' as const }]
    : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
}

// 'anticipated' and 'recent' use native Prisma cursor pagination — both
// order by a real, indexable column with id as tiebreaker, no computed value.
async function getNativeSortedFeed(sort: 'anticipated' | 'recent', params: FeedParams) {
  const { categorySlug, q, cursor, take = DEFAULT_TAKE } = params;

  const where: any = { visibility: 'PUBLIC', moderationStatus: 'APPROVED', author: { blockedAt: null } };
  if (categorySlug) where.category = { slug: categorySlug };
  if (q && q.trim().length >= 2) {
    const term = q.trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.userEvent.findMany({
    where,
    orderBy: orderByForSort(sort),
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true, slug: true, title: true, description: true, targetDate: true,
      images: true, likeCount: true, commentCount: true, viewCount: true, createdAt: true,
      author: { select: { id: true, name: true, username: true, image: true } },
      category: { select: { slug: true, name: true, emoji: true } },
    },
  });

  const hasMore = rows.length > take;
  const items = hasMore ? rows.slice(0, take) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

// 'engagement' — TRUE summed (likeCount + commentCount) ranking, via raw SQL,
// since Prisma can't orderBy a computed sum natively. Keyset-paginated on
// (score, id) so pages stay stable as new likes/comments land between requests.
async function getEngagementFeed(params: FeedParams) {
  const { categorySlug, q, cursor, take = DEFAULT_TAKE } = params;

  let cursorScore: number | null = null;
  let cursorId: string | null = null;
  if (cursor) {
    const cursorRow = await prisma.userEvent.findUnique({
      where: { id: cursor },
      select: { likeCount: true, commentCount: true },
    });
    // Cursor row vanished (removed/deleted) between page loads — fall back
    // to an unfiltered continuation rather than erroring. Minor edge case:
    // could reshow a couple of already-seen items in that scenario.
    if (cursorRow) {
      cursorScore = cursorRow.likeCount + cursorRow.commentCount;
      cursorId = cursor;
    }
  }

  const conditions: Prisma.Sql[] = [
    Prisma.sql`ue."visibility" = 'PUBLIC'`,
    Prisma.sql`ue."moderationStatus" = 'APPROVED'`,
    Prisma.sql`u."blockedAt" IS NULL`,
  ];
  if (categorySlug) {
    conditions.push(Prisma.sql`c."slug" = ${categorySlug}`);
  }
  if (q && q.trim().length >= 2) {
    const term = `%${q.trim()}%`;
    conditions.push(Prisma.sql`(ue."title" ILIKE ${term} OR ue."description" ILIKE ${term})`);
  }
  if (cursorScore !== null && cursorId !== null) {
    conditions.push(Prisma.sql`(
      (ue."likeCount" + ue."commentCount") < ${cursorScore}
      OR ((ue."likeCount" + ue."commentCount") = ${cursorScore} AND ue."id" < ${cursorId})
    )`);
  }
  const whereClause = Prisma.join(conditions, ' AND ');

  const rows = await prisma.$queryRaw<Array<{
    id: string; slug: string; title: string; description: string; targetDate: Date;
    images: unknown; likeCount: number; commentCount: number; viewCount: number; createdAt: Date;
    authorId: string | null; authorName: string | null; authorUsername: string | null; authorImage: string | null;
    categorySlug: string | null; categoryName: string | null; categoryEmoji: string | null;
  }>>(Prisma.sql`
    SELECT ue."id", ue."slug", ue."title", ue."description", ue."targetDate", ue."images",
      ue."likeCount", ue."commentCount", ue."viewCount", ue."createdAt",
      u."id" AS "authorId", u."name" AS "authorName", u."username" AS "authorUsername", u."image" AS "authorImage",
      c."slug" AS "categorySlug", c."name" AS "categoryName", c."emoji" AS "categoryEmoji"
    FROM "UserEvent" ue
    LEFT JOIN "User" u ON u."id" = ue."authorId"
    LEFT JOIN "Category" c ON c."id" = ue."categoryId"
    WHERE ${whereClause}
    ORDER BY (ue."likeCount" + ue."commentCount") DESC, ue."id" DESC
    LIMIT ${take + 1}
  `);

  const hasMore = rows.length > take;
  const sliced = hasMore ? rows.slice(0, take) : rows;
  const items: FeedItemRow[] = sliced.map(r => ({
    id: r.id, slug: r.slug, title: r.title, description: r.description, targetDate: r.targetDate,
    images: r.images, likeCount: r.likeCount, commentCount: r.commentCount, viewCount: r.viewCount,
    createdAt: r.createdAt,
    author: r.authorId ? { id: r.authorId, name: r.authorName, username: r.authorUsername, image: r.authorImage } : null,
    category: r.categorySlug ? { slug: r.categorySlug, name: r.categoryName ?? '', emoji: r.categoryEmoji ?? '' } : null,
  }));

  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function getCommunityFeed(params: FeedParams) {
  if (params.sort === 'engagement') return getEngagementFeed(params);
  return getNativeSortedFeed(params.sort, params);
}

export interface CategoryPill {
  slug: string;
  name: string;
  emoji: string;
}

// Non-empty category pills for the community feed filter — only
// categories that have at least one live PUBLIC/APPROVED UserEvent.
// Extracted here (rather than left inline in the API route) so the
// server-rendered community/page.tsx can call it directly too.
export async function getCommunityCategories(): Promise<CategoryPill[]> {
  const categories = await prisma.category.findMany({
    where: { userEvents: { some: { visibility: 'PUBLIC', moderationStatus: 'APPROVED' } } },
    select: { slug: true, name: true, emoji: true },
    orderBy: { name: 'asc' },
  });
  return categories;
}
