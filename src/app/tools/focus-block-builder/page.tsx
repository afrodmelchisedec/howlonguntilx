import { FocusBlockBuilderTabs } from '@/components/pro-tools/FocusBlockBuilderTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Focus Block Builder — Day Timeline',
  description: 'Drag task blocks onto a single-day timeline and watch hours allocated, free time, and overlaps update live.',
};

export default function FocusBlockBuilderPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(138, 124, 255)' }}>LEISURE · PRODUCTIVITY</p>
          <h1 className="text-largetitle mb-2">Focus Block Builder</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag your whole day into shape. Watch the moment it stops fitting.
          </p>
        </div>
        <FocusBlockBuilderTabs />
      </div>
    </div>
  );
}
