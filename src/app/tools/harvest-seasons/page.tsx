import { HarvestSeasonsTabs } from '@/components/pro-tools/HarvestSeasonsTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Harvest Seasons — Season Basket',
  description: 'Build a basket of produce and watch a live season timeline, freshness meters, and peak alerts tell you exactly what to buy this week.',
};

export default function HarvestSeasonsPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(154, 205, 50)' }}>FOOD</p>
          <h1 className="text-largetitle mb-2">Harvest Seasons</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            A live calendar of what's actually worth buying — and exactly how many days until it peaks.
          </p>
        </div>
        <HarvestSeasonsTabs />
      </div>
    </div>
  );
}
