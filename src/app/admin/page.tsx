import { redirect } from 'next/navigation';

// /admin is retired — /users is now the single merged dashboard route.
// Kept as a thin redirect stub (not deleted outright) to protect anyone
// with an old bookmark or a stale link somewhere in the codebase.
export default function AdminRedirect() {
  redirect('/users');
}
