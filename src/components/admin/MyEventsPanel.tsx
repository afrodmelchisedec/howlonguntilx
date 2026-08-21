import Link from 'next/link';
import { MyEventsList } from '@/components/community/MyEventsList';

// Thin shell for the myEvents tab in the merged /users dashboard — wraps
// the existing, already-tested MyEventsList component (same component
// used by the standalone /dashboard/events route). Editing still happens
// on the standalone /dashboard/events/[id]/edit route, linked from inside
// MyEventsList itself.
export function MyEventsPanel({ events }: { events: any[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-medium mb-1">My events</h1>
          <p className="text-sm text-gray-400">Events you've created for the community.</p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          + New event
        </Link>
      </div>
      <MyEventsList events={events} />
    </div>
  );
}
