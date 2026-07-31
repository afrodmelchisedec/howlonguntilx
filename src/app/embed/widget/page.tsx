import { getEventBySlug } from '@/lib/events';
import { parseEventQuery } from '@/lib/parseEvent';
import { EmbedWidget } from '@/components/embed/EmbedWidget';

interface Props { searchParams: { event?: string; theme?: string } }

export default async function EmbedWidgetPage({ searchParams }: Props) {
  const slug = searchParams.event ?? 'christmas';
  const theme = searchParams.theme === 'dark' ? 'dark' : 'light';

  const dbEvent = await getEventBySlug(slug.toLowerCase().replace(/\s+/g, '-'));

  let event: { name: string; targetDate: Date | string } | null = null;
  if (dbEvent) {
    event = { name: dbEvent.name, targetDate: dbEvent.targetDate };
  } else {
    // Same fallback the Countdown API uses — "halloween", "new year",
    // or a free-text date not already tracked in the database.
    const parsed = parseEventQuery(slug);
    if (parsed) event = { name: slug, targetDate: parsed };
  }

  return <EmbedWidget event={event} theme={theme} />;
}