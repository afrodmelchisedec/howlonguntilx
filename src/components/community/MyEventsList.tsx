'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast, ToastHost } from '@/components/ui/Toast';

interface MyEvent {
  id: string;
  slug: string;
  title: string;
  targetDate: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  moderationStatus: 'APPROVED' | 'REJECTED' | 'REMOVED';
  moderationNote?: string | null;
}

export function MyEventsList({ events }: { events: MyEvent[] }) {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user-events/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Could not delete event', '⚠️');
        return;
      }
      showToast('Event deleted', '✅');
      router.refresh();
    } catch {
      showToast('Network error — please try again', '⚠️');
    } finally {
      setDeletingId(null);
    }
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-gray-400">
        <ToastHost toast={toast} />
        You haven't created any events yet.{' '}
        <Link href="/dashboard/events/new" className="underline">Create one</Link>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ToastHost toast={toast} />
      {events.map(ev => (
        <div
          key={ev.id}
          className="flex items-center justify-between gap-4 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{ev.title}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(ev.targetDate).toLocaleString()} · {ev.visibility}
              {ev.moderationStatus === 'REJECTED' && (
                <span className="text-amber-500"> · Rejected by moderator{ev.moderationNote ? ': ' + ev.moderationNote : ''}</span>
              )}
              {ev.moderationStatus === 'REMOVED' && (
                <span className="text-red-500"> · Removed by moderator</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {ev.moderationStatus === 'APPROVED' && (
              <Link
                href={`/community/how-long-until-${ev.slug}`}
                className="text-[12px] text-gray-400 hover:underline"
              >
                View
              </Link>
            )}
            <Link
              href={`/dashboard/events/${ev.id}/edit`}
              className="text-[12px] underline"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(ev.id, ev.title)}
              disabled={deletingId === ev.id}
              className="text-[12px] text-red-500 underline disabled:opacity-50"
            >
              {deletingId === ev.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
