// FILE: src/components/articles/ArticleLayout.tsx
import Link from 'next/link';
import { ArticleBlocks, extractHeroCountdown, extractHeadings, extractFaq, extractSources } from './ArticleBlocks';
import { ArticleCommentSection } from './ArticleCommentSection';
import { RelatedArticles } from './RelatedArticles';
import { ArticleStyles } from './ArticleStyles';
import { HeroCountdown } from './HeroCountdown';
import { HeroDuration } from './HeroDuration';
import { ArticleSchema } from './ArticleSchema';
import { ArticleTableOfContents } from './ArticleTableOfContents';
import { ArticleFeaturedPiece } from './ArticleFeaturedPiece';
import { ArticleDisclaimer } from './ArticleDisclaimer';
import { ArticleAboutNote } from './ArticleAboutNote';
import { AdSlot } from './AdSlot';
import { LikeButton } from './LikeButton';
import { ShareButton } from './ShareButton';
import { SourcesFooter } from '../countdown/SourcesFooter';

// `featuredPiece` is optional and fetched by the caller — see the comment block
// at the top of ArticleFeaturedPiece.tsx for the query shape.
export function ArticleLayout({ article, toolName, toolSlug, glow, featuredPiece }: { article: any; toolName: string; toolSlug: string; glow: string; featuredPiece?: any }) {
  const hero = extractHeroCountdown(article.blocks as any);
  // Duration-type questions (e.g. "how long until X kills you?") have no fixed
  // target date to count down to — they render a min/max range hero instead.
  // Only used when no hero_countdown block is present, so a dated question's
  // block-based hero always takes priority if both happen to be set.
  const heroDuration = !hero && article.questionType === 'DURATION' && article.heroData ? article.heroData : null;
  const headings = extractHeadings(article.blocks as any);
  const faqItems = extractFaq(article.blocks as any);
  const sources = extractSources(article.blocks as any);
  const tocHeadings = faqItems && faqItems.length > 0 ? [...headings, { id: 'faq', text: 'FAQs' }] : headings;

  const published = article.publishedAt ? new Date(article.publishedAt) : null;
  const updated = article.updatedAt ? new Date(article.updatedAt) : null;
  // Only show a separate "Updated" pill when it's meaningfully after publish —
  // otherwise every article would show it on day one, which reads as noise, not freshness.
  const showUpdated = published && updated && updated.getTime() - published.getTime() > 24 * 60 * 60 * 1000;
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
  function pickDefaultImage(categorySlug: string | null | undefined, seed: string | null | undefined) {
    const pool = CATEGORY_DEFAULT_IMAGES[categorySlug ? categorySlug.toLowerCase() : ''];
    const all = pool || Object.values(CATEGORY_DEFAULT_IMAGES).flat();
    if (all.length === 0) return '/images/default-article-hero.svg';
    let hash = 0;
    for (const ch of String(seed || '')) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return all[Math.abs(hash) % all.length];
  }
  const categoryDefault = pickDefaultImage(article.category?.slug, article.slug);
  const heroImageUrl = article.heroImageUrl || article.category?.featureImageUrl || categoryDefault;

  return (
    <article className="anim-fade-up">
      <ArticleStyles />
      <ArticleSchema article={article} toolName={toolName} toolSlug={toolSlug} />

      <nav className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/">Home</Link> / <Link href={`/tools/${toolSlug}`}>{toolName}</Link> / <span>{article.title}</span>
      </nav>

      {hero && <HeroCountdown targetDate={hero.targetDate} label={hero.label} glow={glow} />}
      {heroDuration && <HeroDuration heroData={heroDuration} glow={glow} />}

      <img src={heroImageUrl} alt={article.heroImageAlt || article.title} className="w-full rounded-2xl mb-5 article-glow-card" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
      <p className="text-caption mb-1" style={{ color: `rgb(${glow})` }}>{toolName.toUpperCase()}</p>
      <h1 className="text-title1 mb-2">{article.title}</h1>
      <p className="text-callout mb-3" style={{ color: 'var(--text-secondary)' }}>{article.dek}</p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <p className="text-caption m-0" style={{ color: 'var(--text-secondary)' }}>
          By <Link href="/about" className="hover:underline" style={{ color: 'inherit' }}>{article.authorName}</Link>{!showUpdated && published && ` · ${published.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
        </p>
        {showUpdated && (
          <span className="article-freshness-pill text-caption" style={{ color: `rgb(${glow})`, background: `rgba(${glow}, 0.1)`, border: `1px solid rgba(${glow}, 0.25)` }}>
            Updated {updated!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
        <LikeButton articleId={article.id} glow={glow} />
        <ShareButton glow={glow} title={article.title} />
      </div>

      {article.reviewerName && (
        <p className="text-caption mb-4" style={{ color: 'var(--text-secondary)' }}>
          ✓ Medically reviewed by {article.reviewerName}
          {article.reviewerCredentials ? `, ${article.reviewerCredentials}` : ''}
        </p>
      )}

      <ArticleDisclaimer categorySlug={article.category?.slug} glow={glow} />

      {/* Only shows when there's no real reviewer set — the moment article.reviewerName
          is populated, the badge above takes over and this note disappears on its own. */}
      {!article.reviewerName && (
        <ArticleAboutNote authorName={article.authorName} updatedAt={article.updatedAt} categorySlug={article.category?.slug} glow={glow} />
      )}

      <ArticleTableOfContents headings={tocHeadings} glow={glow} />

      <ArticleBlocks toolSlug={toolSlug} blocks={article.blocks} glow={glow} subcategoryTools={article.subcategory?.tools ?? []} />

      {sources && sources.length > 0 && (
        <div className="mt-6">
          <SourcesFooter sources={sources} />
        </div>
      )}

      <ArticleFeaturedPiece piece={featuredPiece} glow={glow} />

      <AdSlot slotId="article-lower" />

      <RelatedArticles toolSlug={toolSlug} excludeSlug={article.slug} glow={glow} />

      <div className="mt-10">
        <ArticleCommentSection glow={glow} />
      </div>
    </article>
  );
}