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
import { ShareBar } from '@/components/ui/ShareBar';
import { EmbedCta } from '@/components/embed/EmbedCta';
import { RecentLogger } from '@/components/countdown/RecentLogger';
import { SignupTeaser } from '@/components/ui/SignupTeaser';
import { buildCountdownResponse } from '@/lib/countdown';
import type { EventContent } from '@/lib/seo';

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

  return (
    <>
      <PageJsonLd event={event} countdown={countdown} />
      <RecentLogger slug={rawSlug} name={event.name} />

      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="mb-4 flex justify-center">
          <CategoryBadge
            categorySlug={event.categorySlug}
            categoryName={event.category?.name}
            emoji={event.category?.emoji}
          />
        </div>

        <CountdownDisplay event={event} />
        <ShareBar name={event.name} slug={rawSlug} />
        <EmbedCta slug={rawSlug} />
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

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <RelatedEvents categorySlug={event.categorySlug} currentSlug={rawSlug} />
      </div>
    </>
  );
}
