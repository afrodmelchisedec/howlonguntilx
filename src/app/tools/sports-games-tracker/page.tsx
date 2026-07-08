import { SportsGamesTrackerTabs } from '@/components/pro-tools/SportsGamesTrackerTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Sports & Games — Game Day Tracker',
  description: 'Track upcoming games with a scoreboard countdown, a game-density heatmap, prediction tug-of-war sliders, and a running prediction accuracy score.',
};

export default function SportsGamesTrackerPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(0, 209, 255)' }}>LEISURE</p>
          <h1 className="text-largetitle mb-2">Sports & Games</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Countdown to kickoff. Predict the winner. See how good your gut really is.
          </p>
        </div>
        <SportsGamesTrackerTabs />
      </div>
    </div>
  );
}
