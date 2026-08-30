// FILE: src/app/dashboard/events/new/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EventSubmitForm } from '@/components/community/EventSubmitForm';
import { StarField } from '@/components/ui/StarField';

export const metadata = { title: 'Create an event — HowLongUntil' };

export default async function NewUserEventPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin?callbackUrl=/dashboard/events/new');

  const [categories, plan] = await Promise.all([
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: { children: { orderBy: { name: 'asc' } } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-medium mb-1">Create an event</h1>
        <p className="text-sm text-gray-400 mb-6">Share a "How long until...?" countdown with the community.</p>
        <EventSubmitForm categories={categories as any} plan={plan?.plan ?? 'FREE'} />
      </div>
    </div>
  );
}
