import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserTimers } from '@/lib/timers';
import { getPopularEvents } from '@/lib/events';
import { PremiumLayout } from '@/components/premium/PremiumLayout';

export const metadata = { title: 'Dashboard — HowLongUntil' };

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  const timers = await getUserTimers(session.user.id);
  const popular = await getPopularEvents(4);
  return <PremiumLayout session={session} timers={timers} popular={popular} />;
}
