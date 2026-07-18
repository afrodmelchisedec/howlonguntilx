'use client';
import { useSession } from 'next-auth/react';

export type Tier = 'FREE' | 'TRIAL' | 'PRO';

export function useEntitlement() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const isAdmin = user?.role === 'ADMIN';
  const isTrialing = user?.subscriptionStatus === 'trialing';
  const isActivePro = user?.plan === 'PRO' && !isTrialing;
  const isPro = isAdmin || isActivePro || isTrialing;

  let tier: Tier = 'FREE';
  if (isAdmin || isActivePro) tier = 'PRO';
  else if (isTrialing) tier = 'TRIAL';

  let trialDaysLeft: number | undefined;
  if (isTrialing && user?.trialEndsAt) {
    const ms = new Date(user.trialEndsAt).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(ms / 86400000));
  }

  return { tier, isPro, isTrialing, trialDaysLeft };
}
