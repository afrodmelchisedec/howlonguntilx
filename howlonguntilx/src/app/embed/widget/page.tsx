import { getEventBySlug } from '@/lib/events';
import { EmbedWidget } from '@/components/embed/EmbedWidget';

interface Props { searchParams: { event?: string } }

export default async function EmbedWidgetPage({ searchParams }: Props) {
  const slug = searchParams.event ?? 'christmas';
  const event = await getEventBySlug(slug);
  return <EmbedWidget event={event} />;
}
