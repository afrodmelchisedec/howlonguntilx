import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Browse Countdown Categories | HowLongUntilX',
  description: 'Live countdowns for leisure, food, travel, tech, finance and scam events worldwide.',
};

const GLOW_MAP: Record<string, string> = {
  leisure: '48, 219, 91',
  food:    '88, 214, 113',
  travel:  '100, 240, 235',
  tech:    '64, 156, 255',
  finance: '255, 159, 10',
  scam:    '255, 75, 110',
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: true,
      _count: { select: { events: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">

      {/* Header */}
      <div className="mb-10 anim-fade-up">
        <p className="text-caption mb-2">DISCOVER</p>
        <h1 className="text-largetitle mb-2">Browse categories</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-callout">
          Every countdown, organised by what matters to you.
        </p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sg">
        {categories.map(cat => {
          const glow = GLOW_MAP[cat.slug] || '83, 74, 217';
          return (
            <div key={cat.slug} className="ios-card overflow-hidden flex flex-col">
              {/* Top section — clickable to category */}
              <Link href={`/categories/${cat.slug}`}
                className="flex items-start gap-4 p-5 interactive group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: `rgba(${glow}, 0.15)` }}>
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-headline group-hover:text-brand-500 transition-colors">{cat.name}</div>
                  <div className="text-footnote mt-0.5 line-clamp-2">{cat.description}</div>
                  <div className="mt-2 text-caption" style={{ color: `rgb(${glow})` }}>
                    {cat._count.events} events
                  </div>
                </div>
              </Link>

              {/* Subcategory pills */}
              {cat.children.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2 border-t pt-3"
                  style={{ borderColor: 'var(--border-hairline)' }}>
                  {cat.children.map(sub => (
                    <Link key={sub.slug}
                      href={`/categories/${cat.slug}/${sub.slug}`}
                      className="press text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                      style={{
                        background: `rgba(${glow}, 0.1)`,
                        color: `rgb(${glow})`,
                      }}>
                      {sub.emoji} {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
