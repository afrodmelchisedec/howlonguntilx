import { ShoppingDealsRadarTabs } from '@/components/pro-tools/ShoppingDealsRadarTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Deal Radar — Shopping & Deals',
  description: 'Spin the daily deal wheel, track discounts you care about, and never miss one before it expires.',
};

export default function ShoppingDealsRadarPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 90, 150)' }}>PLAY · LEISURE</p>
          <h1 className="text-largetitle mb-2">Deal Radar</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Spin daily. Save deals. Watch the savings add up.
          </p>
        </div>
        <ShoppingDealsRadarTabs />
      </div>
    </div>
  );
}
