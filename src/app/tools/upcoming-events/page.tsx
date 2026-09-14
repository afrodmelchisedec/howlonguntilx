import { TechEventsCalendarTabs } from '@/components/pro-tools/TechEventsCalendarTabs';

export const metadata = {
  title: 'Tech Events Calendar — Tech',
  description: 'Every major keynote, product launch, and conference on one calendar — CES, WWDC, Google I/O, and more, with countdowns and a saveable watchlist.',
};

export default function TechEventsCalendarPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(162, 137, 255)' }}>TECH · EVENTS</p>
          <h1 className="text-largetitle mb-2">Tech Events Calendar</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Every keynote, launch, and conference — laid out on a calendar that's actually nice to browse.
          </p>
        </div>
        <TechEventsCalendarTabs />
      </div>
    </div>
  );
}
