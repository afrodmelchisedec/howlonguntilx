// FILE: src/app/tools/upcoming-events/[article]/page.tsx
import { generateArticleMetadata, ArticlePageContent } from '@/lib/renderArticlePage';

const TOOL_SLUG = 'upcoming-events';

export async function generateMetadata({ params }: { params: { article: string } }) {
  return generateArticleMetadata(TOOL_SLUG, params.article);
}

export default async function Page({ params }: { params: { article: string } }) {
  return <ArticlePageContent toolSlug={TOOL_SLUG} articleSlug={params.article} />;
}
