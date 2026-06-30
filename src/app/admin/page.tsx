import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AdminClient } from './AdminClient';

export const metadata = { title: 'Admin Panel — HowLongUntil' };

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') redirect('/');
  const [users, events, timerCount] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { timers: true, sessions: true } } } }),
    prisma.event.findMany({ orderBy: { views: 'desc' }, take: 20 }),
    prisma.timer.count(),
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
  return <AdminClient users={users as any} events={events as any} stats={stats} />;
}
