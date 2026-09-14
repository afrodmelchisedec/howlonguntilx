// FILE: src/components/articles/ArticleLayout.tsx
import Link from 'next/link';
import { ArticleBlocks, extractHeroCountdown, extractHeadings, extractFaq, extractSources, extractLeadParagraph, bodyBlocksWithoutLead, ArticleLeadParagraph } from './ArticleBlocks';
import { CommentThread } from '@/components/community/CommentThread';
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
import { EmbedDurationButton } from './EmbedDurationButton';
import { SourcesFooter } from '../countdown/SourcesFooter';
import { pickDefaultImage } from '@/lib/defaultImages';
import { getAffiliateBanner } from '@/lib/affiliateBanners';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { resolveDynamicTokensDeep } from '@/lib/dynamicTokens';

// `featuredPiece` is optional and fetched by the caller — see the comment block
// at the top of ArticleFeaturedPiece.tsx for the query shape.
export async function ArticleLayout({ article, toolName, toolSlug, glow, featuredPiece, publicPath }: { article: any; toolName: string; toolSlug: string; glow: string; featuredPiece?: any; publicPath?: string }) {
  const resolvedPublicPath = publicPath ?? `/tools/${toolSlug}`;
  // Authored block text (paragraphs, headings, and faq items) may contain
  // {{dateNDaysAgo:90}}-style tokens (see src/lib/dynamicTokens.ts) so
  // date-relative Articles like "what was 90 days ago" stay correct
  // indefinitely instead of freezing at whatever date the content was written
  // on. Resolved here, before `hero`/`headings`/`faqItems`/`leadParagraph` are
  // derived, so every downstream consumer (ArticleBlocks, ArticleLeadParagraph,
  // ArticleSchema) already sees live values — mirrors the Event-side fix in
  // renderEventPage.tsx (EventPageContent, resolveDynamicTokensDeep on
  // content.body/heroFact/quickFacts/faqs).
  article.blocks = resolveDynamicTokensDeep(article.blocks);
  // The dek (shortAnswer) is rendered separately from blocks below, right under
  // the H1 -- it was missed by the blocks-only resolution above, so date-relative
  // shortAnswers were showing raw {{token}} text instead of the live value.
  article.dek = resolveDynamicTokensDeep(article.dek);
  const hero = extractHeroCountdown(article.blocks as any);
  // Duration-type questions (e.g. "how long until X kills you?") have no fixed
  // target date to count down to — they render a min/max range hero instead.
  // Only used when no hero_countdown block is present, so a dated question's
  // block-based hero always takes priority if both happen to be set.
  const heroDuration = !hero && article.questionType === 'DURATION' && article.heroData ? article.heroData : null;
  const headings = extractHeadings(article.blocks as any);
  const faqItems = extractFaq(article.blocks as any);
  const sources = extractSources(article.blocks as any);
  // Pulled out so the direct-answer paragraph can render immediately under the hero
  // image, ahead of the disclaimer/reviewer/TOC — remainingBlocks (not article.blocks)
  // is what gets passed into <ArticleBlocks> below so it isn't rendered a second time.
  const leadParagraph = extractLeadParagraph(article.blocks as any);
  const remainingBlocks = bodyBlocksWithoutLead(article.blocks as any);
  const tocHeadings = faqItems && faqItems.length > 0 ? [...headings, { id: 'faq', text: 'FAQs' }] : headings;

  const published = article.publishedAt ? new Date(article.publishedAt) : null;
  const updated = article.updatedAt ? new Date(article.updatedAt) : null;
  // Only show a separate "Updated" pill when it's meaningfully after publish —
  // otherwise every article would show it on day one, which reads as noise, not freshness.
  const showUpdated = published && updated && updated.getTime() - published.getTime() > 24 * 60 * 60 * 1000;
  const categoryDefault = pickDefaultImage(article.category?.slug, article.slug);
  const heroImageUrl = article.heroImageUrl || article.category?.featureImageUrl || categoryDefault;
  const affiliateBanner = await getAffiliateBanner(article.category?.slug);

  const catGlow = article.category?.slug ? getCategoryGlowRGB(article.category.slug) : null;
  const catLabel = article.category?.slug ? article.category.slug.charAt(0).toUpperCase() + article.category.slug.slice(1) : null;

  // Reviewer fallback chain: structured Reviewer record (only when explicitly
  // enabled by the admin) -> legacy free-text reviewerName -> no reviewer at
  // all (in which case ArticleAboutNote covers the trust-signal gap below).
  const structuredReviewer = article.reviewEnabled && article.reviewer ? article.reviewer : null;
  const legacyReviewerName = !structuredReviewer ? article.reviewerName : null;
  const hasAnyReviewer = !!structuredReviewer || !!legacyReviewerName;

  return (
    <article>
      <ArticleStyles />
      <ArticleSchema article={article} toolName={toolName} toolSlug={toolSlug} publicPath={resolvedPublicPath} />

      <nav className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/">Home</Link> / <Link href={resolvedPublicPath}>{toolName}</Link> / <span>{article.title}</span>
      </nav>

      {/* H1 + direct answer surface above the hero image/illustration, so both
          users and search bots see the actual answer without scrolling past a
          large image first. The live countdown/duration widget — the "primary
          summary calculation" — stays grouped with them, also above the image. */}
      <div className="article-prose">
        <p className="article-kicker text-caption mb-1" style={{ color: `rgb(${glow})` }}>{toolName.toUpperCase()}</p>

        <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
          <h1 className="article-h1">{article.title}</h1>
          {catGlow && catLabel && (
            <span
              className="article-kicker inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
              style={{
                background: `rgba(${catGlow}, 0.1)`,
                color: `rgb(${catGlow})`,
                border: `1px solid rgba(${catGlow}, 0.25)`,
              }}
            >
              {article.category?.emoji && <span>{article.category.emoji}</span>}
              <span>{catLabel}</span>
            </span>
          )}
        </div>

        <p className="article-dek mb-3">{article.dek}</p>

        {hero && <HeroCountdown targetDate={hero.targetDate} label={hero.label} glow={glow} />}
        {heroDuration && (
          <>
            <HeroDuration heroData={heroDuration} glow={glow} />
            <div className="mb-5"><EmbedDurationButton toolSlug={toolSlug} articleSlug={article.slug} title={article.title} id={article.id} /></div>
          </>
        )}

        <img src={heroImageUrl} alt={article.heroImageAlt || article.title} className="w-full rounded-2xl mb-5 article-glow-card" style={{ aspectRatio: '16/9', objectFit: 'cover' }} />

        {/* Direct-answer paragraph, immediately under the hero image — this is the
            "answer it fast" SEO/AEO requirement. Disclaimer/reviewer/TOC follow it,
            then the rest of the body (remainingBlocks) picks up from the 2nd block on. */}
        {leadParagraph && <ArticleLeadParagraph block={leadParagraph} />}

        <div className="article-kicker flex flex-wrap items-center gap-2 mb-6">
          <p className="text-caption m-0" style={{ color: 'var(--text-secondary)' }}>
            By <Link href="/about" className="hover:underline" style={{ color: 'inherit' }}>{article.authorName}</Link>{!showUpdated && published && ` · ${published.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`}
          </p>
          {showUpdated && (
            <span className="article-freshness-pill text-caption" style={{ color: `rgb(${glow})`, background: `rgba(${glow}, 0.1)`, border: `1px solid rgba(${glow}, 0.25)` }}>
              Updated {updated!.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          <LikeButton articleId={article.id} glow={glow} />
          <ShareButton glow={glow} title={article.title} id={article.id} type="article" shareCount={article.shareCount} />
        </div>

        {structuredReviewer && (
          <p className="article-kicker text-caption mb-4" style={{ color: 'var(--text-secondary)' }}>
            ✓ Medically reviewed by{' '}
            <Link href={`/reviewers/${structuredReviewer.slug}`} className="hover:underline" style={{ color: 'inherit' }}>
              {structuredReviewer.name}
            </Link>
            {structuredReviewer.credentials ? `, ${structuredReviewer.credentials}` : ''}
          </p>
        )}
        {legacyReviewerName && (
          <p className="article-kicker text-caption mb-4" style={{ color: 'var(--text-secondary)' }}>
            ✓ Medically reviewed by {legacyReviewerName}
            {article.reviewerCredentials ? `, ${article.reviewerCredentials}` : ''}
          </p>
        )}

        <ArticleDisclaimer categorySlug={article.category?.slug} glow={glow} />

        {/* Only shows when there's no reviewer set at all — the moment a structured
            or legacy reviewer is populated, the badge above takes over and this
            note disappears on its own. */}
        {!hasAnyReviewer && (
          <ArticleAboutNote authorName={article.authorName} updatedAt={article.updatedAt} categorySlug={article.category?.slug} glow={glow} />
        )}

        <ArticleTableOfContents headings={tocHeadings} glow={glow} />

        <ArticleBlocks toolSlug={toolSlug} blocks={remainingBlocks} glow={glow} subcategoryTools={article.subcategory?.tools ?? []} affiliateBanner={affiliateBanner} />

        {sources && sources.length > 0 && (
          <div className="mt-6">
            <SourcesFooter sources={sources} />
          </div>
        )}

        <ArticleFeaturedPiece piece={featuredPiece} glow={glow} />

        <AdSlot slotId="article-lower" />

        <RelatedArticles toolSlug={toolSlug} excludeSlug={article.slug} glow={glow} publicPath={resolvedPublicPath} />

        <div className="mt-10">
          <CommentThread subjectType="article" subjectId={article.id} glow={glow} />
        </div>
      </div>
    </article>
  );
}