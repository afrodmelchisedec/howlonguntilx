import { EnergyRhythmMapperTabs } from '@/components/pro-tools/EnergyRhythmMapperTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Energy Rhythm Mapper — Health & Wellness',
  description: 'Draw your energy across the day, find your Flow Window, and build a daily streak tracking your rhythm.',
};

export default function EnergyRhythmMapperPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 138, 101)' }}>LEISURE · HEALTH & WELLNESS</p>
          <h1 className="text-largetitle mb-2">Energy Rhythm Mapper</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Draw your day the way it actually feels. Find your best hours. Protect them.
          </p>
        </div>
        <EnergyRhythmMapperTabs />
      </div>
    </div>
  );
}
