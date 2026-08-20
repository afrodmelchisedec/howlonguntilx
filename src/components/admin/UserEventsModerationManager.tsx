'use client';
import { useEffect, useState } from 'react';

interface UserEventRow {
  id: string;
  slug: string;
  title: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  moderationStatus: 'APPROVED' | 'REJECTED' | 'REMOVED';
  moderationNote: string | null;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  createdAt: string;
  author: { id: string; name: string | null; email: string | null; blockedAt: string | null } | null;
  category: { id: string; slug: string; name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400',
  REMOVED: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
};

export function UserEventsModerationManager() {
  const [events, setEvents] = useState<UserEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'REJECTED' | 'REMOVED'>('ALL');
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    fetch('/api/admin/user-events')
      .then(r => r.json())
      .then(data => setEvents(data.userEvents || []))
      .catch(() => setError('Could not load community events.'))
      .finally(() => setLoading(false));
  }

  async function setStatus(ev: UserEventRow, moderationStatus: 'APPROVED' | 'REJECTED' | 'REMOVED') {
    let moderationNote: string | null = null;
    if (moderationStatus !== 'APPROVED') {
      moderationNote = window.prompt(
        'Reason for ' + (moderationStatus === 'REMOVED' ? 'removing' : 'rejecting') + ' "' + ev.title + '"? (optional)'
      );
      if (moderationNote === null) return; // cancelled
    }
    setSavingId(ev.id);
    try {
      const res = await fetch('/api/admin/user-events/' + ev.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderationStatus, moderationNote: moderationNote || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Update failed.'); return; }
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, ...data } : e));
    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }

  const filtered = events.filter(e => {
    if (statusFilter !== 'ALL' && e.moderationStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!e.title.toLowerCase().includes(q) &&
          !(e.author?.name || '').toLowerCase().includes(q) &&
          !(e.author?.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Community events ({filtered.length}{(search || statusFilter !== 'ALL') ? ' of ' + events.length : ''})</h2>
        <p className="text-xs text-gray-400 mt-0.5">User-submitted "How long until X?" events. Approve, reject, or remove.</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search title or author…"
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-sm w-64"
        />
        <div className="flex gap-1.5">
          {(['ALL', 'APPROVED', 'REJECTED', 'REMOVED'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
                statusFilter === s
                  ? 'bg-brand-500 border-brand-500 text-white'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}>
              {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">No community events match.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Event</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Author</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Visibility</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Engagement</th>
                <th className="text-left px-4 py-3 font-medium text-xs text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ev => (
                <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <a href={'/community/how-long-until-' + ev.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{ev.title}</a>
                    <p className="text-xs text-gray-400 mt-0.5">{ev.category?.name ?? 'Uncategorized'}{ev.moderationNote ? ' · "' + ev.moderationNote + '"' : ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{ev.author?.name ?? '—'}</p>
                    <p className="text-xs text-gray-400">
                      {ev.author?.email ?? ''}
                      {ev.author?.blockedAt && <span className="ml-1 text-red-500 font-medium">· blocked</span>}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">{ev.visibility}</td>
                  <td className="px-4 py-3">
                    <span className={'text-xs px-2 py-1 rounded-full font-medium ' + STATUS_COLORS[ev.moderationStatus]}>
                      {ev.moderationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    ❤️ {ev.likeCount} · 💬 {ev.commentCount} · 👁 {ev.viewCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {ev.moderationStatus !== 'APPROVED' && (
                        <button onClick={() => setStatus(ev, 'APPROVED')} disabled={savingId === ev.id}
                          className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          Approve
                        </button>
                      )}
                      {ev.moderationStatus !== 'REJECTED' && (
                        <button onClick={() => setStatus(ev, 'REJECTED')} disabled={savingId === ev.id}
                          className="text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          Reject
                        </button>
                      )}
                      {ev.moderationStatus !== 'REMOVED' && (
                        <button onClick={() => setStatus(ev, 'REMOVED')} disabled={savingId === ev.id}
                          className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
