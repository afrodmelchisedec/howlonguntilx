// FILE: src/components/admin/ReviewersManager.tsx
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reviewer {
  id: string;
  slug: string;
  name: string;
  credentials: string | null;
  title: string | null;
  specialty: string | null;
  bio: string;
  photoUrl: string | null;
  active: boolean;
  _count?: { articles: number; events: number };
}

const EMPTY = {
  slug: '', name: '', credentials: '', title: '', specialty: '', bio: '', photoUrl: '', active: true,
};

export function ReviewersManager() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    fetch('/api/admin/reviewers')
      .then(r => r.json())
      .then(data => setReviewers(data.reviewers || []))
      .catch(() => setError('Could not load reviewers.'))
      .finally(() => setLoading(false));
  }

  function startEdit(r: Reviewer) {
    setEditingId(r.id);
    setForm({
      slug: r.slug, name: r.name, credentials: r.credentials || '', title: r.title || '',
      specialty: r.specialty || '', bio: r.bio, photoUrl: r.photoUrl || '', active: r.active,
    });
    setError('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY);
    setError('');
  }

  async function save() {
    if (!form.name.trim() || !form.slug.trim() || !form.bio.trim()) {
      setError('Name, slug, and bio are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(editingId ? `/api/admin/reviewers/${editingId}` : '/api/admin/reviewers', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed.');
        return;
      }
      cancelEdit();
      load();
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(r: Reviewer) {
    if (!confirm(`Delete reviewer "${r.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/reviewers/${r.id}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Could not delete.');
      return;
    }
    load();
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Reviewers</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Expert reviewers assignable to articles and events. Each gets a public profile at /reviewers/[slug].
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-2xl mb-6">
        <p className="text-sm font-medium mb-3">{editingId ? 'Edit reviewer' : 'Add a reviewer'}</p>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Dr. John Doe"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Slug *</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="dr-john-doe"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Credentials</label>
            <input value={form.credentials} onChange={e => setForm({ ...form, credentials: e.target.value })}
              placeholder="MBChB"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Medical Practitioner"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
          </div>
        </div>

        <label className="block text-xs text-gray-400 mb-1">Specialty</label>
        <input value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })}
          placeholder="General Medicine"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm mb-3" />

        <label className="block text-xs text-gray-400 mb-1">Photo URL</label>
        <input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })}
          placeholder="https://.../headshot.jpg"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm mb-3" />

        <label className="block text-xs text-gray-400 mb-1">Bio *</label>
        <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
          placeholder="Dr. John Doe is a medical practitioner with experience in..."
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm mb-3 min-h-[90px]" />

        <label className="flex items-center gap-2 text-sm mb-4">
          <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
          Active — eligible to be assigned and shown publicly
        </label>

        {error && (
          <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add reviewer'}
          </button>
          {editingId && (
            <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : reviewers.length === 0 ? (
        <p className="text-sm text-gray-400">No reviewers yet — add one above.</p>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {reviewers.map(r => (
            <div key={r.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {r.photoUrl ? (
                  <img
                    src={r.photoUrl}
                    alt={r.name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    <Link href={`/reviewers/${r.slug}`} target="_blank" className="hover:underline hover:text-brand-500">
                      {r.name}{r.credentials ? `, ${r.credentials}` : ''}
                    </Link>
                    {!r.active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    /reviewers/{r.slug} · {r._count?.articles ?? 0} articles · {r._count?.events ?? 0} events
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button onClick={() => startEdit(r)} className="text-xs text-brand-500 hover:underline">Edit</button>
                <button onClick={() => remove(r)} className="text-xs text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}