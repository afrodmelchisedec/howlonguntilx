import { redirect } from 'next/navigation';

// /dashboard/settings is retired — settings now lives under /users/settings,
// consistent with /users being the single merged dashboard route. Kept as a
// thin redirect stub (not deleted outright) to protect anyone with an old
// bookmark or a stale link somewhere in the codebase.
export default function DashboardSettingsRedirect() {
  redirect('/users/settings');
}
