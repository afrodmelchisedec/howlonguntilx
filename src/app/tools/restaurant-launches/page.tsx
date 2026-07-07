import { RestaurantLaunchesTabs } from '@/components/pro-tools/RestaurantLaunchesTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Restaurant Launches — Grand Opening Tracker',
  description: 'Live countdowns to upcoming restaurant openings, with hype meters and a draggable personal watchlist.',
};

export default function RestaurantLaunchesPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 107, 53)' }}>PLAY · FOOD</p>
          <h1 className="text-largetitle mb-2">Restaurant Launches</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Watch the countdown. Hype it up. Never miss opening day.
          </p>
        </div>
        <RestaurantLaunchesTabs />
      </div>
    </div>
  );
}
