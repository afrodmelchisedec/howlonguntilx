// FILE: src/lib/questionsFeed.ts
import { prisma } from './db';

// Merged Article+Event feed for the /questions listing page. Two
// independently cursor-paginated queries (native Prisma cursor pagination
// per model), merged in application code — see questions-merge roadmap
// Phase F notes for why this was chosen over $queryRaw UNION ALL.
//
// Sort: 'recent' (createdAt desc) or 'engagement' (likeCount desc) — both
// are plain columns present on both models, so no $queryRaw needed even
// for the engagement branch (unlike Community's summed-likes+comments
// engagement sort, which genuinely needs raw SQL because it sums two
// columns; here it's a single existing column on each side).
//
// IMPORTANT slug convention (confirmed during the /questions migration):
// - Article.slug already includes the "how-long-until-" prefix literally.
// - Event.slug does NOT — it's bare; link construction happens in
//   QuestionCard, not here.

export type QuestionsSort = 'recent' | 'engagement';

export type QuestionFeedItem =
  | {
      kind: 'article';
      id: string;
      slug: string;
      title: string;
      description: string | null;
      heroImageUrl: string | null;
      createdAt: string;
      likeCount: number;
      shareCount: number;
      commentCount: number;
      categorySlug: string | null;
      categoryName: string | null;
      categoryEmoji: string | null;
    }
  | {
      kind: 'event';
      id: string;
      slug: string;
      title: string;
      description: string | null;
      heroImageUrl: string | null;
      targetDate: string;
      createdAt: string;
      likeCount: number;
      views: number;
      shareCount: number;
      commentCount: number;
      categorySlug: string | null;
      categoryName: string | null;
      categoryEmoji: string | null;
    };

export interface QuestionsFeedParams {
  category?: string;
  cursor?: string;
  take?: number;
  sort?: QuestionsSort;
  q?: string;
}

interface DecodedCursor {
  a: string | null; // last-consumed Article id
  e: string | null; // last-consumed Event id
}

function decodeCursor(cursor?: string): DecodedCursor {
  if (!cursor) return { a: null, e: null };
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    return { a: parsed.a ?? null, e: parsed.e ?? null };
  } catch {
    return { a: null, e: null };
  }
}

function encodeCursor(a: string | null, e: string | null): string {
  return Buffer.from(JSON.stringify({ a, e })).toString('base64');
}

function orderByForSort(sort: QuestionsSort) {
  return sort === 'engagement'
    ? [{ likeCount: 'desc' as const }, { id: 'desc' as const }]
    : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
}

