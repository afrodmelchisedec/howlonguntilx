import Link from 'next/link';
import { buildCountdownResponse } from '@/lib/countdown';
import { getCategoryGlow, prettifySlug } from '@/lib/seo';

interface Event { slug: string; name: string; targetDate: Date | string; categorySlug: string }

export function PopularGrid({ events }: { events: Event[] }) {
  return (
    <div>
      <p className="text-caption mb-4">Popular countdowns</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sg">
        {events.map((ev, i) => {
          const { days_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
          const glow = getCategoryGlow(ev.categorySlug);
          return (
            <Link key={ev.slug} href={'/how-long-until-' + ev.slug}
              className={`ios-card interactive glow gc-${glow} anim-fade-up block relative overflow-hidden p-4`}
              style={{ animationDelay: (i * 55) + 'ms' }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'rgb(var(--glow))' }} />
              <div className="text-caption mb-1">{prettifySlug(ev.categorySlug)}</div>
              <div className="text-sm font-bold mb-1.5 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{ev.name}</div>
              <div className="text-2xl font-black tabular leading-none mb-0.5" style={{ color: 'rgb(var(--glow))' }}>{days_left}</div>
              <div className="text-footnote mb-2">days left</div>
              <div className="progress-track" style={{ height: 4 }}>
                <div className="progress-fill" style={{ width: progress_percent + '%', background: 'rgb(var(--glow))' }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
