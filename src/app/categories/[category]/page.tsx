import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { buildCountdownResponse } from '@/lib/countdown';
import { StarField } from '@/components/ui/StarField';

interface Props { params: { category: string } }

const GLOW_MAP: Record<string, string> = {
  leisure: 'var(--glow-sports)',
  food:    'var(--glow-nature)',
  travel:  'var(--glow-travel)',
  tech:    'var(--glow-tech)',
  finance: 'var(--glow-finance)',
  scam:    'var(--glow-personal)',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = await prisma.category.findUnique({ where: { slug: params.category } });
  if (!cat) return {};
  return {
    title: `${cat.name} Countdowns | HowLongUntilX`,
    description: cat.description,
  };
}

export default async function CategoryPage({ params }: Props) {
  const cat = await prisma.category.findUnique({
    where: { slug: params.category, parentId: null },
    include: {
      children: {
        include: {
          events: {
            where: { published: true },
            orderBy: { views: 'desc' },
            take: 3,
          },
          _count: { select: { events: true } },
        },
      },
      events: {
        where: { published: true },
        orderBy: { views: 'desc' },
        take: 6,
      },
    },
  });

  if (!cat) notFound();

  const glowRgb = GLOW_MAP[params.category] || 'var(--glow-brand)';

  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-8 anim-fade-up" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{cat.name}</span>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl p-8 mb-10 anim-fade-up"
          style={{
            background: `linear-gradient(135deg, rgba(${glowRgb}, 0.12) 0%, var(--bg-elevated) 100%)`,
            border: `1px solid rgba(${glowRgb}, 0.2)`,
            boxShadow: `0 0 40px rgba(${glowRgb}, 0.08)`,
          }}>
          <div className="hero-blob w-64 h-64 -top-20 -right-10 opacity-20"
            style={{ background: `radial-gradient(circle, rgb(${glowRgb}), transparent)` }} />
          <div className="relative z-10">
            <div className="text-5xl mb-4">{cat.emoji}</div>
            <h1 className="text-largetitle mb-2">{cat.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }} className="text-callout max-w-md">{cat.description}</p>
            <div className="flex gap-3 mt-5 flex-wrap">
              {cat.children.map(sub => (
                <Link key={sub.slug} href={`/categories/${cat.slug}/${sub.slug}`}
                  className="pill press text-xs"
                  style={{ background: `rgba(${glowRgb}, 0.12)`, color: `rgb(${glowRgb})` }}>
                  {sub.emoji} {sub.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Subcategory cards */}
        {cat.children.length > 0 && (
          <div className="mb-10">
            <h2 className="text-title2 mb-5 anim-fade-up">Browse subcategories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sg">
              {cat.children.map(sub => (
                <Link key={sub.slug} href={`/categories/${cat.slug}/${sub.slug}`}
                  className="ios-card interactive glow p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{sub.emoji}</span>
                      <div>
                        <div className="text-headline">{sub.name}</div>
                        <div className="text-footnote mt-0.5">{sub._count.events} events</div>
                      </div>
                    </div>
                    <span style={{ color: 'var(--text-tertiary)' }} className="text-lg">›</span>
                  </div>
                  {sub.events.length > 0 && (
                    <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'var(--border-hairline)' }}>
                      {sub.events.map(ev => {
                        const { days_left } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
                        return (
                          <div key={ev.slug} className="flex items-center justify-between">
                            <span className="text-footnote truncate max-w-[200px]">{ev.name}</span>
                            <span className="text-caption font-bold" style={{ color: `rgb(${glowRgb})` }}>
                              {days_left}d
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* All events in category */}
        {cat.events.length > 0 && (
          <div>
            <h2 className="text-title2 mb-5 anim-fade-up">Top countdowns</h2>
            <div className="flex flex-col gap-3 sg">
              {cat.events.map(ev => {
                const { days_left, hours_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
                return (
                  <Link key={ev.slug} href={`/how-long-until-${ev.slug}`}
                    className="ios-card interactive glow flex items-center justify-between p-5">
                    <div className="flex-1 min-w-0">
                      <div className="text-headline truncate">{ev.name}</div>
                      <div className="progress-track mt-2 w-40">
                        <div className="progress-fill" style={{ width: `${progress_percent}%`, background: `rgb(${glowRgb})` }} />
                      </div>
                    </div>
                    <div className="text-right ml-6 flex-shrink-0">
                      <div className="text-title2 tabular" style={{ color: `rgb(${glowRgb})` }}>{days_left}</div>
                      <div className="text-caption">{hours_left}h left</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {cat.events.length === 0 && cat.children.every(c => c._count.events === 0) && (
          <div className="ios-card p-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
            <div className="text-4xl mb-3">⏳</div>
            <div className="text-headline mb-1">No events yet</div>
            <div className="text-footnote">Be the first to add a countdown in {cat.name}</div>
          </div>
        )}
      </div>
    </div>
  );
}
