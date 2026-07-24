// FILE: src/lib/renderArticlePage.tsx
import { notFound } from 'next/navigation';
import { getPublishedArticle } from '@/lib/articles';
import { ArticleLayout } from '@/components/articles/ArticleLayout';
import { StarField } from '@/components/ui/StarField';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

// TODO: extend with your other tools as you migrate them onto this pattern
export const TOOL_META: Record<string, { name: string; glow: string }> = {
  'tech-events': { name: 'Tech Events Calendar', glow: '162, 137, 255' },
  'dark-sky-explorer': { name: 'Dark Sky Explorer', glow: '110, 231, 183' },
};

export async function generateArticleMetadata(toolSlug: string, articleSlug: string) {
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!article) return {};
  const url = `${SITE_URL}/tools/${toolSlug}/${articleSlug}`;
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: url },
    openGraph: { title: article.title, description: article.dek, images: [article.heroImageUrl], url, type: 'article' },
    twitter: { card: 'summary_large_image', title: article.title, description: article.dek, images: [article.heroImageUrl] },
  };
}

export async function ArticlePageContent({ toolSlug, articleSlug }: { toolSlug: string; articleSlug: string }) {
  const meta = TOOL_META[toolSlug];
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!meta || !article) notFound();

  // Structured data (Article / BreadcrumbList / FAQPage / Event) is emitted once,
  // by <ArticleSchema> inside <ArticleLayout>. Do not duplicate JSON-LD here —
  // two blocks of the same @type on one page causes rich-result validation conflicts.

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      {/* ══════════════════════════════════════════════════════
          STARFIELD — same moving-star backdrop as the homepage
      ══════════════════════════════════════════════════════ */}
      <StarField />

      <div className="relative z-10" style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>
        <ArticleLayout article={article} toolName={meta.name} toolSlug={toolSlug} glow={meta.glow} />
      </div>
    </div>
  );
}
