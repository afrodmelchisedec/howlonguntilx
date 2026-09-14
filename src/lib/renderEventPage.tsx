import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug, incrementViews } from '@/lib/events';
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay';
import { PageJsonLd } from '@/components/countdown/PageJsonLd';
import { FaqSchema } from '@/components/countdown/FaqSchema';
import { RelatedEvents } from '@/components/countdown/RelatedEvents';
import { QuickFacts } from '@/components/countdown/QuickFacts';
import { EventTimeline } from '@/components/countdown/EventTimeline';
import { SourcesFooter } from '@/components/countdown/SourcesFooter';
import { CategoryBadge } from '@/components/countdown/CategoryBadge';
import { CategoryTool } from '@/components/pro-tools/CategoryTool';
import { ShareBar } from '@/components/ui/ShareBar';
import { EventLikeButton } from '@/components/countdown/EventLikeButton';
import { EmbedCta } from '@/components/embed/EmbedCta';
import { RecentLogger } from '@/components/countdown/RecentLogger';
import { SignupTeaser } from '@/components/ui/SignupTeaser';
import { StarField } from '@/components/ui/StarField';
import { EventBody, EventLeadParagraph } from '@/components/countdown/EventBody';
import { pickDefaultImage } from '@/lib/defaultImages';
import { getAffiliateBanner } from '@/lib/affiliateBanners';
import { AffiliateBanner } from '@/components/articles/AffiliateBanner';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { buildCountdownResponse } from '@/lib/countdown';
import type { EventContent } from '@/lib/seo';
import { ArticleDisclaimer } from '@/components/articles/ArticleDisclaimer';
import { ArticleAboutNote } from '@/components/articles/ArticleAboutNote';
import { AdSlot } from '@/components/articles/AdSlot';
import { CommentThread } from '@/components/community/CommentThread';
import { ArticleTableOfContents } from '@/components/articles/ArticleTableOfContents';
import { ArticleSchema } from '@/components/articles/ArticleSchema';
import { extractHeadings, extractFaq } from '@/components/articles/ArticleBlocks';
import { resolveDynamicTokensDeep } from '@/lib/dynamicTokens';
import { resolveRecurrenceDate } from '@/lib/dateResolvers';

// Shared render logic for the Event ("Timer") content type. Extracted from
// src/app/[slug]/page.tsx during the /questions merge so both the legacy
// /how-long-until-<slug> route AND the new /questions/[slug] route call the
// exact same rendering + metadata logic. Do not fork this file per-route —
// if the two routes need different behavior, that's a signal something in
// the merge plan needs rethinking, not a reason to duplicate this code.

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';

