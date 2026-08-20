'use client';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from './ThemeProvider';
import { BlockedSessionGuard } from './BlockedSessionGuard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // refetchInterval: without this, a blocked user's open tab only
    // re-checks session on window focus — fine eventually, but a 60s
    // poll makes the lockout closer to real-time.
    <SessionProvider refetchInterval={60}>
      <ThemeProvider>
        <BlockedSessionGuard />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
