import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { MyEventsList } from '@/components/community/MyEventsList';

export const metadata = { title: 'My events — HowLongUntil' };

export default async function MyEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin?callbackUrl=/dashboard/events');

  const events = await prisma.userEvent.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      targetDate: true,
      visibility: true,
      moderationStatus: true,
      moderationNote: true,
    },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">My events</h1>
          <p className="text-sm text-gray-400">Events you've created for the community.</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          + New event
        </Link>
      </div>
      <MyEventsList events={events as any} />
    </div>
  );
}
