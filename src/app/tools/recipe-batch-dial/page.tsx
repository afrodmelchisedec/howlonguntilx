import { RecipeBatchDialTabs } from '@/components/pro-tools/RecipeBatchDialTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Recipe Batch-Scale Dial',
  description: 'Drag a dial to scale any recipe up or down and watch every ingredient stretch in real time.',
};

export default function RecipeBatchDialPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 122, 60)' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Recipe Batch-Scale Dial</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Twist the dial. Every ingredient scales with you.
          </p>
        </div>
        <RecipeBatchDialTabs />
      </div>
    </div>
  );
}
