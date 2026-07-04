import { getToolForCategory } from '@/lib/seo';
import { PaydayBurnRate } from './PaydayBurnRate';
import { PasswordStrengthRace } from './PasswordStrengthRace';
import { HypeTap } from './HypeTap';

interface Props {
  categorySlug: string;
  eventName: string;
}

export function CategoryTool({ categorySlug, eventName }: Props) {
  const tool = getToolForCategory(categorySlug);
  if (tool === 'finance') return <PaydayBurnRate />;
  if (tool === 'scam') return <PasswordStrengthRace />;
  return <HypeTap eventName={eventName} />;
}
