import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/lib/events';
import { generateEventMetadata, EventPageContent } from '@/lib/renderEventPage';
import { generateArticleMetadata, ArticlePageContent } from '@/lib/renderArticlePage';

// Merged resolver for /questions/[slug] — unifies the legacy Event route
// (/how-long-until-<slug>) and the legacy Article route
// (/tools/questions/<article-slug>) under one URL, per the questions-merge
// roadmap. Resolution order: try Event first (bare slug, prefix stripped),
// then Article (full slug, toolSlug scoped to 'questions'), then 404.
// Mirrors the existing try-Event-then-UserEvent pattern in /embed/widget.
//
// IMPORTANT: this is additive only for now. The old routes
// (src/app/[slug]/page.tsx and src/app/tools/questions/[article]/page.tsx)
// are untouched and still live — do not delete or redirect them until
// Phase C/D/E of the roadmap are explicitly reached and confirmed.

const TOOL_SLUG = 'questions';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props) {
  const requestedSlug = params.slug;
  const strippedSlug = requestedSlug.replace('how-long-until-', '');

  const event = await getEventBySlug(strippedSlug);
  if (event) {
    return generateEventMetadata(strippedSlug, `/questions/${requestedSlug}`);
  }

  const articleMeta = await generateArticleMetadata(TOOL_SLUG, requestedSlug);
  if (articleMeta && Object.keys(articleMeta).length > 0) {
    return {
      ...articleMeta,
      alternates: { canonical: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com'}/questions/${requestedSlug}` },
    };
  }

  return {};
}

export default async function QuestionsSlugPage({ params }: Props) {
  const requestedSlug = params.slug;
  const strippedSlug = requestedSlug.replace('how-long-until-', '');

  const event = await getEventBySlug(strippedSlug);
  if (event) {
    return <EventPageContent rawSlug={strippedSlug} />;
  }

  return <ArticlePageContent toolSlug={TOOL_SLUG} articleSlug={requestedSlug} />;
}
