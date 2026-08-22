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
      className="ios-card interactive glow anim-fade-up relative overflow-hidden"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <Link href={`/community/how-long-until-${item.slug}`} className="block">
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
        </div>
        <div className="p-4">
          {item.category && (
            <div className="text-caption mb-1" style={{ color: `rgb(${glowText})` }}>
              {item.category.emoji} {item.category.name}
            </div>
          )}
          <div className="text-sm font-bold mb-1.5 line-clamp-1" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
          {item.description && (
            <p className="text-footnote line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
          )}
          <div className="text-2xl font-black tabular leading-none mb-0.5" style={{ color: `rgb(${glowText})` }}>{days_left}</div>
          <div className="text-footnote mb-2">days left</div>
          <div className="progress-track" style={{ height: 4 }}>
            <div className="progress-fill" style={{ width: `${progress_percent}%`, background: `rgb(${glow})` }} />
          </div>
        </div>
      </Link>
      <div className="flex items-center justify-between px-4 pb-4 -mt-1 text-caption" style={{ color: 'var(--text-tertiary)' }}>
        {item.author ? (
          <UserSummaryCard user={item.author}>
            <span className="truncate hover:underline" style={{ cursor: 'pointer' }}>
              By {item.author.name ?? 'a HowLongUntilX user'}
            </span>
          </UserSummaryCard>
        ) : (
          <span className="truncate">By a HowLongUntilX user</span>
        )}
        <span className="flex-shrink-0">❤️ {item.likeCount} · 💬 {item.commentCount}</span>
      </div>
    </div>
  );
}
