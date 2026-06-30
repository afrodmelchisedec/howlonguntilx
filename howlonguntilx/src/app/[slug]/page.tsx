
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug, incrementViews, getAllEventSlugs } from '@/lib/events';
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay';
import { EventSchema } from '@/components/countdown/EventSchema';
import { FaqSchema } from '@/components/countdown/FaqSchema';
import { RelatedEvents } from '@/components/countdown/RelatedEvents';
import { ShareBar } from '@/components/ui/ShareBar';
import { EmbedCta } from '@/components/embed/EmbedCta';
import { RecentLogger } from '@/components/countdown/RecentLogger';
import { SignupTeaser } from '@/components/ui/SignupTeaser';
import { BreadcrumbSchema } from '@/components/countdown/BreadcrumbSchema';
import { buildCountdownResponse } from '@/lib/countdown';

interface Props { params: { slug: string } }

// Pre-generate all known event pages at build time
export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map(slug => ({ slug: 'how-long-until-' + slug }));
}

// Revalidate every hour so countdowns stay fresh
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSlug = params.slug.replace('how-long-until-', '');
  const event = await getEventBySlug(rawSlug);
  if (!event) return {};
  const { days_left } = buildCountdownResponse(event.name, new Date(event.targetDate));
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  return {
    title: 'How Long Until ' + event.name + ' — ' + days_left + ' Days Left',
    description: 'Exactly ' + days_left + ' days until ' + event.name + '. Live countdown updated every second.',
    alternates: { canonical: base + '/how-long-until-' + rawSlug },
    openGraph: {
      title: days_left + ' days until ' + event.name,
      description: 'Live real-time countdown to ' + event.name,
      images: [{ url: base + '/api/og?event=' + encodeURIComponent(event.name) + '&days=' + days_left, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: days_left + ' days until ' + event.name,
      images: [base + '/api/og?event=' + encodeURIComponent(event.name) + '&days=' + days_left],
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

  return (
    <>
      <EventSchema event={event} />
      <BreadcrumbSchema event={event} />
      <RecentLogger slug={rawSlug} name={event.name} />

      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <CountdownDisplay event={event} />
        <ShareBar name={event.name} slug={rawSlug} />
        <EmbedCta slug={rawSlug} />
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-8">
        <div className="float glow gc-brand card-base border border-gray-100 dark:border-gray-800 rounded-2xl p-6"
          style={{'--glow':'83,74,183'} as React.CSSProperties}>
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">By the numbers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {[
              { val: countdown.days_left.toLocaleString(), label: 'Days' },
              { val: weeks.toLocaleString(), label: 'Weeks' },
              { val: months.toLocaleString(), label: 'Months' },
              { val: hoursTotal.toLocaleString(), label: 'Hours' },
            ].map(item => (
              <div key={item.label} className="text-center bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
                <div className="text-2xl font-black text-brand-500">{item.val}</div>
                <div className="text-xs text-gray-400 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {event.name} is on <strong>{new Date(event.targetDate).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</strong>.
            About {weeks} weeks or {months} months from now — {hoursTotal.toLocaleString()} total hours.
          </p>
        </div>
      </div>

      <FaqSchema event={event} countdown={countdown} />
      <SignupTeaser eventName={event.name} />

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <RelatedEvents category={event.category} currentSlug={rawSlug} />
      </div>
    </>
  );
}
