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
      className="ios-card interactive glow anim-fade-up relative overflow-hidden flex items-center"
      style={{ animationDelay: `${index * 55}ms`, minHeight: 128 }}
    >
      {/* Left accent strip — the horizontal-row equivalent of the old
          full-width top strip, which doesn't read right on a short card. */}
      <div className="absolute top-0 left-0 bottom-0 w-1 z-10" style={{ background: `rgb(${glow})` }} />

      {/* Thumbnail — a FIXED, explicit aspect ratio (square), completely
          independent of the content column's height. Previously this
          stretched to match whatever height that card's text happened to
          need (~100px on a short card, ~140px+ on a long one), so the
          same 112px-wide image got cover-cropped into a different shape
          every time — that's what read as "squeezed". Now every thumbnail
          is the same shape, and object-fit: contain scales the full
          original image down to fit inside it rather than cropping —
          true original L×W, just smaller, never distorted. The soft
          category-tinted background fills any letterbox space so it
          reads as an intentional mat, not empty bars. */}
      <div
        className="relative flex-shrink-0 self-stretch my-2 ml-2 rounded-xl overflow-hidden"
        style={{ width: 112, aspectRatio: '1 / 1', background: `rgba(${glow}, 0.08)` }}
      >
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          sizes="112px"
          quality={70}
          style={{ objectFit: 'contain' }}
          priority={priority}
        />
        <span
          className="absolute bottom-1 left-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)' }}
        >
          {item.kind === 'event' ? 'Countdown' : 'Article'}
        </span>
      </div>

      {/* Content column */}
      <div className="flex-1 min-w-0 p-3 flex flex-col justify-center gap-1">
        {item.categoryName && (
          <div className="text-caption truncate" style={{ color: `rgb(${glowText})` }}>
            {item.categoryEmoji} {item.categoryName}
          </div>
        )}
        <div className="text-sm font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
        {item.description && (
          <p className="text-footnote line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
        )}

        {countdown ? (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-black tabular leading-none" style={{ color: `rgb(${glowText})` }}>{countdown.days_left}</span>
            <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>days left</span>
            <div className="progress-track flex-1" style={{ height: 3, maxWidth: 90 }}>
              <div className="progress-fill" style={{ width: `${countdown.progress_percent}%`, background: `rgb(${glow})` }} />
            </div>
          </div>
        ) : (
          <div className="text-caption" style={{ color: 'var(--text-tertiary)' }}>
            Published {formatDate(item.createdAt)}
          </div>
        )}

        <div className="flex items-center gap-3 text-caption flex-wrap" style={{ color: 'var(--text-tertiary)' }}>
          <span>❤️ {formatCount(item.likeCount)}</span>
          {item.kind === 'event' && <span>👁 {formatCount(item.views)}</span>}
          <span>💬 {formatCount(item.commentCount)}</span>
          <span>🔗 {formatCount(item.shareCount)}</span>
        </div>
      </div>
    </Link>
  );
}