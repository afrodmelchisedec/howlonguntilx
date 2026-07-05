import { SubscriptionDensityTabs } from '@/components/pro-tools/SubscriptionDensityTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Subscription Renewal Density Map',
  description: 'Drag your subscriptions onto a calendar to see which weeks hit your card hardest — and catch duplicate charges.',
};

export default function SubscriptionDensityPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-orange))' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Subscription Density Map</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag renewals onto the calendar and watch your weekly card impact update live.
          </p>
        </div>
        <SubscriptionDensityTabs />
      </div>
    </div>
  );
}
