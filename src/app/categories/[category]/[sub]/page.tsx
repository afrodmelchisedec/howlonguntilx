import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { buildCountdownResponse } from '@/lib/countdown';
import { StarField } from '@/components/ui/StarField';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

interface Props { params: { category: string; sub: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const sub = await prisma.category.findUnique({ where: { slug: params.sub } });
  if (!sub) return {};
  return {
    title: `${sub.name} Countdowns | HowLongUntilX`,
    description: sub.description,
  };
}

export default async function SubCategoryPage({ params }: Props) {
  const parent = await prisma.category.findUnique({ where: { slug: params.category } });
  const sub = await prisma.category.findUnique({
    where: { slug: params.sub },
    include: {
      eventsAsSubcategory: { where: { published: true }, orderBy: { views: 'desc' } },
      articlesAsSubcategory: { where: { status: 'published' }, orderBy: { publishedAt: 'desc' } },
    },
  });

  if (!parent || !sub) notFound();

  const glow = getCategoryGlowRGB(parent.slug);
  const hasEvents = sub.eventsAsSubcategory.length > 0;
  const hasArticles = sub.articlesAsSubcategory.length > 0;

  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="flex gap-2 text-sm mb-6 anim-fade-up" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
          <span>›</span>
          <Link href={`/categories/${parent.slug}`} className="hover:text-brand-500 transition-colors">{parent.name}</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{sub.name}</span>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 mb-10 anim-fade-up"
          style={{
            background: `linear-gradient(135deg, rgba(${glow}, 0.12) 0%, var(--bg-elevated) 100%)`,
            border: `1px solid rgba(${glow}, 0.2)`,
            boxShadow: `0 0 40px rgba(${glow}, 0.08)`,
          }}>
          <div className="hero-blob w-56 h-56 -top-16 -right-10 opacity-20"
            style={{ background: `radial-gradient(circle, rgb(${glow}), transparent)` }} />
          <div className="relative z-10">
            <div className="text-5xl mb-4">{sub.emoji}</div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-largetitle">{sub.name}</h1>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border tracking-wide"
                style={{ borderColor: `rgba(${glow}, 0.35)`, color: `rgb(${glow})` }}>
                {sub.slug}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }} className="text-callout max-w-md">{sub.description}</p>
            <div className="mt-3 text-caption" style={{ color: `rgb(${glow})` }}>
              {sub.eventsAsSubcategory.length} events · {sub.articlesAsSubcategory.length} articles
            </div>
          </div>
        </div>

        {!hasEvents && !hasArticles && (
          <div className="ios-card p-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <div className="text-4xl mb-3">⏳</div>
            <div className="text-headline mb-1">Nothing here yet</div>
            <div className="text-footnote">Be the first to add a countdown or article in {sub.name}</div>
          </div>
        )}

        {/* Events */}
        {hasEvents && (
          <div className="mb-10">
            <h2 className="text-title2 mb-5 anim-fade-up">Countdowns</h2>
            <div className="flex flex-col gap-3 sg">
              {sub.eventsAsSubcategory.map(ev => {
                const { days_left, hours_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
                return (
                  <Link key={ev.slug} href={`/how-long-until-${ev.slug}`}
                    className="ios-card interactive glow flex items-center justify-between p-5">
                    <div className="flex-1 min-w-0">
                      <div className="text-headline truncate">{ev.name}</div>
                      <div className="progress-track mt-2 w-48">
                        <div className="progress-fill" style={{ width: `${progress_percent}%`, background: `rgb(${glow})` }} />
                      </div>
                    </div>
                    <div className="text-right ml-6 flex-shrink-0">
                      <div className="text-title2 tabular" style={{ color: `rgb(${glow})` }}>{days_left}</div>
                      <div className="text-caption">{hours_left}h left</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Articles */}
        {hasArticles && (
          <div>
            <h2 className="text-title2 mb-5 anim-fade-up">Articles</h2>
            <div className="flex flex-col gap-3 sg">
              {sub.articlesAsSubcategory.map(a => (
                <Link key={a.slug} href={`/tools/${a.toolSlug}/${a.slug}`}
                  className="ios-card interactive glow flex items-center justify-between p-5">
                  <div className="flex-1 min-w-0">
                    <div className="text-headline truncate">{a.title}</div>
                    <div className="text-footnote mt-1 line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{a.dek}</div>
                  </div>
                  <span style={{ color: `rgb(${glow})` }} className="text-lg ml-4 flex-shrink-0">›</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
