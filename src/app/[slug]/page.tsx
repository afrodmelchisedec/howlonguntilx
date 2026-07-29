import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug, incrementViews, getAllEventSlugs } from '@/lib/events';
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
import { EmbedCta } from '@/components/embed/EmbedCta';
import { RecentLogger } from '@/components/countdown/RecentLogger';
import { SignupTeaser } from '@/components/ui/SignupTeaser';
import { StarField } from '@/components/ui/StarField';
import { EventBody } from '@/components/countdown/EventBody';
import { pickDefaultImage } from '@/lib/defaultImages';
import { getAffiliateBanner } from '@/lib/affiliateBanners';
import { AffiliateBanner } from '@/components/articles/AffiliateBanner';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { buildCountdownResponse } from '@/lib/countdown';
import type { EventContent } from '@/lib/seo';
import { ArticleDisclaimer } from '@/components/articles/ArticleDisclaimer';
import { ArticleAboutNote } from '@/components/articles/ArticleAboutNote';
import { AdSlot } from '@/components/articles/AdSlot';
import { ArticleCommentSection } from '@/components/articles/ArticleCommentSection';
import { ArticleTableOfContents } from '@/components/articles/ArticleTableOfContents';
import { ArticleSchema } from '@/components/articles/ArticleSchema';
import { extractHeadings, extractFaq } from '@/components/articles/ArticleBlocks';

interface Props { params: { slug: string } }

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map(slug => ({ slug: 'how-long-until-' + slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSlug = params.slug.replace('how-long-until-', '');
  const event = await getEventBySlug(rawSlug);
  if (!event) return {};
  const { days_left } = buildCountdownResponse(event.name, new Date(event.targetDate));
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const description = event.description
    ?? `Exactly ${days_left} days until ${event.name}. Live countdown updated every second.`;

  return {
    title: `How Long Until ${event.name} — ${days_left} Days Left`,
    description,
    alternates: { canonical: `${base}/how-long-until-${rawSlug}` },
    openGraph: {
      title: `${days_left} days until ${event.name}`,
      description,
      images: [{ url: `${base}/api/og?event=${encodeURIComponent(event.name)}&days=${days_left}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${days_left} days until ${event.name}`,
      images: [`${base}/api/og?event=${encodeURIComponent(event.name)}&days=${days_left}`],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const rawSlug = params.slug.replace('how-long-until-', '');
  const event = await getEventBySlug(rawSlug);
  if (!event) notFound();
  await incrementViews(rawSlug);

  const countdown = buildCountdownResponse(event.name, new Date(event.targetDate));
  const weeks = Math.floor(countdown.days_left / 7);
  const months = Math.floor(countdown.days_left / 30);
  const hoursTotal = countdown.days_left * 24 + countdown.hours_left;
  const content = (event.content ?? {}) as EventContent;
  const categoryDefault = pickDefaultImage(event.categorySlug, event.slug);
  const heroImageUrl = event.heroImageUrl || event.category?.featureImageUrl || categoryDefault;
  const updated = event.updatedAt ? new Date(event.updatedAt) : null;
  const affiliateBanner = await getAffiliateBanner(event.categorySlug);

  const glow = getCategoryGlowRGB(event.categorySlug);
  const blocks = Array.isArray(content.body) ? content.body : [];
  const headings = extractHeadings(blocks.map(b => ({ ...b, type: b.type })));
  const faqItems = extractFaq(blocks.map(b => ({ ...b, type: b.type })));
  const tocHeadings = faqItems && faqItems.length > 0 ? [...headings, { id: 'faq', text: 'FAQs' }] : headings;

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10">
        <PageJsonLd event={event} countdown={countdown} />
        <ArticleSchema
          article={{
            id: event.id,
            slug: rawSlug,
            title: event.name + ' - Countdown',
            dek: event.description || 'Countdown to ' + event.name,
            heroImageUrl: heroImageUrl,
            authorName: event.authorName || 'HowLongUntilX',
            reviewerName: event.reviewerName || undefined,
            reviewerCredentials: event.reviewerCredentials || undefined,
            publishedAt: event.createdAt,
            updatedAt: event.updatedAt,
            blocks: blocks.map(b => ({ ...b, type: b.type })),
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
          <p className="text-caption mb-6" style={{ color: 'var(--text-secondary)' }}>
            By {event.authorName}{updated ? ` · Updated ${updated.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
            {event.reviewerName && (
              <> · Reviewed by {event.reviewerName}{event.reviewerCredentials ? `, ${event.reviewerCredentials}` : ''}</>
            )}
          </p>

          <CountdownDisplay event={event} glow={glow} />
          <ShareBar name={event.name} slug={rawSlug} />
          <EmbedCta slug={rawSlug} />

          {/* Disclaimer and About note */}
          <div className="max-w-2xl mx-auto px-4 pb-4 text-left">
            <ArticleDisclaimer categorySlug={event.categorySlug} glow={glow} />
            {!event.reviewerName && (
              <ArticleAboutNote
                authorName={event.authorName}
                updatedAt={event.updatedAt}
                categorySlug={event.categorySlug}
                glow={glow}
              />
            )}
          </div>

          {/* Table of Contents */}
          {tocHeadings.length > 1 && (
            <div className="max-w-2xl mx-auto px-4 pb-4">
              <ArticleTableOfContents headings={tocHeadings} glow={glow} />
            </div>
          )}

          {/* Ad Slot after hero */}
          <div className="max-w-2xl mx-auto px-4 pb-4">
            <AdSlot slotId="event-hero" minHeight={280} />
          </div>

          {/* Event Body (rich blocks) */}
          <EventBody blocks={blocks} glow={glow} />

          {affiliateBanner && (
            <div className="max-w-2xl mx-auto px-4">
              <AffiliateBanner banner={affiliateBanner} glow={glow} />
            </div>
          )}
          {/* FAQ section rendered from content.faqs */}
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

          {/* Ad Slot before related */}
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

        <div className="max-w-2xl mx-auto px-4 pb-8">
          <QuickFacts
            days={countdown.days_left}
            weeks={weeks}
            months={months}
            hoursTotal={hoursTotal}
            eventName={event.name}
            targetDate={event.targetDate}
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

        <FaqSchema event={event} countdown={countdown} />

        {(content.sources?.length || content.lastReviewed) && (
          <div className="max-w-2xl mx-auto px-4 pb-8">
            <SourcesFooter sources={content.sources} lastReviewed={content.lastReviewed} />
          </div>
        )}

        <SignupTeaser eventName={event.name} />

        {/* Comments section */}
        <div className="max-w-2xl mx-auto px-4 pb-8" id="comments-section">
          <ArticleCommentSection glow={glow} />
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-12">
          <RelatedEvents categorySlug={event.categorySlug} currentSlug={rawSlug} />
        </div>
      </div>
    </div>
  );
}
