import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { buildCountdownResponse } from '@/lib/countdown';

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
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex gap-2 text-sm text-gray-400 mb-6">
        <Link href="/categories" className="hover:text-brand-500">Categories</Link>
        <span>›</span>
        <Link href={`/categories/${parent.slug}`} className="hover:text-brand-500">{parent.name}</Link>
        <span>›</span>
        <span className="text-gray-600 dark:text-gray-300">{sub.name}</span>
      </div>
      <h1 className="text-3xl font-medium mb-2">{sub.emoji} {sub.name}</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{sub.description}</p>

      {sub.events.length === 0 && (
        <p className="text-gray-400">No events in this subcategory yet.</p>
      )}
      <div className="space-y-3">
        {sub.events.map(ev => {
          const { days_left, hours_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
          return (
            <Link key={ev.slug} href={`/how-long-until-${ev.slug}`}
              className="flex items-center justify-between p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-500 transition-colors group">
              <div className="flex-1">
                <div className="font-medium group-hover:text-brand-500 transition-colors">{ev.name}</div>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-48">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: progress_percent + '%' }} />
                </div>
              </div>
              <div className="text-right ml-6">
                <div className="text-2xl font-medium text-brand-500">{days_left}</div>
                <div className="text-xs text-gray-400">days · {hours_left}h</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
