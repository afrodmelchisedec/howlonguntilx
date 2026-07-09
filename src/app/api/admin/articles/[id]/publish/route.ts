// FILE: src/app/api/admin/articles/[id]/publish/route.ts
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma'; // TODO: adjust path
import { pingIndexNow } from '@/lib/indexnow';
import { hasToolEmbed } from '@/components/articles/ArticleBlocks';
// TODO: add your real admin-auth check here (session role check) before this route is exposed

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  const url = `https://www.howlonguntilx.com/tools/${updated.toolSlug}/${updated.slug}`;
  revalidatePath(`/tools/${updated.toolSlug}/${updated.slug}`);
  revalidatePath(`/tools/${updated.toolSlug}`); // Discover grid changed
  revalidatePath('/sitemap.xml');
  await pingIndexNow([url]);

  return NextResponse.json({ ok: true, url });
}
