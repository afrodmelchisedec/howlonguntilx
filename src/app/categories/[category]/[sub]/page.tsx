import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { buildCountdownResponse } from '@/lib/countdown';
import { StarField } from '@/components/ui/StarField';

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
    include: { events: { where: { published: true }, orderBy: { views: 'desc' } } },
  });

  if (!parent || !sub) notFound();

  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="flex gap-2 text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          <Link href="/categories" className="hover:text-brand-500 transition-colors">Categories</Link>
          <span>›</span>
          <Link href={`/categories/${parent.slug}`} className="hover:text-brand-500 transition-colors">{parent.name}</Link>
          <span>›</span>
          <span style={{ color: 'var(--text-primary)' }}>{sub.name}</span>
        </div>
        <h1 className="text-largetitle mb-2">{sub.emoji} {sub.name}</h1>
        <p className="text-callout mb-8" style={{ color: 'var(--text-secondary)' }}>{sub.description}</p>

        {sub.events.length === 0 && (
          <p style={{ color: 'var(--text-tertiary)' }}>No events in this subcategory yet.</p>
        )}
        <div className="flex flex-col gap-3 sg">
          {sub.events.map(ev => {
            const { days_left, hours_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
            return (
              <Link key={ev.slug} href={`/how-long-until-${ev.slug}`}
                className="ios-card interactive glow flex items-center justify-between p-5">
                <div className="flex-1 min-w-0">
                  <div className="text-headline truncate">{ev.name}</div>
                  <div className="progress-track mt-2 w-48">
                    <div className="progress-fill" style={{ width: `${progress_percent}%` }} />
                  </div>
                </div>
                <div className="text-right ml-6 flex-shrink-0">
                  <div className="text-title2 tabular" style={{ color: 'rgb(var(--accent-brand))' }}>{days_left}</div>
                  <div className="text-caption">{hours_left}h left</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
