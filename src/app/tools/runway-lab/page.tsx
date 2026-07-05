import { RunwayLabTabs } from '@/components/pro-tools/RunwayLabTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Runway Lab — Payday Budget Simulator',
  description: 'Drag your income, expenses, and spending split to see your budget runway update in real time.',
};

export default function RunwayLabPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Runway Lab</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag everything. Watch the runway change instantly.
          </p>
        </div>
        <RunwayLabTabs />
      </div>
    </div>
  );
}
