import { JetLagAdjustmentDraggerTabs } from '@/components/pro-tools/JetLagAdjustmentDraggerTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Jet-Lag Adjustment Dragger — Sleep-Shift Planner',
  description: 'Drag your home and destination bedtimes on a dual 24-hour ring and get a personalized pre-flight sleep-shift schedule.',
};

export default function JetLagAdjustmentDraggerPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(64, 201, 196)' }}>TRAVEL</p>
          <h1 className="text-largetitle mb-2">Jet-Lag Adjustment Dragger</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Two bedtimes, one ring. Drag either and watch your whole pre-flight sleep plan rebuild.
          </p>
        </div>
        <JetLagAdjustmentDraggerTabs />
      </div>
    </div>
  );
}