async function fetchArticlesPage(take: number, cursorId: string | null, sort: QuestionsSort, categorySlug?: string, q?: string) {
  const rows = await prisma.article.findMany({
    where: {
      toolSlug: 'questions',
      status: 'published',
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { dek: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    orderBy: orderByForSort(sort),
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true, slug: true, title: true, dek: true, heroImageUrl: true, createdAt: true, likeCount: true, shareCount: true,
      category: { select: { slug: true, name: true, emoji: true } },
    },
  });
  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

async function fetchEventsPage(take: number, cursorId: string | null, sort: QuestionsSort, categorySlug?: string, q?: string) {
  const rows = await prisma.event.findMany({
    where: {
      published: true,
      // Event's real category association is the flat categorySlug string
      // field, not the categoryId relation (largely unpopulated — see
      // sitemap-index's own comment on the same point).
      ...(categorySlug ? { categorySlug } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    orderBy: orderByForSort(sort),
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true, slug: true, name: true, description: true, heroImageUrl: true,
      targetDate: true, createdAt: true, likeCount: true, views: true, shareCount: true, categorySlug: true,
      category: { select: { slug: true, name: true, emoji: true } },
    },
  });
  const hasMore = rows.length > take;
  return { items: hasMore ? rows.slice(0, take) : rows, hasMore };
}

function articleToItem(a: Awaited<ReturnType<typeof fetchArticlesPage>>['items'][number]): QuestionFeedItem {
  return {
    kind: 'article',
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.dek,
    heroImageUrl: a.heroImageUrl,
    createdAt: a.createdAt.toISOString(),
    likeCount: a.likeCount,
    shareCount: a.shareCount,
    commentCount: 0,
    categorySlug: a.category?.slug ?? null,
    categoryName: a.category?.name ?? null,
    categoryEmoji: a.category?.emoji ?? null,
  };
}

function eventToItem(e: Awaited<ReturnType<typeof fetchEventsPage>>['items'][number]): QuestionFeedItem {
  return {
    kind: 'event',
    id: e.id,
    slug: e.slug,
    title: e.name,
    description: e.description,
    heroImageUrl: e.heroImageUrl,
    targetDate: e.targetDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    likeCount: e.likeCount,
    views: e.views,
    shareCount: e.shareCount,
    commentCount: 0,
    categorySlug: e.categorySlug ?? e.category?.slug ?? null,
    categoryName: e.category?.name ?? null,
    categoryEmoji: e.category?.emoji ?? null,
  };
}

function sortMerged(items: QuestionFeedItem[], sort: QuestionsSort): QuestionFeedItem[] {
  return sort === 'engagement'
    ? [...items].sort((x, y) => y.likeCount - x.likeCount)
    : [...items].sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime());
}

export async function getQuestionsFeed(params: QuestionsFeedParams) {
  const take = params.take ?? 9;
  const sort = params.sort ?? 'recent';
  const q = params.q?.trim() && params.q.trim().length >= 2 ? params.q.trim() : undefined;
  const { a: articleCursor, e: eventCursor } = decodeCursor(params.cursor);

  const [articleResult, eventResult] = await Promise.all([
    fetchArticlesPage(take, articleCursor, sort, params.category, q),
    fetchEventsPage(take, eventCursor, sort, params.category, q),
  ]);

  const merged = sortMerged(
    [...articleResult.items.map(articleToItem), ...eventResult.items.map(eventToItem)],
    sort
  );

  const page = merged.slice(0, take);

  // Batched comment-count lookup: one groupBy covering every item on this
  // page, rather than a per-item query. Comment has no stored count column
  // (it's a polymorphic subjectType/subjectId table), so this is the
  // cheapest way to attach counts without N+1 queries.
  if (page.length > 0) {
    const articleIds = page.filter(i => i.kind === 'article').map(i => i.id);
    const eventIds = page.filter(i => i.kind === 'event').map(i => i.id);
    const [articleCommentCounts, eventCommentCounts] = await Promise.all([
      articleIds.length
        ? prisma.comment.groupBy({ by: ['subjectId'], where: { subjectType: 'article', subjectId: { in: articleIds }, deletedAt: null }, _count: { _all: true } })
        : Promise.resolve([]),
      eventIds.length
        ? prisma.comment.groupBy({ by: ['subjectId'], where: { subjectType: 'event', subjectId: { in: eventIds }, deletedAt: null }, _count: { _all: true } })
        : Promise.resolve([]),
    ]);
    const commentCountMap = new Map<string, number>();
    for (const row of articleCommentCounts) commentCountMap.set(row.subjectId, row._count._all);
    for (const row of eventCommentCounts) commentCountMap.set(row.subjectId, row._count._all);
    for (const item of page) {
      item.commentCount = commentCountMap.get(item.id) ?? 0;
    }
  }

  // Only advance each side's cursor past items actually shown on this page —
  // fetched-but-unshown items (held back by the other side ranking higher)
  // must remain available for the next page, not get skipped.
  const lastArticleShown = [...page].reverse().find(i => i.kind === 'article');
  const lastEventShown = [...page].reverse().find(i => i.kind === 'event');

  const newArticleCursor = lastArticleShown ? lastArticleShown.id : articleCursor;
  const newEventCursor = lastEventShown ? lastEventShown.id : eventCursor;

  const hasMore = merged.length > take || articleResult.hasMore || eventResult.hasMore;
  const nextCursor = hasMore ? encodeCursor(newArticleCursor, newEventCursor) : null;

  return { items: page, nextCursor };
}

export interface QuestionsCategoryPill {
  slug: string;
  name: string;
  emoji: string;
}

// Non-empty category pills — a category qualifies if it has at least one
// live 'questions'-tool Article OR at least one published Event pointing
// at it via categorySlug. Two different lookup mechanisms per model,
// matching each model's real (confirmed) category-association field.
export async function getQuestionsCategories(): Promise<QuestionsCategoryPill[]> {
  const [articleCats, eventCategorySlugGroups] = await Promise.all([
    prisma.category.findMany({
      where: { articlesAsCategory: { some: { toolSlug: 'questions', status: 'published' } } },
      select: { slug: true, name: true, emoji: true },
    }),
    prisma.event.groupBy({ by: ['categorySlug'], where: { published: true } }),
  ]);

  const knownSlugs = new Set(articleCats.map(c => c.slug));
  const missingEventSlugs = eventCategorySlugGroups
    .map(g => g.categorySlug)
    .filter((slug): slug is string => Boolean(slug) && !knownSlugs.has(slug));

  const eventOnlyCats = missingEventSlugs.length
    ? await prisma.category.findMany({
        where: { slug: { in: missingEventSlugs } },
        select: { slug: true, name: true, emoji: true },
      })
    : [];

  return [...articleCats, ...eventOnlyCats].sort((a, b) => a.name.localeCompare(b.name));
}
