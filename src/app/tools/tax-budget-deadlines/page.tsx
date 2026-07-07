import { TaxBudgetDeadlinesTabs } from '@/components/pro-tools/TaxBudgetDeadlinesTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Tax & Budget Deadlines — Safe-Harbor Planner',
  description: 'Drag your tax deadline targets, track saved-so-far, and watch your Safe-Harbor Score update live.',
};

export default function TaxBudgetDeadlinesPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(245, 166, 35)' }}>FINANCE</p>
          <h1 className="text-largetitle mb-2">Tax & Budget Deadlines</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Every deadline. One score. Never caught short again.
          </p>
        </div>
        <TaxBudgetDeadlinesTabs />
      </div>
    </div>
  );
}
