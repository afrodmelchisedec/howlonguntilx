import { MeetingOverlapTabs } from '@/components/pro-tools/MeetingOverlapTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Time Zone Radar — Meeting Overlap Finder',
  description: 'Drag teammate work-hour arcs around a live radar to find your best meeting time across time zones.',
};

export default function MeetingOverlapPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>PLAY</p>
          <h1 className="text-largetitle mb-2">Time Zone Radar</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag each orbit's glowing handles to find when everyone's free.
          </p>
        </div>
        <MeetingOverlapTabs />
      </div>
    </div>
  );
}
