// FILE: src/components/countdown/RelatedEvents.tsx
import Link from 'next/link';
import { getRelatedEvents } from '@/lib/events';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { pickDefaultImage } from '@/lib/defaultImages';
import type { EventContent } from '@/lib/seo';

// First paragraph-type block's text from an Event's rich body content —
// same source the Event detail page itself renders, so the snippet here
// matches what the reader actually sees on click-through. Falls back to
// the plain `description` field (nullable, often shorter/absent) only
// when the event has no body blocks at all.
function firstParagraph(ev: { content: unknown; description: string | null }): string | null {
  const eventContent = (ev.content ?? {}) as EventContent;
  const blocks = Array.isArray(eventContent.body) ? eventContent.body : [];
  const para = blocks.find(b => b.type === 'paragraph');
  return para?.text || ev.description || null;
}

interface Props { categorySlug: string; currentSlug: string }

// Mirrors ArticleCard's visual treatment (hero image, category-color
// border tint, category pill styled with the same category's glow color)
// so Event and Article related-content cards read as the same product,
// per user request. Event-specific bits (live days-left, the
// /questions/how-long-until-<slug> link shape) are kept as-is.
export async function RelatedEvents({ categorySlug, currentSlug }: Props) {
  const events = await getRelatedEvents(categorySlug, currentSlug);
  if (!events.length) return null;

  return (
    <div className="mt-12 text-left">
      <p className="text-title3 mb-4">Related events</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {events.slice(0, 3).map(ev => {
          const daysLeft = Math.ceil((new Date(ev.targetDate).getTime() - Date.now()) / 86400000);
          const catSlug = ev.category?.slug ?? ev.categorySlug ?? null;
          const catGlow = getCategoryGlowRGB(catSlug);
          const catLabel = ev.category?.name ?? (catSlug ? catSlug.charAt(0).toUpperCase() + catSlug.slice(1) : null);
          const catEmoji = ev.category?.emoji ?? null;
          const imageUrl = ev.heroImageUrl || pickDefaultImage(catSlug, ev.slug);
          const snippet = firstParagraph(ev);

          return (
            <Link
              key={ev.slug}
              href={`/questions/how-long-until-${ev.slug}`}
              className="article-glow-card ios-card-nested press flex flex-col overflow-hidden anim-fade-up"
              style={{ border: `1px solid rgba(${catGlow}, 0.2)` }}
            >
              <img
                src={imageUrl}
                alt={ev.name}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
              <div className="p-4 flex flex-col flex-1">
                <span className="text-footnote font-bold" style={{ color: `rgb(${catGlow})` }}>
                  {daysLeft > 0 ? `${daysLeft}d left` : 'Today'}
                </span>
                <p className="text-headline mt-1">{ev.name}</p>
                {snippet && (
                  <p className="text-footnote flex-1 mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{snippet}</p>
                )}
                {catLabel && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 self-start"
                    style={{
                      background: `rgba(${catGlow}, 0.1)`,
                      color: `rgb(${catGlow})`,
                      border: `1px solid rgba(${catGlow}, 0.25)`,
                      pointerEvents: 'none',
                    }}
                  >
                    {catEmoji && <span>{catEmoji}</span>}
                    <span>{catLabel}</span>
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
