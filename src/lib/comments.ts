// FILE: src/lib/comments.ts
import { prisma } from './db';

export interface CommentInput {
  subjectType: string;
  subjectId: string;
  parentId?: string;
  body: string;
}

async function bumpCommentCount(subjectType: string, subjectId: string, delta: number) {
  if (subjectType === 'userEvent') {
    await prisma.userEvent
      .update({ where: { id: subjectId }, data: { commentCount: { increment: delta } } })
      .catch(() => {});
  }
}

export async function getCommentsForSubject(subjectType: string, subjectId: string, viewerId?: string) {
  const rows = await prisma.comment.findMany({
    where: { subjectType, subjectId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, username: true, image: true, blockedAt: true } } },
  });

  let likedIds = new Set<string>();
  if (viewerId && rows.length > 0) {
    const likes = await prisma.commentLike.findMany({
      where: { userId: viewerId, commentId: { in: rows.map(r => r.id) } },
      select: { commentId: true },
    });
    likedIds = new Set(likes.map(l => l.commentId));
  }

  return rows.map(r => {
    const hide = !!r.deletedAt || !!r.author?.blockedAt;
    return {
      ...(hide ? { ...r, body: '[deleted]', author: null } : r),
      liked: likedIds.has(r.id),
    };
  });
}

export async function createComment(authorId: string, data: CommentInput) {
  const comment = await prisma.comment.create({
    data: {
      subjectType: data.subjectType,
      subjectId: data.subjectId,
      parentId: data.parentId,
      body: data.body,
      authorId,
    },
    include: { author: { select: { id: true, name: true, username: true, image: true } } },
  });
  await bumpCommentCount(data.subjectType, data.subjectId, 1);
  return comment;
}

export async function softDeleteComment(userId: string, commentId: string, isAdmin = false) {
  const where = isAdmin ? { id: commentId } : { id: commentId, authorId: userId };
  const result = await prisma.comment.updateMany({ where, data: { deletedAt: new Date() } });
  if (result.count === 0) return null;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (comment) await bumpCommentCount(comment.subjectType, comment.subjectId, -1);
  return comment;
}

export async function flagComment(adminId: string, commentId: string, reason?: string) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { flaggedAt: new Date(), flaggedById: adminId, flagReason: reason ?? null },
  });
}

export async function unflagComment(commentId: string) {
  return prisma.comment.update({
    where: { id: commentId },
    data: { flaggedAt: null, flaggedById: null, flagReason: null },
  });
}

export interface CommentSubjectInfo {
  title: string;
  href: string | null;
}

// Resolves subjectId -> a human title + link, batched one query PER
// subjectType present in the given comment list (not per-comment) — the
// 'tool' type has no backing DB row at all (Phase 5.5's documented design:
// a bare route slug), so it gets a humanized slug and a best-effort
// /tools/{slug} link rather than a DB-resolved title.
async function resolveSubjectInfo(comments: { subjectType: string; subjectId: string }[]): Promise<Map<string, CommentSubjectInfo>> {
  const result = new Map<string, CommentSubjectInfo>();

  const idsByType: Record<string, Set<string>> = { article: new Set(), event: new Set(), userEvent: new Set(), tool: new Set() };
  for (const c of comments) {
    if (idsByType[c.subjectType]) idsByType[c.subjectType].add(c.subjectId);
  }

  const key = (type: string, id: string) => type + ':' + id;

  if (idsByType.article.size > 0) {
    const rows = await prisma.article.findMany({
      where: { id: { in: [...idsByType.article] } },
      select: { id: true, slug: true, toolSlug: true, title: true },
    });
    for (const r of rows) result.set(key('article', r.id), { title: r.title, href: `/tools/${r.toolSlug}/${r.slug}` });
  }

  if (idsByType.event.size > 0) {
    const rows = await prisma.event.findMany({
      where: { id: { in: [...idsByType.event] } },
      select: { id: true, slug: true, name: true },
    });
    for (const r of rows) result.set(key('event', r.id), { title: r.name, href: `/questions/how-long-until-${r.slug}` });
  }

  if (idsByType.userEvent.size > 0) {
    const rows = await prisma.userEvent.findMany({
      where: { id: { in: [...idsByType.userEvent] } },
      select: { id: true, slug: true, title: true },
    });
    for (const r of rows) result.set(key('userEvent', r.id), { title: r.title, href: `/community/how-long-until-${r.slug}` });
  }

  for (const slug of idsByType.tool) {
    const humanized = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    result.set(key('tool', slug), { title: humanized, href: `/tools/${slug}` });
  }

  return result;
}

export async function getCommentsForModeration() {
  const comments = await prisma.comment.findMany({
    where: { deletedAt: null },
    orderBy: [{ flaggedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 500,
    include: {
      author: { select: { id: true, name: true, email: true, image: true, blockedAt: true } },
      flaggedBy: { select: { id: true, name: true } },
    },
  });

  const subjectInfo = await resolveSubjectInfo(comments);

  return comments.map(c => ({
    ...c,
    subject: subjectInfo.get(c.subjectType + ':' + c.subjectId) ?? { title: '(unknown)', href: null },
  }));
}
