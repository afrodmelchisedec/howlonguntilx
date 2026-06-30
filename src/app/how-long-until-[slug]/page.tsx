import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEventBySlug, incrementViews } from '@/lib/events';
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay';
import { EventSchema } from '@/components/countdown/EventSchema';
import { RelatedEvents } from '@/components/countdown/RelatedEvents';

interface Props { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return {};
  return {
    title: `How Long Until ${event.name}`,
    description: `Live countdown to ${event.name}.`,
  };
}

export default async function EventPage({ params }: Props) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();
  await incrementViews(params.slug);
  return (
    <>
      <EventSchema event={event} />
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <CountdownDisplay event={event} />
        <RelatedEvents category={event.category} currentSlug={params.slug} />
      </div>
    </>
  );
}