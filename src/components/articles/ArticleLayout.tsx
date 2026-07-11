// FILE: src/components/articles/ArticleLayout.tsx
import Link from 'next/link';
import { ArticleBlocks, extractHeroCountdown, extractHeadings } from './ArticleBlocks';
import { ArticleCommentSection } from './ArticleCommentSection';
import { RelatedArticles } from './RelatedArticles';
import { ArticleStyles } from './ArticleStyles';
import { HeroCountdown } from './HeroCountdown';
import { ArticleSchema } from './ArticleSchema';
import { ArticleTableOfContents } from './ArticleTableOfContents';
import { ArticleFeaturedPiece } from './ArticleFeaturedPiece';
import { AdSlot } from './AdSlot';

// `featuredPiece` is optional and fetched by the caller — see the comment block
// at the top of ArticleFeaturedPiece.tsx for the query shape.
export function ArticleLayout({ article, toolName, toolSlug, glow, featuredPiece }: { article: any; toolName: string; toolSlug: string; glow: string; featuredPiece?: any }) {
  const hero = extractHeroCountdown(article.blocks as any);
  const headings = extractHeadings(article.blocks as any);

  const published = article.publishedAt ? new Date(article.publishedAt) : null;
  const updated = article.updatedAt ? new Date(article.updatedAt) : null;
  // Only show a separate "Updated" pill when it's meaningfully after publish —
  // otherwise every article would show it on day one, which reads as noise, not freshness.
  const showUpdated = published && updated && updated.getTime() - published.getTime() > 24 * 60 * 60 * 1000;

  return (
    <article className="anim-fade-up">
      <ArticleStyles />
      <ArticleSchema article={article} toolName={toolName} toolSlug={toolSlug} />

      <nav className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/">Home</Link> / <Link href={`/tools/${toolSlug}`}>{toolName}</Link> / <span>{article.title}</span>
      </nav>

      {hero && <HeroCountdown targetDate={hero.targetDate} label={hero.label} glow={glow} />}

      <img src={article.heroImageUrl} alt={article.heroImageAlt} className="w-full rounded-2xl mb-5 article-glow-card" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
      <p className="text-caption mb-1" style={{ color: `rgb(${glow})` }}>{toolName.toUpperCase()}</p>
      <h1 className="text-title1 mb-2">{article.title}</h1>
      <p className="text-callout mb-3" style={{ color: 'var(--text-secondary)' }}>{article.dek}</p>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <p className="text-caption m-0" style={{ color: 'var(--text-secondary)' }}>
          By {article.authorName} · {published?.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
        {showUpdated && (
          <span className="article-freshness-pill text-caption" style={{ color: `rgb(${glow})`, background: `rgba(${glow}, 0.1)`, border: `1px solid rgba(${glow}, 0.25)` }}>
            Updated {updated!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      <ArticleTableOfContents headings={headings} glow={glow} />

      <ArticleBlocks toolSlug={toolSlug} blocks={article.blocks} glow={glow} />

      <ArticleFeaturedPiece piece={featuredPiece} glow={glow} />

      <AdSlot slotId="article-lower" />

      <RelatedArticles toolSlug={toolSlug} excludeSlug={article.slug} glow={glow} />

      <div className="mt-10">
        <ArticleCommentSection glow={glow} />
      </div>
    </article>
  );
}
