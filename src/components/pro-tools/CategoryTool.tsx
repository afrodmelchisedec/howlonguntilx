'use client';
import { getToolForCategory } from '@/lib/seo';
import { toolComponentForSlug } from '@/lib/widgetRegistry';
import { PaydayBurnRate } from './PaydayBurnRate';
import { PasswordStrengthRace } from './PasswordStrengthRace';
import { HypeTap } from './HypeTap';
import { useEntitlement } from '@/hooks/useEntitlement';

interface ToolMapping { slug: string; label: string; path: string }

interface Props {
  categorySlug: string;
  eventName: string;
  subcategoryTools?: ToolMapping[];
}

export function CategoryTool({ categorySlug, eventName, subcategoryTools }: Props) {
  const { isPro } = useEntitlement();

  // New path — if the event's subcategory has a real tool mapped in Admin, use it.
  const mappedSlug = subcategoryTools?.[0]?.slug;
  const MappedTool = toolComponentForSlug(mappedSlug);
  if (MappedTool) return <MappedTool />;

  // Legacy fallback — only reached when no subcategory tool is mapped, so
  // existing events without a mapping keep their old behavior unchanged.
  const tool = getToolForCategory(categorySlug);
  if (tool === 'finance') return <PaydayBurnRate isPro={isPro} />;
  if (tool === 'scam') return <PasswordStrengthRace isPro={isPro} />;
  return <HypeTap eventName={eventName} isPro={isPro} />;
}
