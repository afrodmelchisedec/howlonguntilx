// FILE: src/app/community/[slug]/page.tsx
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CountdownDisplay } from '@/components/countdown/CountdownDisplay';
import { ShareBar } from '@/components/ui/ShareBar';
import { pickDefaultImage } from '@/lib/defaultImages';
import { UserEventLikeButton } from '@/components/community/UserEventLikeButton';
import { CommentThread } from '@/components/community/CommentThread';
import { UserSummaryCard } from '@/components/community/UserSummaryCard';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

interface Props { params: { slug: string } }

// Wrapped in React's cache() so generateMetadata and the page component
// below share ONE Postgres round trip per request instead of two -- same
// bug, same fix as getPublishedArticle in articles.ts and getEventBySlug
// in events.ts. Deliberately NOT given a Redis layer here (unlike those
// two): this data is user-editable (owner can edit/delete their own
// event) and adding a cross-request cache without also wiring
// invalidation into every write path risks showing a user their OWN
// stale edit. cache() alone is request-scoped and always safe -- it's
// gone the moment this request finishes, so there's no staleness risk.
// Worth adding Redis here too later, but only once the edit/delete
// routes are in view so invalidation isn't guessed at.
const getUserEventBySlug = cache(async (slug: string) => {
  return prisma.userEvent.findUnique({
    where: { slug },
    include: {
      author: { select: { name: true, username: true, image: true, blockedAt: true } },
      category: { select: { name: true, emoji: true, slug: true } },
    },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rawSlug = params.slug.replace('how-long-until-', '');
  const event = await getUserEventBySlug(rawSlug);
  if (!event) return {};
  const base = process.env.NEXTAUTH_URL ?? 'https://howlonguntilx.com';
  return {
    title: `How Long Until ${event.title}?`,
    description: event.description || `A live countdown to ${event.title}.`,
    alternates: { canonical: `${base}/community/how-long-until-${rawSlug}` },
  };
}

export default async function UserEventPage({ params }: Props) {
  const rawSlug = params.slug.replace('how-long-until-', '');
  const session = await getServerSession(authOptions);
  const event = await getUserEventBySlug(rawSlug);

  if (!event) notFound();

  const isOwner = session?.user?.id === event.authorId;
  const isAdmin = session?.user?.role === 'ADMIN';
  // Removed posts stay in the DB for audit (per Phase 8's moderation
  // model) but 404 for everyone except an admin. Private posts 404 for
  // everyone except the owner or an admin.
  if (event.moderationStatus === 'REMOVED' && !isAdmin) notFound();
  if (event.visibility === 'PRIVATE' && !isOwner && !isAdmin) notFound();
  // Blocked author's public posts hide the same way REMOVED ones do —
  // read-time derived from author.blockedAt, nothing mutated on the post
  // itself (Phase 8 blocking model). Owner/admin can still see it.
  if (event.author?.blockedAt && !isOwner && !isAdmin) notFound();

  // Fire-and-forget — matches the existing Event page's incrementViews
  // pattern in spirit (no dedupe by viewer, simplicity over precision).
  prisma.userEvent
    .update({ where: { slug: rawSlug }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const images = Array.isArray(event.images) ? (event.images as string[]) : [];
  // No uploads yet (Phase 5 not built) — fall back to the same
  // category-themed placeholder the main Event page uses, so the page
  // never looks broken/empty while image upload is still pending.
  const placeholderImage = images.length === 0 ? pickDefaultImage(event.category?.slug, event.slug) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {event.category && (
        <div className="mb-4 flex justify-center">
          <span className="pill" style={{ background: 'var(--fill-secondary)' }}>
            {event.category.emoji} {event.category.name}
          </span>
        </div>
      )}

      {images.length === 1 ? (
        <img
          src={images[0]}
          alt={event.title}
          className="w-full rounded-2xl mb-5"
          style={{ aspectRatio: '16/9', objectFit: 'cover', maxWidth: 560, margin: '0 auto 20px' }}
        />
      ) : images.length > 1 ? (
        <div className="grid grid-cols-2 gap-2 mb-6 max-w-md mx-auto">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              className="rounded-xl w-full"
              style={{ aspectRatio: '1/1', objectFit: 'cover' }}
            />
          ))}
        </div>
      ) : (
        <img
          src={placeholderImage!}
          alt={event.title}
          className="w-full rounded-2xl mb-5"
          style={{ aspectRatio: '16/9', objectFit: 'cover', maxWidth: 560, margin: '0 auto 20px' }}
        />
      )}

      <div className="text-caption mb-6" style={{ color: 'var(--text-secondary)' }}>
        By{' '}
        {event.author ? (
          <UserSummaryCard user={{ id: event.authorId, name: event.author.name, username: event.author.username, image: event.author.image }}>
            <span className="hover:underline" style={{ cursor: 'pointer' }}>{event.author.name ?? 'a HowLongUntilX user'}</span>
          </UserSummaryCard>
        ) : 'a HowLongUntilX user'} ·{' '}
        {new Date(event.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
      </div>

      <CountdownDisplay event={{ name: event.title, targetDate: event.targetDate }} glow={getCategoryGlowRGB(event.category?.slug)} />

      {event.description && (
        <p className="text-body mt-6 mb-2 text-left" style={{ color: 'var(--text-secondary)' }}>
          {event.description}
        </p>
      )}

      <ShareBar name={event.title} slug={event.slug} id={event.id} type="userEvent" shareCount={event.shareCount} />

      <div className="mt-4">
        <UserEventLikeButton userEventId={event.id} glow={getCategoryGlowRGB(event.category?.slug)} />
      </div>

      <CommentThread subjectType="userEvent" subjectId={event.id} glow={getCategoryGlowRGB(event.category?.slug)} />
    </div>
  );
}