import { MoneyMilestonesTabs } from '@/components/pro-tools/MoneyMilestonesTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Money & Milestones — Growth Timeline',
  description: 'Drag your savings milestones onto a live growth curve and watch exactly when you\'ll hit each one.',
};

export default function MoneyMilestonesPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(52, 199, 89)' }}>FINANCE</p>
          <h1 className="text-largetitle mb-2">Money & Milestones</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Not how much you've saved — how long until you hit it. Drag your plan, watch the countdown move.
          </p>
        </div>
        <MoneyMilestonesTabs />
      </div>
    </div>
  );
}
