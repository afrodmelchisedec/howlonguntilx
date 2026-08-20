'use client';
import { useEffect, useState } from 'react';

interface CommentRow {
  id: string;
  subjectType: string;
  subjectId: string;
  body: string;
  createdAt: string;
  flaggedAt: string | null;
  flagReason: string | null;
  author: { id: string; name: string | null; email: string | null; blockedAt: string | null } | null;
  flaggedBy: { id: string; name: string | null } | null;
  subject: { title: string; href: string | null };
}

export function CommentsModerationManager() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    fetch('/api/admin/comments')
      .then(r => r.json())
      .then(data => setComments(data.comments || []))
      .catch(() => setError('Could not load comments.'))
      .finally(() => setLoading(false));
  }

  async function act(c: CommentRow, action: 'flag' | 'unflag' | 'remove') {
    if (action === 'remove' && !confirm('Remove this comment? This hides it (soft-delete), same as an author self-deleting.')) return;
    let reason: string | null = null;
    if (action === 'flag') {
      reason = window.prompt('Flag reason for this comment? (optional)');
      if (reason === null) return; // cancelled
    }
    setSavingId(c.id);
    try {
      const res = await fetch('/api/admin/comments/' + c.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Action failed.'); return; }
      if (action === 'remove') {
        setComments(prev => prev.filter(x => x.id !== c.id));
      } else {
        setComments(prev => prev.map(x => x.id === c.id ? { ...x, ...data } : x));
      }
    } catch {
      alert('Network error.');
    } finally {
      setSavingId(null);
    }
  }

  const filtered = comments.filter(c => {
    if (showFlaggedOnly && !c.flaggedAt) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!c.body.toLowerCase().includes(q) &&
          !(c.author?.name || '').toLowerCase().includes(q) &&
          !(c.author?.email || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Comments ({filtered.length}{(search || showFlaggedOnly) ? ' of ' + comments.length : ''})</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Flag marks a comment for review without hiding it. Remove soft-deletes it (same as an author deleting their own).
        </p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search comment text or author…"
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-sm w-64"
        />
        <button onClick={() => setShowFlaggedOnly(v => !v)}
          className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
            showFlaggedOnly
              ? 'bg-brand-500 border-brand-500 text-white'
              : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          )}>
          {showFlaggedOnly ? 'Flagged only' : 'All comments'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400">{showFlaggedOnly ? 'No flagged comments.' : 'No comments.'}</p>
      ) : (
        <div className="space-y-3 max-w-3xl">
          {filtered.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {c.author?.name ?? 'Unknown'}
                    {c.author?.blockedAt && <span className="ml-1 text-red-500 font-medium">· blocked</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    On: {c.subject.href ? (<a href={c.subject.href} target="_blank" className="hover:underline">{c.subject.title}</a>) : c.subject.title} ·{' '}
                    {c.subjectType} · {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                {c.flaggedAt && (
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex-shrink-0">
                    🚩 Flagged{c.flaggedBy?.name ? ' by ' + c.flaggedBy.name : ''}
                  </span>
                )}
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{c.body}</p>
              {c.flagReason && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Reason: {c.flagReason}</p>
              )}
              <div className="flex items-center gap-2">
                {c.flaggedAt ? (
                  <button onClick={() => act(c, 'unflag')} disabled={savingId === c.id}
                    className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                    Unflag
                  </button>
                ) : (
                  <button onClick={() => act(c, 'flag')} disabled={savingId === c.id}
                    className="text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                    Flag
                  </button>
                )}
                <button onClick={() => act(c, 'remove')} disabled={savingId === c.id}
                  className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
