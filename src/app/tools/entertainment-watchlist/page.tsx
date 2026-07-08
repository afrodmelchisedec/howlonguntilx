import { EntertainmentWatchlistTabs } from '@/components/pro-tools/EntertainmentWatchlistTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Entertainment — Release Queue',
  description: 'Track movies, shows, games, and albums with a drag-to-reorder priority queue, a marquee countdown hero, a release calendar, and binge pace tracking.',
};

export default function EntertainmentWatchlistPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(255, 45, 85)' }}>LEISURE</p>
          <h1 className="text-largetitle mb-2">Entertainment</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag to prioritize. Watch the countdown. Know if you'll actually finish in time.
          </p>
        </div>
        <EntertainmentWatchlistTabs />
      </div>
    </div>
  );
}
