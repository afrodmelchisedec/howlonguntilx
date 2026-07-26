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
  'questions': { name: 'Questions', glow: '255, 120, 110' },
};

const FALLBACK_IMAGE = '/images/default-article-hero.svg';
const CATEGORY_DEFAULT_IMAGES: Record<string, string[]> = {
  health: ['/images/defaults/health/Health-1.jpg', '/images/defaults/health/Health-2.jpg', '/images/defaults/health/Health-3.jpg'],
  finance: ['/images/defaults/finance/Finance-1.jpg', '/images/defaults/finance/Finance-2.jpg', '/images/defaults/finance/Finance-3.jpg', '/images/defaults/finance/Finance-4.jpg', '/images/defaults/finance/Finance-5.jpg'],
  scam: ['/images/defaults/scam/Scam-1.jpg', '/images/defaults/scam/Scam-2.jpg', '/images/defaults/scam/Scam-3.jpg'],
  tech: ['/images/defaults/tech/Tech-1.jpg', '/images/defaults/tech/Tech-2.jpg', '/images/defaults/tech/Tech-3.jpg', '/images/defaults/tech/Tech-4.jpg', '/images/defaults/tech/Tech-5.jpg'],
  leisure: ['/images/defaults/leisure/Leisure-1.jpg', '/images/defaults/leisure/Leisure-2.jpg', '/images/defaults/leisure/Leisure-3.jpg', '/images/defaults/leisure/Leisure-4.jpg', '/images/defaults/leisure/Leisure-5.jpg'],
  food: ['/images/defaults/food/Food-1.jpg', '/images/defaults/food/Food-2.jpg', '/images/defaults/food/Food-3.jpg', '/images/defaults/food/Food-4.jpg', '/images/defaults/food/Food-5.jpg'],
  travel: ['/images/defaults/travel/Travel-1.jpg', '/images/defaults/travel/Travel-2.jpg', '/images/defaults/travel/Travel-3.jpg', '/images/defaults/travel/Travel-4.jpg'],
  productivity: ['/images/defaults/productivity/Productivity-1.jpg', '/images/defaults/productivity/Productivity-2.jpg', '/images/defaults/productivity/Productivity-3.jpg'],
};
function pickDefaultImage(categorySlug?: string | null, seed?: string): string {
  const pool = CATEGORY_DEFAULT_IMAGES[categorySlug ? categorySlug.toLowerCase() : ''];
  const all = pool ?? Object.values(CATEGORY_DEFAULT_IMAGES).flat();
  if (all.length === 0) return FALLBACK_IMAGE;
  let hash = 0;
  for (const ch of String(seed ?? '')) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return all[Math.abs(hash) % all.length];
}
function truncateDescription(text: string, maxLen = 155): string {
  if (!text || text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  const trimmed = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return trimmed.trim() + '…';
}

function resolveHeroImage(article: any): string {
  return article.heroImageUrl || article.category?.featureImageUrl || pickDefaultImage(article.category?.slug, article.slug);
}

export async function generateArticleMetadata(toolSlug: string, articleSlug: string) {
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!article) return {};
  const url = `${SITE_URL}/tools/${toolSlug}/${articleSlug}`;
  return {
    title: article.title,
    description: truncateDescription(article.dek),
    alternates: { canonical: url },
    openGraph: { title: article.title, description: truncateDescription(article.dek), images: [resolveHeroImage(article)], url, type: 'article' },
    twitter: { card: 'summary_large_image', title: article.title, description: truncateDescription(article.dek), images: [resolveHeroImage(article)] },
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
