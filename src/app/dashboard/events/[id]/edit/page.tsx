import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { EventSubmitForm } from '@/components/community/EventSubmitForm';

export const metadata = { title: 'Edit event — HowLongUntil' };

// Formats a Date as the value a <input type="datetime-local"> expects
// (local time, no seconds/timezone), matching how the create form reads it.
function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditUserEventPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect(`/auth/signin?callbackUrl=/dashboard/events/${params.id}/edit`);

  const [event, categories, plan] = await Promise.all([
    prisma.userEvent.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: 'asc' },
      include: { children: { orderBy: { name: 'asc' } } },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } }),
  ]);

  // Ownership check — a user can only edit their own events, admin or not
  // (mirrors the updateMany/deleteMany ownership pattern in userEvents.ts).
  if (!event || event.authorId !== session.user.id) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-medium mb-1">Edit event</h1>
      <p className="text-sm text-gray-400 mb-6">Update your "How long until...?" countdown.</p>
      <EventSubmitForm
        categories={categories as any}
        plan={plan?.plan ?? 'FREE'}
        eventId={event.id}
        initialValues={{
          title: event.title,
          description: event.description ?? '',
          targetDate: toDatetimeLocal(event.targetDate),
          visibility: event.visibility as 'PUBLIC' | 'PRIVATE',
          categoryId: event.categoryId ?? '',
        }}
      />
    </div>
  );
}
