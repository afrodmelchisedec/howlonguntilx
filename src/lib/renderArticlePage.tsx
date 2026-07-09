// FILE: src/lib/renderArticlePage.tsx
import { notFound } from 'next/navigation';
import { getPublishedArticle } from '@/lib/articles';
import { ArticleLayout } from '@/components/articles/ArticleLayout';
import { extractFaq } from '@/components/articles/ArticleBlocks';

export const TOOL_META: Record<string, { name: string; glow: string }> = {
  'tech-events': { name: 'Tech Events Calendar', glow: '162, 137, 255' },
  'dark-sky-explorer': { name: 'Dark Sky Explorer', glow: '110, 231, 183' },
};

export async function generateArticleMetadata(toolSlug: string, articleSlug: string) {
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!article) return {};
  const url = `https://www.howlonguntilx.com/tools/${toolSlug}/${articleSlug}`;
  return {
    title: article.title,
    description: article.dek,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title: article.title, description: article.dek, images: [article.heroImageUrl], url, type: 'article' },
    twitter: { card: 'summary_large_image', title: article.title, description: article.dek, images: [article.heroImageUrl] },
  };
}

export async function ArticlePageContent({ toolSlug, articleSlug }: { toolSlug: string; articleSlug: string }) {
  const meta = TOOL_META[toolSlug];
  const article = await getPublishedArticle(toolSlug, articleSlug);
  if (!meta || !article) notFound();

  const faqItems = extractFaq(article.blocks as any);

  const jsonLd: any[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.dek,
      image: [article.heroImageUrl],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: { '@type': 'Organization', name: article.authorName },
      mainEntityOfPage: `https://www.howlonguntilx.com/tools/${toolSlug}/${articleSlug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.howlonguntilx.com' },
        { '@type': 'ListItem', position: 2, name: meta.name, item: `https://www.howlonguntilx.com/tools/${toolSlug}` },
        { '@type': 'ListItem', position: 3, name: article.title },
      ],
    },
  ];

  if (faqItems && faqItems.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '24px 16px' }}>
      {jsonLd.map((obj, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <ArticleLayout article={article} toolName={meta.name} toolSlug={toolSlug} glow={meta.glow} />
    </div>
  );
}
