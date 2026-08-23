// FILE: src/components/questions/QuestionCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { buildCountdownResponse } from '@/lib/countdown';
import { getCategoryGlowRGB, getCategoryTextRGB } from '@/lib/categoryGlow';
import { pickDefaultImage } from '@/lib/defaultImages';
import type { QuestionFeedItem } from '@/lib/questionsFeed';

// Card for the merged /questions listing. Mirrors CommunityFeedCard's
// visual treatment (top accent strip, ios-card interactive glow, same
// image/category/title/description shape) but branches per item kind:
// - 'article': static evergreen content, no countdown, no view count
//   (Article has no views column in the schema — likes/shares/comments only).
// - 'event': live day-count + progress bar, likes/shares/comments AND views.
//
// Link construction (the one place slug-prefix convention matters):
// - Article.slug already includes "how-long-until-" -> /questions/<slug>
// - Event.slug is bare -> /questions/how-long-until-<slug>

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCount(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0) + 'k';
  return String(n);
}

export function QuestionCard({ item, index = 0, priority = false }: { item: QuestionFeedItem; index?: number; priority?: boolean }) {
  const glow = getCategoryGlowRGB(item.categorySlug);
  const glowText = getCategoryTextRGB(item.categorySlug);
  const imageUrl = item.heroImageUrl || pickDefaultImage(item.categorySlug, item.slug);
  const href = item.kind === 'event'
    ? `/questions/how-long-until-${item.slug}`
    : `/questions/${item.slug}`;

  const countdown = item.kind === 'event' ? buildCountdownResponse(item.title, new Date(item.targetDate)) : null;

  return (
    <Link
      href={href}
      className="ios-card interactive glow anim-fade-up relative overflow-hidden block"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 z-10" style={{ background: `rgb(${glow})` }} />
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 1024px) calc((100vw - 48px) / 2), 320px"
          quality={70}
          style={{ objectFit: 'cover' }}
          priority={priority}
        />
        <span
          className="pill absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wide"
          style={{ background: 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)' }}
        >
          {item.kind === 'event' ? 'Countdown' : 'Article'}
        </span>
      </div>
      <div className="p-4">
        {item.categoryName && (
          <div className="text-caption mb-1" style={{ color: `rgb(${glowText})` }}>
            {item.categoryEmoji} {item.categoryName}
          </div>
        )}
        <div className="text-sm font-bold mb-1.5 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
        {item.description && (
          <p className="text-footnote line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
        )}

        {countdown ? (
          <>
            <div className="text-2xl font-black tabular leading-none mb-0.5" style={{ color: `rgb(${glowText})` }}>{countdown.days_left}</div>
            <div className="text-footnote mb-2">days left</div>
            <div className="progress-track" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${countdown.progress_percent}%`, background: `rgb(${glow})` }} />
            </div>
          </>
        ) : (
          <div className="text-caption mt-2 mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Published {formatDate(item.createdAt)}
          </div>
        )}

        <div className="flex items-center gap-3 text-caption mt-2 flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
          <span>❤️ {formatCount(item.likeCount)}</span>
          {item.kind === 'event' && <span>👁 {formatCount(item.views)}</span>}
          <span>💬 {formatCount(item.commentCount)}</span>
          <span>🔗 {formatCount(item.shareCount)}</span>
        </div>
      </div>
    </Link>
  );
}
