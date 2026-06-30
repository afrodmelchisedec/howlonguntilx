interface Event { name: string; targetDate: Date | string; slug: string }
interface Props { event: Event }

export function EventSchema({ event }: Props) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: new Date(event.targetDate).toISOString(),
    url: `https://howlonguntilx.com/how-long-until-${event.slug}`,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
