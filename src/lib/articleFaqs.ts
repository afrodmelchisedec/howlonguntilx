// FILE: src/lib/articleFaqs.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';
import { extractFaq } from '@/components/articles/ArticleBlocks';

export interface ArticleFaqItem {
  id: string;
  question: string;
  answer: string;
  href: string;
  articleTitle: string;
}

// Cap how many rows land on the homepage — this is a discovery/SEO surface,
// not a full index. Raise it if you want a bigger pool for the slider to rotate through.
const MAX_ITEMS = 60;
// How many recent articles to scan looking for faq blocks. Each article can
// contribute 0-many rows, so this is intentionally higher than MAX_ITEMS.
const ARTICLES_TO_SCAN = 150;

async function fetchArticleFaqs(): Promise<ArticleFaqItem[]> {
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    orderBy: { publishedAt: 'desc' },
    take: ARTICLES_TO_SCAN,
    select: { id: true, toolSlug: true, slug: true, title: true, blocks: true },
  });

  const items: ArticleFaqItem[] = [];
  for (const a of articles) {
    const faq = extractFaq(a.blocks as any);
    if (!faq) continue;
    for (let i = 0; i < faq.length; i++) {
      items.push({
        id: `${a.id}-faq-${i}`,
        question: faq[i].q,
        answer: faq[i].a,
        href: `/tools/${a.toolSlug}/${a.slug}#faq`,
        articleTitle: a.title,
      });
      if (items.length >= MAX_ITEMS) return items;
    }
  }
  return items;
}

// Revalidates hourly — article FAQ content doesn't change minute-to-minute,
// so there's no reason to pay a DB + JSON-parse cost on every homepage hit.
export const getArticleFaqs = unstable_cache(fetchArticleFaqs, ['homepage-article-faqs'], {
  revalidate: 3600,
});
