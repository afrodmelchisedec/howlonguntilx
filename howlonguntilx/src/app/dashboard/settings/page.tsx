import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SettingsClient } from './SettingsClient';

export const metadata = { title: 'Account Settings' };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/signin');
  return <SettingsClient session={session} />;
}
