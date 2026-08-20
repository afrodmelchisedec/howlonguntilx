import { getPublishedArticle } from '@/lib/articles';
import { EmbedDurationWidget } from '@/components/embed/EmbedDurationWidget';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

interface Props { searchParams: { tool?: string; article?: string; theme?: string } }

export default async function EmbedDurationPage({ searchParams }: Props) {
  const toolSlug = searchParams.tool ?? '';
  const articleSlug = searchParams.article ?? '';
  const theme = searchParams.theme === 'dark' ? 'dark' : 'light';

  const article = toolSlug && articleSlug ? await getPublishedArticle(toolSlug, articleSlug) : null;
  const data = article?.questionType === 'DURATION' && article.heroData ? (article.heroData as any) : null;
  const glow = getCategoryGlowRGB((article as any)?.category?.slug);

  return <EmbedDurationWidget data={data} glow={glow} theme={theme} />;
}
