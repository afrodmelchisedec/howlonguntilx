import { DeadlineBufferSliderTabs } from '@/components/pro-tools/DeadlineBufferSliderTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Deadline Buffer Slider — Launch Countdown Planner',
  description: 'Drag your launch date and see real working days, split across design/dev/QA, recalculate live.',
};

export default function DeadlineBufferSliderPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(84, 158, 255)' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Deadline Buffer Slider</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag your launch date. Watch your real working time shrink or grow.
          </p>
        </div>
        <DeadlineBufferSliderTabs />
      </div>
    </div>
  );
}
