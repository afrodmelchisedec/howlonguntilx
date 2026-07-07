import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCalendarMonth } from '@/lib/calendar';
import { EventCalendar } from '@/components/calendar/EventCalendar';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Event Calendar',
  description: 'Browse what happened, and what\'s coming up, day by day.',
};

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  const isPro = session?.user?.plan === 'PRO' || session?.user?.role === 'ADMIN';

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const events = getCalendarMonth(year, month);

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>EXPLORE</p>
          <h1 className="text-largetitle mb-2">Event Calendar</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Click any day for a random fact from that date.
          </p>
        </div>
        <EventCalendar
          initialYear={year}
          initialMonth={month}
          initialEvents={events}
          isPro={isPro}
        />
      </div>
    </div>
  );
}
