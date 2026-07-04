import { buildFaqList, prettifySlug, type EventContent } from '@/lib/seo';

interface EventLike {
  slug: string;
  name: string;
  description?: string | null;
  targetDate: Date | string;
  type: 'COUNTDOWN' | 'ELAPSED' | 'RELATIVE';
  categorySlug: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  content?: unknown;
}

interface Props {
  event: EventLike;
  countdown: { days_left: number; hours_left: number };
}

export function PageJsonLd({ event, countdown }: Props) {
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  const url = `${base}/how-long-until-${event.slug}`;
  const content = (event.content ?? {}) as EventContent;
  const categoryLabel = prettifySlug(event.categorySlug);
  const description = event.description ?? `Live countdown to ${event.name}. Updated every second.`;
  const faqs = buildFaqList(event, countdown, content.faqs);

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: base },
        { '@type': 'ListItem', position: 2, name: categoryLabel, item: `${base}/categories/${event.categorySlug}` },
        { '@type': 'ListItem', position: 3, name: `How Long Until ${event.name}`, item: url },
      ],
    },
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: `How Long Until ${event.name}`,
      description,
      datePublished: new Date(event.createdAt).toISOString(),
      dateModified: new Date(event.updatedAt).toISOString(),
      isPartOf: { '@type': 'WebSite', name: 'HowLongUntilX', url: base },
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  // Only claim schema.org/Event for genuinely scheduled, dated occurrences.
  // We don't have a location, so we deliberately don't try to qualify for
  // the Event rich-result card — just the semantic markup for AI/GEO parsing.
  if (event.type === 'COUNTDOWN') {
    graph.push({
      '@type': 'Event',
      name: event.name,
      description,
      startDate: new Date(event.targetDate).toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      url,
    });
  }

  const schema = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
