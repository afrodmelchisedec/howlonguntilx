import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { StarField } from '@/components/ui/StarField';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

export const metadata: Metadata = {
  title: 'Browse Countdown Categories | HowLongUntilX',
  description: 'Live countdowns across health, family, biology, food, finance, culture, science, and time.',
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          _count: { select: { eventsAsSubcategory: true, articlesAsSubcategory: true } },
        },
      },
      _count: { select: { events: true, articlesAsCategory: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">

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
            const glow = getCategoryGlowRGB(cat.slug);
            const totalItems = cat._count.events + cat._count.articlesAsCategory;
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-headline group-hover:text-brand-500 transition-colors">{cat.name}</div>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border tracking-wide"
                        style={{ borderColor: `rgba(${glow}, 0.35)`, color: `rgb(${glow})` }}>
                        {cat.slug}
                      </span>
                    </div>
                    <div className="text-footnote mt-0.5 line-clamp-2">{cat.description}</div>
                    <div className="mt-2 text-caption" style={{ color: `rgb(${glow})` }}>
                      {cat._count.events} events · {cat._count.articlesAsCategory} articles
                    </div>
                  </div>
                </Link>

                {/* Subcategory pills */}
                {cat.children.length > 0 && (
                  <div className="px-5 pb-4 flex flex-wrap gap-2 border-t pt-3"
                    style={{ borderColor: 'var(--border-hairline)' }}>
                    {cat.children.map(sub => {
                      const subEvents = sub._count.eventsAsSubcategory;
                      const subArticles = sub._count.articlesAsSubcategory;
                      return (
                        <Link key={sub.slug}
                          href={`/categories/${cat.slug}/${sub.slug}`}
                          className="press text-xs px-3 py-1.5 rounded-full font-semibold transition-all flex items-center gap-1.5"
                          style={{
                            background: `rgba(${glow}, 0.1)`,
                            color: `rgb(${glow})`,
                          }}>
                          <span>{sub.emoji} {sub.name}</span>
                          <span style={{ opacity: 0.7, fontWeight: 500 }}>
                            {subEvents}e · {subArticles}a
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
