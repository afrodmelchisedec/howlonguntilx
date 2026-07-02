
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { buildCountdownResponse } from '@/lib/countdown';

interface Props { params: { category: string } }

const LABELS: Record<string, string> = {
  holidays: 'Holidays & Celebrations',
  sports: 'Sports & Games',
  finance: 'Money & Milestones',
  tech: 'Tech Events',
  nature: 'Nature & Sky',
  shopping: 'Shopping & Deals',
  entertainment: 'Entertainment',
  space: 'Space & Astronomy',
  personal: 'Personal Timers',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const label = LABELS[params.category];
  if (!label) return {};
  return { title: label + ' Countdowns', description: 'Live countdowns for ' + label };
}

export default async function CategoryPage({ params }: Props) {
  const label = LABELS[params.category];
  if (!label) notFound();
  const events = await prisma.event.findMany({
    where: { category: params.category },
    orderBy: { views: 'desc' },
  });
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-2">
        <Link href="/categories" className="text-sm text-gray-400 hover:text-brand-500">← All categories</Link>
      </div>
      <h1 className="text-3xl font-medium mb-8">{label}</h1>
      {events.length === 0 && <p className="text-gray-400">No events in this category yet.</p>}
      <div className="space-y-3">
        {events.map(ev => {
          const { days_left, hours_left, progress_percent } = buildCountdownResponse(ev.name, new Date(ev.targetDate));
          return (
            <Link key={ev.slug} href={"/how-long-until-" + ev.slug}
              className="flex items-center justify-between p-5 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-brand-500 transition-colors group">
              <div className="flex-1">
                <div className="font-medium group-hover:text-brand-500 transition-colors">{ev.name}</div>
                <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-48">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: progress_percent + "%" }} />
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
