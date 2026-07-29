import Link from 'next/link';
import { getRelatedEvents } from '@/lib/events';

interface Props { categorySlug: string; currentSlug: string }

export async function RelatedEvents({ categorySlug, currentSlug }: Props) {
  const events = await getRelatedEvents(categorySlug, currentSlug);
  if (!events.length) return null;

  return (
    <div className="mt-12 text-left">
      <p className="text-caption mb-3" style={{ color: 'var(--text-secondary)' }}>Related events</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {events.slice(0, 3).map(ev => {
          const daysLeft = Math.ceil((new Date(ev.targetDate).getTime() - Date.now()) / 86400000);
          return (
            <Link
              key={ev.slug}
              href={`/how-long-until-${ev.slug}`}
              className="ios-card-nested press p-4 flex flex-col hover:translate-y-[-2px] transition-all"
              style={{
                border: '1px solid var(--border-hairline)',
                background: 'var(--bg-elevated)',
              }}
            >
              <span className="text-footnote font-bold" style={{ color: 'rgb(var(--accent-brand))' }}>
                {daysLeft > 0 ? `${daysLeft}d` : 'Today'}
              </span>
              <span className="text-headline mt-1">{ev.name}</span>
              <span className="text-caption mt-1" style={{ color: 'var(--text-secondary)' }}>
                {ev.category?.name || 'Event'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
