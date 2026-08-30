// FILE: src/app/api/admin/articles/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pingIndexNow } from '@/lib/indexnow';
import { hasToolEmbed } from '@/components/articles/ArticleBlocks';
import { invalidateArticleCache } from '@/lib/articles';

async function isAdmin() {
  const s = await getServerSession(authOptions);
  return s?.user?.role === 'ADMIN' ? s : null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const article = await prisma.article.findUnique({ where: { id: params.id } });
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Hard quality gate: no article goes live without its category's interactive tool embedded
  if (!hasToolEmbed(article.blocks as any)) {
    return NextResponse.json({ error: 'Article must include a tool_embed block before publishing' }, { status: 400 });
  }
  const updated = await prisma.article.update({
    where: { id: params.id },
    data: { status: 'published', publishedAt: article.publishedAt ?? new Date() },
  });
  const url = `https://howlonguntilx.com/tools/${updated.toolSlug}/${updated.slug}`;
  revalidatePath(`/tools/${updated.toolSlug}/${updated.slug}`);
  revalidatePath(`/tools/${updated.toolSlug}`); // Discover grid changed
  revalidatePath('/sitemap.xml');
  await invalidateArticleCache(updated.toolSlug, updated.slug);
  await pingIndexNow([url]);
  return NextResponse.json({ ok: true, url });
}
