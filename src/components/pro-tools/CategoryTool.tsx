'use client';
import { getToolForCategory } from '@/lib/seo';
import { PaydayBurnRate } from './PaydayBurnRate';
import { PasswordStrengthRace } from './PasswordStrengthRace';
import { HypeTap } from './HypeTap';
import { useEntitlement } from '@/hooks/useEntitlement';

interface Props {
  categorySlug: string;
  eventName: string;
}

export function CategoryTool({ categorySlug, eventName }: Props) {
  const tool = getToolForCategory(categorySlug);
  const { isPro } = useEntitlement();

  if (tool === 'finance') return <PaydayBurnRate isPro={isPro} />;
  if (tool === 'scam') return <PasswordStrengthRace isPro={isPro} />;
  return <HypeTap eventName={eventName} isPro={isPro} />;
}
