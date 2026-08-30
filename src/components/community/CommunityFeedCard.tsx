// FILE: src/components/community/CommunityFeedCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { buildCountdownResponse } from '@/lib/countdown';
import { getCategoryGlowRGB, getCategoryTextRGB } from '@/lib/categoryGlow';
import { pickDefaultImage } from '@/lib/defaultImages';
import { UserSummaryCard } from './UserSummaryCard';

export interface FeedItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  targetDate: string;
  images: string[] | null;
  likeCount: number;
  shareCount: number;
  commentCount: number;
  viewCount: number;
  author: { id: string; name: string | null; username: string | null; image: string | null } | null;
  category: { slug: string; name: string; emoji: string } | null;
}

export function CommunityFeedCard({ item, index = 0, priority = false }: { item: FeedItem; index?: number; priority?: boolean }) {
  const { days_left, progress_percent } = buildCountdownResponse(item.title, new Date(item.targetDate));
  const glow = getCategoryGlowRGB(item.category?.slug);
  const glowText = getCategoryTextRGB(item.category?.slug);
  const images = Array.isArray(item.images) ? item.images : [];
  const imageUrl = images[0] ?? pickDefaultImage(item.category?.slug, item.slug);

  return (
    <div
      className="ios-card interactive glow anim-fade-up relative overflow-hidden flex flex-col"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="absolute top-0 left-0 bottom-0 w-1 z-10" style={{ background: `rgb(${glow})` }} />

      <Link href={`/community/how-long-until-${item.slug}`} className="flex items-center" style={{ height: 128 }}>
        {/* Square mat thumbnail, object-fit: contain — same fix as QuestionCard:
            fixed shape independent of text length, true original L×W scaled
            down rather than cropped/stretched, tinted background as the mat. */}
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
        </div>

        <div className="flex-1 min-w-0 p-3 flex flex-col justify-center gap-1">
          {item.category && (
            <div className="text-caption truncate" style={{ color: `rgb(${glowText})` }}>
              {item.category.emoji} {item.category.name}
            </div>
          )}
          <div className="text-sm font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
          {item.description && (
            <p className="text-footnote line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-base font-black tabular leading-none" style={{ color: `rgb(${glowText})` }}>{days_left}</span>
            <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>days left</span>
            <div className="progress-track flex-1" style={{ height: 3, maxWidth: 90 }}>
              <div className="progress-fill" style={{ width: `${progress_percent}%`, background: `rgb(${glow})` }} />
            </div>
          </div>
        </div>
      </Link>

      {/* Footer stays a sibling of Link, not nested inside it — same as the
          original — so UserSummaryCard's popover/click doesn't also
          trigger the card's navigation. */}
      <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 ml-1 text-caption" style={{ color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-hairline)' }}>
        {item.author ? (
          <UserSummaryCard user={item.author}>
            <span className="truncate hover:underline" style={{ cursor: 'pointer' }}>
              By {item.author.name ?? 'a HowLongUntilX user'}
            </span>
          </UserSummaryCard>
        ) : (
          <span className="truncate">By a HowLongUntilX user</span>
        )}
        <span className="flex-shrink-0">❤️ {item.likeCount} · 👁 {item.viewCount} · 💬 {item.commentCount} · 🔗 {item.shareCount}</span>
      </div>
    </div>
  );
}