// FILE: src/app/reviewers/[slug]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { ReviewerAvatar } from '@/components/reviewers/ReviewerAvatar';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

interface Props { params: { slug: string } }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? '';

async function getReviewer(slug: string) {
  const reviewer = await prisma.reviewer.findUnique({ where: { slug } });
  if (!reviewer || !reviewer.active) return null;

  const [articles, events] = await Promise.all([
    prisma.article.findMany({
      where: { reviewerId: reviewer.id, reviewEnabled: true, status: 'published' },
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
    }),
    prisma.event.findMany({
      where: { reviewerId: reviewer.id, reviewEnabled: true },
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    }),
  ]);

  return { reviewer, articles, events };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getReviewer(params.slug);
  if (!data) return {};
  const { reviewer } = data;
  const title = `${reviewer.name}${reviewer.credentials ? `, ${reviewer.credentials}` : ''} — Reviewer`;
  return {
    title,
    description: reviewer.bio,
    alternates: { canonical: `${SITE_URL}/reviewers/${reviewer.slug}` },
  };
}

export default async function ReviewerProfilePage({ params }: Props) {
  const data = await getReviewer(params.slug);
  if (!data) notFound();
  const { reviewer, articles, events } = data;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: reviewer.name,
    ...(reviewer.credentials ? { jobTitle: reviewer.credentials } : {}),
    ...(reviewer.photoUrl ? { image: reviewer.photoUrl } : {}),
    description: reviewer.bio,
    url: `${SITE_URL}/reviewers/${reviewer.slug}`,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="text-caption mb-6" style={{ color: 'var(--text-secondary)' }}>
        <Link href="/">Home</Link> / <span>Reviewers</span> / <span>{reviewer.name}</span>
      </nav>

      <div className="ios-card p-6 flex flex-col sm:flex-row gap-5 items-start mb-10">
        <ReviewerAvatar photoUrl={reviewer.photoUrl} name={reviewer.name} size={96} />
        <div className="min-w-0">
          <h1 className="text-title1 mb-1">{reviewer.name}</h1>
          <div className="flex flex-wrap gap-2 mb-3">
            {reviewer.credentials && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(83,74,183,0.1)', color: 'rgb(83,74,183)' }}>
                {reviewer.credentials}
              </span>
            )}
            {reviewer.title && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                {reviewer.title}
              </span>
            )}
            {reviewer.specialty && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                {reviewer.specialty}
              </span>
            )}
          </div>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>{reviewer.bio}</p>
        </div>
      </div>

      {articles.length > 0 && (
        <section className="mb-10">
          <h2 className="text-title3 mb-4">Articles reviewed by {reviewer.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map(a => (
              <ArticleCard
                key={a.id}
                toolSlug={a.toolSlug}
                slug={a.slug}
                title={a.title}
                dek={a.dek}
                heroImageUrl={a.heroImageUrl}
                glow={a.category?.slug ? getCategoryGlowRGB(a.category.slug) : '83,74,183'}
                category={a.category as any}
              />
            ))}
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="mb-10">
          <h2 className="text-title3 mb-4">Countdowns reviewed by {reviewer.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map(ev => (
              <Link
                key={ev.id}
                href={`/how-long-until-${ev.slug}`}
                className="ios-card-nested press p-4 flex flex-col anim-fade-up"
              >
                <p className="text-headline mb-1">{ev.name}</p>
                {ev.description && (
                  <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{ev.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {articles.length === 0 && events.length === 0 && (
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          No published content has been reviewed by {reviewer.name} yet.
        </p>
      )}
    </div>
  );
}