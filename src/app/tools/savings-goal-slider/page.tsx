import { SavingsGoalSliderTabs } from '@/components/pro-tools/SavingsGoalSliderTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Savings Goal Allocation Slider — Goal Stack Planner',
  description: 'Drag your monthly savings across multiple goals and watch months-to-goal recalculate live.',
};

export default function SavingsGoalSliderPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(52, 199, 89)' }}>FINANCE</p>
          <h1 className="text-largetitle mb-2">Savings Goal Allocation Slider</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            One monthly total. Every goal fighting for its share. Drag to see who wins.
          </p>
        </div>
        <SavingsGoalSliderTabs />
      </div>
    </div>
  );
}
