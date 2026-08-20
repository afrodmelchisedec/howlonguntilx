import { getEventBySlug } from '@/lib/events';
import { parseEventQuery } from '@/lib/parseEvent';
import { EmbedWidget } from '@/components/embed/EmbedWidget';
import { prisma } from '@/lib/db';

interface Props { searchParams: { event?: string; theme?: string } }

export default async function EmbedWidgetPage({ searchParams }: Props) {
  const slug = searchParams.event ?? 'christmas';
  const theme = searchParams.theme === 'dark' ? 'dark' : 'light';
  const normalizedSlug = slug.toLowerCase().replace(/\s+/g, '-');

  const dbEvent = await getEventBySlug(normalizedSlug);

  let event: { name: string; targetDate: Date | string } | null = null;
  if (dbEvent) {
    event = { name: dbEvent.name, targetDate: dbEvent.targetDate };
  } else {
    // Try a community UserEvent next. Only PUBLIC + APPROVED events are
    // embeddable — the embed endpoint has no auth check, so a PRIVATE
    // event's slug shouldn't be embeddable on a third-party site even
    // if someone has the URL.
    const userEvent = await prisma.userEvent.findFirst({
      where: { slug: normalizedSlug, visibility: 'PUBLIC', moderationStatus: 'APPROVED', author: { blockedAt: null } },
      select: { title: true, targetDate: true },
    });
    if (userEvent) {
      event = { name: userEvent.title, targetDate: userEvent.targetDate };
    } else {
      // Same fallback the Countdown API uses — "halloween", "new year",
      // or a free-text date not already tracked in the database.
      const parsed = parseEventQuery(slug);
      if (parsed) event = { name: slug, targetDate: parsed };
    }
  }

  return <EmbedWidget event={event} theme={theme} />;
}