export async function generateEventMetadata(rawSlug: string, canonicalPath: string): Promise<Metadata> {
  const event = await getEventBySlug(rawSlug);
  if (!event) return {};
  // Evergreen bare-slug events (recurrenceKey set) recompute their live target
  // date on every request instead of trusting the stored targetDate column —
  // see the matching override in EventPageContent below.
  const metaContent = (event.content ?? {}) as EventContent;
  const metaTargetDate = metaContent.recurrenceKey
    ? (resolveRecurrenceDate(metaContent.recurrenceKey) ?? event.targetDate)
    : event.targetDate;
  const { days_left, is_past, elapsed_days } = buildCountdownResponse(event.name, new Date(metaTargetDate));
  // days_left is clamped to 0 once the event is past (see countdown.ts) — the
  // metadata copy has to branch on is_past and read elapsed_days instead, or
  // past-dated pages permanently read "Exactly 0 days until X".
  const days = is_past ? elapsed_days : days_left;
  const description = event.description
    ?? (is_past
      ? `${event.name} was ${days} days ago. Live elapsed-time tracker updated every second.`
      : `Exactly ${days_left} days until ${event.name}. Live countdown updated every second.`);
  const ogTitle = is_past ? `${days} days since ${event.name}` : `${days_left} days until ${event.name}`;

  return {
    title: is_past ? `${event.name} — ${days} Days Ago` : `How Long Until ${event.name} — ${days_left} Days Left`,
    description,
    alternates: { canonical: `${SITE_URL}${canonicalPath}` },
    openGraph: {
      title: ogTitle,
      description,
      images: [{ url: `${SITE_URL}/api/og?event=${encodeURIComponent(event.name)}&days=${days}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      images: [`${SITE_URL}/api/og?event=${encodeURIComponent(event.name)}&days=${days}`],
    },
  };
}

export async function EventPageContent({ rawSlug }: { rawSlug: string }) {
  const event = await getEventBySlug(rawSlug);
  if (!event) notFound();
  // Fire-and-forget: the view counter has no reason to block the page render.
  // Awaiting this added a full extra DB round trip to every page load.
  incrementViews(rawSlug).catch(() => {});

  const content = (event.content ?? {}) as EventContent;
  // Evergreen bare-slug events (recurrenceKey set) never store a "current"
  // targetDate to bump annually -- it's recomputed fresh on every request,
  // and a shallow clone carrying that live date is used everywhere below
  // (countdown widget, JSON-LD, FAQ schema, QuickFacts) so every consumer
  // sees the correct date without each one needing its own fix.
  const resolvedTargetDate = content.recurrenceKey
    ? (resolveRecurrenceDate(content.recurrenceKey) ?? event.targetDate)
    : event.targetDate;
  const liveEvent = resolvedTargetDate !== event.targetDate ? { ...event, targetDate: resolvedTargetDate } : event;

  const countdown = buildCountdownResponse(liveEvent.name, new Date(liveEvent.targetDate));
  const weeks = Math.floor(countdown.days_left / 7);
  const months = Math.floor(countdown.days_left / 30);
  const hoursTotal = countdown.days_left * 24 + countdown.hours_left;
  // Authored body/heroFact/quickFacts text may contain {{daysSince:YYYY-MM-DD}}-
  // style tokens (see src/lib/dynamicTokens.ts) so date-relative numbers like
  // "2,446 days ago" stay correct indefinitely instead of freezing at the
  // moment the content was written. Resolved here, before `blocks` is
  // derived, so every downstream consumer (EventBody, extractFaq/extractHeadings,
  // ArticleSchema) already sees live values.
  content.body = resolveDynamicTokensDeep(content.body);
  content.heroFact = resolveDynamicTokensDeep(content.heroFact);
  content.quickFacts = resolveDynamicTokensDeep(content.quickFacts);
  content.faqs = resolveDynamicTokensDeep(content.faqs);
  // "Other years" cross-nav — content.relatedSlugs is a reserved EventContent
  // field with no prior renderer; wiring it here lets yearly countdown pages
  // link to their sibling years (see yearlyEventTemplates.ts) without relying
  // on RelatedEvents' category-based (views-ordered) matching, which can't
  // guarantee it surfaces the right neighboring years.
  const relatedYearEvents = content.relatedSlugs && content.relatedSlugs.length > 0
    ? (await Promise.all(content.relatedSlugs.map(s => getEventBySlug(s)))).filter((e): e is NonNullable<typeof e> => !!e)
    : [];
  const categoryDefault = pickDefaultImage(event.categorySlug, event.slug);
  const heroImageUrl = event.heroImageUrl || event.category?.featureImageUrl || categoryDefault;
  const updated = event.updatedAt ? new Date(event.updatedAt) : null;
  const affiliateBanner = await getAffiliateBanner(event.categorySlug);

  const glow = getCategoryGlowRGB(event.categorySlug);
  const structuredReviewer = (event as any).reviewEnabled && (event as any).reviewer ? (event as any).reviewer : null;
  const legacyReviewerName = !structuredReviewer ? event.reviewerName : null;
  const blocks = Array.isArray(content.body) ? content.body : [];
  const headings = extractHeadings(blocks as any);
  const faqItems = extractFaq(blocks as any);
  const tocHeadings = faqItems && faqItems.length > 0 ? [...headings, { id: 'faq', text: 'FAQs' }] : headings;
  // Direct-answer paragraph — same SEO/AEO reasoning as the Article-side fix in
  // ArticleLayout.tsx: render it immediately under the hero image, ahead of the
  // disclaimer/reviewer/TOC, instead of it being buried wherever EventBody happens
  // to render it. NOTE: this pulls straight off the raw `blocks` array rather than
  // reusing ArticleBlocks' bodyBlocksWithoutLead — that helper filters out
  // 'sources'-type blocks (correct for Article, which renders sources separately),
  // but EventBody renders 'sources' blocks inline, so reusing it here would silently
  // drop any sources block from the page.
  const leadParagraph = blocks[0]?.type === 'paragraph' ? blocks[0] : null;
  const remainingBlocks = leadParagraph ? blocks.slice(1) : blocks;

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10">
        <PageJsonLd event={liveEvent} countdown={countdown} />
        <ArticleSchema
          article={{
            id: event.id,
            slug: rawSlug,
            title: event.name + ' - Countdown',
            dek: event.description || 'Countdown to ' + event.name,
            heroImageUrl: heroImageUrl,
            authorName: event.authorName || 'HowLongUntilX',
            reviewer: structuredReviewer || undefined,
            reviewEnabled: (event as any).reviewEnabled,
            reviewerName: event.reviewerName || undefined,
            reviewerCredentials: event.reviewerCredentials || undefined,
            publishedAt: event.createdAt,
            updatedAt: event.updatedAt,
            blocks: blocks as any,
          }}
          toolName={event.category?.name || 'Countdown'}
          toolSlug={event.categorySlug || 'events'}
        />
        <RecentLogger slug={rawSlug} name={event.name} />

        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="mb-4 flex justify-center">
            <CategoryBadge
              categorySlug={event.categorySlug}
              categoryName={event.category?.name}
              emoji={event.category?.emoji}
            />
          </div>

          <img
            src={heroImageUrl}
            alt={event.heroImageAlt || event.name}
            className="w-full rounded-2xl mb-5"
            style={{ aspectRatio: '16/9', objectFit: 'cover', maxWidth: 560, margin: '0 auto 20px' }}
          />

          {leadParagraph && (
            <div className="max-w-2xl mx-auto px-4 pb-4 text-left">
              <EventLeadParagraph block={leadParagraph} />
            </div>
          )}

          <p className="text-caption mb-6" style={{ color: 'var(--text-secondary)' }}>
            By {event.authorName}{updated ? ` · Updated ${updated.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
            {structuredReviewer && (
              <>
                {' '}· Reviewed by{' '}
                <Link href={`/reviewers/${structuredReviewer.slug}`} className="hover:underline" style={{ color: 'inherit' }}>
                  {structuredReviewer.name}
                </Link>
                {structuredReviewer.credentials ? `, ${structuredReviewer.credentials}` : ''}
              </>
            )}
            {legacyReviewerName && (
              <> · Reviewed by {legacyReviewerName}{event.reviewerCredentials ? `, ${event.reviewerCredentials}` : ''}</>
            )}
          </p>

          <CountdownDisplay event={liveEvent} glow={glow} provisional={(event.content as EventContent | null)?.provisional} />
          <ShareBar name={event.name} slug={rawSlug} id={event.id} type="event" shareCount={event.shareCount} />
          <div className="mt-4"><EventLikeButton eventId={event.id} glow={glow} /></div>
          <EmbedCta slug={rawSlug} />

          <div className="max-w-2xl mx-auto px-4 pb-4 text-left">
            <ArticleDisclaimer categorySlug={event.categorySlug} glow={glow} />
            {!structuredReviewer && !legacyReviewerName && (
              <ArticleAboutNote
                authorName={event.authorName}
                updatedAt={event.updatedAt}
                categorySlug={event.categorySlug}
                glow={glow}
              />
            )}
          </div>

          {tocHeadings.length > 1 && (
            <div className="max-w-2xl mx-auto px-4 pb-4">
              <ArticleTableOfContents headings={tocHeadings} glow={glow} />
            </div>
          )}

          <div className="max-w-2xl mx-auto px-4 pb-4">
            <AdSlot slotId="event-hero" minHeight={280} />
          </div>

          <EventBody blocks={remainingBlocks} glow={glow} />

          {affiliateBanner && (
            <div className="max-w-2xl mx-auto px-4">
              <AffiliateBanner banner={affiliateBanner} glow={glow} />
            </div>
          )}
          {faqItems && faqItems.length > 0 && (
            <div id="faq" className="max-w-2xl mx-auto px-4 pb-8 scroll-mt-24">
              <h2 className="text-title3 mb-3">Frequently asked questions</h2>
              <div className="flex flex-col gap-2">
                {faqItems.map((item, i) => (
                  <details
                    key={i}
                    className="ios-card-nested p-4 anim-fade-up"
                    style={{
                      animationDelay: (i * 70) + 'ms',
                      border: '1px solid rgba(' + glow + ', 0.15)',
                    }}
                  >
                    <summary className="text-headline cursor-pointer" style={{ color: 'rgb(' + glow + ')' }}>
                      {item.q}
                    </summary>
                    <p className="text-footnote mt-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-2xl mx-auto px-4 pb-4">
            <AdSlot slotId="event-lower" minHeight={280} />
          </div>
        </div>

        {content.heroFact && (
          <div className="max-w-2xl mx-auto px-4 pb-8 text-left">
            <div className="ios-card p-5" style={{ borderLeft: '3px solid rgb(var(--accent-brand))' }}>
              <p className="text-callout">{content.heroFact}</p>
            </div>
          </div>
        )}

        {relatedYearEvents.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-8 text-left">
            <p className="text-caption font-bold mb-2" style={{ color: 'rgb(' + glow + ')', letterSpacing: '0.05em' }}>OTHER YEARS</p>
            <div className="flex flex-wrap gap-2">
              {relatedYearEvents.map(re => (
                <Link
                  key={re.slug}
                  href={'/questions/' + re.slug}
                  className="ios-card-nested press px-3 py-1.5 text-sm rounded-full"
                  style={{ border: '1px solid rgba(' + glow + ', 0.25)' }}
                >
                  {re.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <QuickFacts
            days={countdown.days_left}
            weeks={weeks}
            months={months}
            hoursTotal={hoursTotal}
            eventName={liveEvent.name}
            targetDate={liveEvent.targetDate}
            extra={content.quickFacts}
          />
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <CategoryTool categorySlug={event.categorySlug} eventName={event.name} subcategoryTools={event.subcategory?.tools as any} />
        </div>

        {content.timeline && content.timeline.length > 0 && (
          <div className="max-w-2xl mx-auto px-4 pb-8">
            <EventTimeline items={content.timeline} />
          </div>
        )}

        <FaqSchema event={liveEvent} countdown={countdown} />

        {(content.sources?.length || content.lastReviewed) && (
          <div className="max-w-2xl mx-auto px-4 pb-8">
            <SourcesFooter sources={content.sources} lastReviewed={content.lastReviewed} />
          </div>
        )}

        <SignupTeaser eventName={event.name} />

        <div className="max-w-2xl mx-auto px-4 pb-8" id="comments-section">
          <CommentThread subjectType="event" subjectId={event.id} glow={glow} />
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-12">
          <RelatedEvents categorySlug={event.categorySlug} currentSlug={rawSlug} />
        </div>
      </div>
    </div>
  );
}