// FILE: src/components/articles/ArticleLayout.tsx
import Link from 'next/link';
import { ArticleBlocks, extractHeroCountdown } from './ArticleBlocks';
import { ArticleCommentSection } from './ArticleCommentSection';
import { RelatedArticles } from './RelatedArticles';
import { ArticleStyles } from './ArticleStyles';
import { HeroCountdown } from './HeroCountdown';

export function ArticleLayout({ article, toolName, toolSlug, glow }: { article: any; toolName: string; toolSlug: string; glow: string }) {
  const hero = extractHeroCountdown(article.blocks as any);

  return (
    <article className="anim-fade-up">
      <ArticleStyles />
      <nav className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/">Home</Link> / <Link href={`/tools/${toolSlug}`}>{toolName}</Link> / <span>{article.title}</span>
      </nav>

      {hero && <HeroCountdown targetDate={hero.targetDate} label={hero.label} glow={glow} />}

      <img src={article.heroImageUrl} alt={article.heroImageAlt} className="w-full rounded-2xl mb-5 article-glow-card" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />
      <p className="text-caption mb-1" style={{ color: `rgb(${glow})` }}>{toolName.toUpperCase()}</p>
      <h1 className="text-title1 mb-2">{article.title}</h1>
      <p className="text-callout mb-1" style={{ color: 'var(--text-secondary)' }}>{article.dek}</p>
      <p className="text-caption mb-6" style={{ color: 'var(--text-secondary)' }}>
        By {article.authorName} · {new Date(article.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <ArticleBlocks toolSlug={toolSlug} blocks={article.blocks} glow={glow} />
      <RelatedArticles toolSlug={toolSlug} excludeSlug={article.slug} glow={glow} />
      <div className="mt-10">
        <ArticleCommentSection glow={glow} />
      </div>
    </article>
  );
}
