import Link from 'next/link';
import { getRelatedEvents } from '@/lib/events';

interface Props { category: string; currentSlug: string }

export async function RelatedEvents({ category, currentSlug }: Props) {
  const events = await getRelatedEvents(category, currentSlug);
  if (!events.length) return null;
  return (
    <div className="mt-12 text-left">
      <p className="text-caption mb-3">Related</p>
      <div className="flex flex-wrap gap-2">
        {events.map(ev => (
          <Link
            key={ev.slug}
            href={`/how-long-until-${ev.slug}`}
            className="press px-3 py-1.5 rounded-full text-sm transition-colors"
            style={{ border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}
          >
            {ev.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
