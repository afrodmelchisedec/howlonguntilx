'use client';
import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

// The jwt callback (src/lib/auth.ts) refreshes blockedAt on every
// getServerSession() call server-side, but a tab that's just sitting open
// won't know it got blocked until the client re-checks. SessionProvider's
// refetchInterval below drives that re-check; this component watches for
// the result and force-signs-out the moment blockedAt shows up — this is
// the actual "session itself must stop working" half of the Phase 8
// blocking model (server-side write paths still separately reject blocked
// users regardless of this component's timing).
export function BlockedSessionGuard() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.blockedAt) {
      signOut({ callbackUrl: '/auth/blocked' });
    }
  }, [status, session?.user?.blockedAt]);

  return null;
}
