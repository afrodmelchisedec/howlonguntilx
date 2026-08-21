// FILE: src/app/admin/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getUserTimers } from '@/lib/timers';
import { getPopularEvents } from '@/lib/events';
import { AdminClient } from './AdminClient';

export const metadata = { title: 'Dashboard — HowLongUntil' };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');

  const isAdmin = session.user.role === 'ADMIN';

  if (!isAdmin) {
    // Regular-user branch: still zero platform-wide tables queried — only
    // the viewer's own timers, own UserEvents, and the shared popular-events
    // list (already public data, same as /dashboard today).
    const [timers, popular, myEvents] = await Promise.all([
      getUserTimers(session.user.id),
      getPopularEvents(4),
      prisma.userEvent.findMany({
        where: { authorId: session.user.id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, slug: true, title: true, targetDate: true,
          visibility: true, moderationStatus: true, moderationNote: true,
        },
      }),
    ]);
    const isPremium = session.user.plan === 'PRO';

    return (
      <AdminClient
        isAdmin={false}
        isPremium={isPremium}
        userName={session.user.name}
        timers={timers as any}
        popular={popular as any}
        myEvents={myEvents as any}
      />
    );
  }

  const [users, events, timerCount, articles, categories, reviewers, myEvents] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { timers: true, sessions: true } } } }),
    prisma.event.findMany({ orderBy: { views: 'desc' }, take: 20, include: { category: true, subcategory: true, reviewer: true } }),
    prisma.timer.count(),
    prisma.article.findMany({
      where: { toolSlug: 'questions' },
      orderBy: { createdAt: 'desc' },
      include: { category: true, subcategory: true, reviewer: true },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.reviewer.findMany({ orderBy: { name: 'asc' } }),
    // Admin's own UserEvents — TAB_ACCESS allows ADMIN on myEvents too,
    // so an admin who has created community events can manage them here.
    prisma.userEvent.findMany({
      where: { authorId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, title: true, targetDate: true,
        visibility: true, moderationStatus: true, moderationNote: true,
      },
    }),
  ]);

  const stats = {
    totalUsers: users.length,
    verifiedUsers: users.filter(u => u.emailVerified).length,
    unverifiedUsers: users.filter(u => !u.emailVerified).length,
    proUsers: users.filter(u => u.plan === 'PRO').length,
    freeUsers: users.filter(u => u.plan === 'FREE').length,
    totalTimers: timerCount,
    totalEvents: events.length,
    totalViews: events.reduce((s, e) => s + e.views, 0),
  };

  return (
    <AdminClient
      isAdmin
      isPremium
      users={users as any}
      events={events as any}
      articles={articles as any}
      categories={categories as any}
      reviewers={reviewers as any}
      myEvents={myEvents as any}
      stats={stats}
    />
  );
}