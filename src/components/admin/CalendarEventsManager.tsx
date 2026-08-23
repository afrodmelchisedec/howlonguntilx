// FILE: src/components/admin/CalendarEventsManager.tsx
'use client';
import { useEffect, useMemo, useState } from 'react';
import { CALENDAR_REGIONS, prettifyRegion } from '@/lib/calendar-shared';

interface CalendarAdminEvent {
  id: string;
  file: string;
  region: string;
  isoDate: string;
  rawDate: string;
  event: string;
  description: string;
  featured: boolean;
  slug?: string;
  emoji?: string;
  color?: string;
}

const EMPTY_FORM = {
  isoDate: '', region: CALENDAR_REGIONS[0] as string, event: '', description: '',
  featured: false, slug: '', emoji: '', color: '',
};

type SortKey = 'isoDate' | 'event' | 'region' | 'featured';
type SortDir = 'asc' | 'desc';
interface SortState { key: SortKey; dir: SortDir }

function toggleSort(current: SortState | null, key: SortKey): SortState {
  if (current?.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { key, dir: 'asc' };
}

function applySort(rows: CalendarAdminEvent[], sort: SortState | null): CalendarAdminEvent[] {
  if (!sort) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    if (typeof av === 'boolean' && typeof bv === 'boolean') return av === bv ? 0 : av ? -1 : 1;
    return String(av).localeCompare(String(bv), undefined, { sensitivity: 'base' });
  });
  if (sort.dir === 'desc') sorted.reverse();
  return sorted;
}

function SortableTh({ label, sortKey, sort, onSort }: {
  label: string; sortKey: SortKey; sort: SortState | null; onSort: (key: SortKey) => void;
}) {
  const active = sort?.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300">
      {label} <span style={{ opacity: active ? 1 : 0.25 }}>{active && sort?.dir === 'desc' ? '▼' : '▲'}</span>
    </th>
  );
}

function Pagination({ page, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems }: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
  pageSize: number; onPageSizeChange: (n: number) => void; totalItems: number;
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none">
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          ← Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

function downloadEventJson(ev: CalendarAdminEvent) {
  const exportObj: Record<string, any> = {
    isoDate: ev.isoDate,
    region: ev.region,
    event: ev.event,
    description: ev.description,
  };
  if (ev.featured) exportObj.featured = true;
  if (ev.slug) exportObj.slug = ev.slug;
  if (ev.emoji) exportObj.emoji = ev.emoji;
  if (ev.color) exportObj.color = ev.color;

  const json = JSON.stringify([exportObj], null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = (ev.slug || ev.event.toLowerCase().replace(/[^a-z0-9]+/g, '-')) + '.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function CalendarEventsManager() {
  const [events, setEvents] = useState<CalendarAdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [sort, setSort] = useState<SortState | null>({ key: 'isoDate', dir: 'asc' });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ created: number; updated: number; failed: { event: string; error?: string }[] } | null>(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { load(); }, []);

  function load() {
    setLoading(true);
    setLoadError('');
    fetch('/api/admin/calendar-events')
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setEvents(data.events || []);
      })
      .catch(e => setLoadError(e instanceof Error ? e.message : 'Could not load calendar events.'))
      .finally(() => setLoading(false));
  }

  function onSort(key: SortKey) { setSort(s => toggleSort(s, key)); setPage(1); }

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return events.filter(ev => {
      const matchSearch = !s || ev.event.toLowerCase().includes(s) || ev.description.toLowerCase().includes(s);
      const matchRegion = regionFilter === 'all' || ev.region === regionFilter;
      const matchFeatured = !featuredOnly || ev.featured;
      const evDate = new Date(ev.isoDate + 'T00:00:00');
      const matchTime = timeFilter === 'all'
        || (timeFilter === 'upcoming' && evDate >= today)
        || (timeFilter === 'past' && evDate < today);
      return matchSearch && matchRegion && matchFeatured && matchTime;
    });
  }, [events, search, regionFilter, featuredOnly, timeFilter]);

  const sorted = useMemo(() => applySort(filtered, sort), [filtered, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  function startAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  }

  function startEdit(ev: CalendarAdminEvent) {
    setEditingId(ev.id);
    setForm({
      isoDate: ev.isoDate, region: ev.region, event: ev.event, description: ev.description,
      featured: ev.featured, slug: ev.slug ?? '', emoji: ev.emoji ?? '', color: ev.color ?? '',
    });
    setFormError('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  async function save() {
    if (!form.isoDate) { setFormError('Date is required.'); return; }
    if (!form.event.trim()) { setFormError('Event name is required.'); return; }
    if (form.featured && !form.slug.trim()) { setFormError('Featured events need a slug — this is what the countdown link points to.'); return; }

    setSaving(true);
    setFormError('');
    try {
      const url = editingId ? `/api/admin/calendar-events/${encodeURIComponent(editingId)}` : '/api/admin/calendar-events';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'Save failed.'); return; }
      cancelForm();
      load();
    } catch {
      setFormError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(ev: CalendarAdminEvent) {
    if (!confirm(`Delete "${ev.event}" (${ev.rawDate})? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/calendar-events/${encodeURIComponent(ev.id)}`, { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { alert(data.error || 'Could not delete.'); return; }
    setEvents(rows => rows.filter(r => r.id !== ev.id));
  }

  async function toggleFeatured(ev: CalendarAdminEvent) {
    const res = await fetch(`/api/admin/calendar-events/${encodeURIComponent(ev.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isoDate: ev.isoDate, region: ev.region, event: ev.event, description: ev.description,
        featured: !ev.featured, slug: ev.slug, emoji: ev.emoji, color: ev.color,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || (!ev.featured ? 'Could not feature — does this event have a slug?' : 'Could not update.'));
      return;
    }
    load();
  }

  async function runImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      alert('Invalid JSON — check syntax');
      return;
    }
    setImporting(true);
    setImportResults(null);
    try {
      const res = await fetch('/api/admin/calendar-events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Import failed');
        return;
      }
      setImportResults(data);
      if (!data.failed || data.failed.length === 0) setJsonInput('');
      load();
    } catch {
      alert('Network error during import');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Calendar Events</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            The dated event source data behind the Event Calendar and the homepage's Live Ticker / Hero countdown. Only events marked <strong>Featured</strong> (with a slug) can appear in the homepage countdowns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(s => !s)}
            className="text-sm font-medium px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
            {showImport ? 'Hide import' : 'Import JSON'}
          </button>
          <button
            onClick={startAdd}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Add event
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <p className="text-sm font-medium mb-2">Bulk import</p>
          <p className="text-xs text-gray-400 mb-3">
            Paste an array of events. Each item: <code>isoDate</code> (YYYY-MM-DD), <code>region</code> (one of {CALENDAR_REGIONS.join(', ')}), <code>event</code>, <code>description</code>, and optionally <code>featured</code>, <code>slug</code>, <code>emoji</code>, <code>color</code>. Matching an existing event (same date + region + event name) updates it; otherwise a new one is created.
          </p>
          <textarea
            value={jsonInput}
            onChange={e => setJsonInput(e.target.value)}
            placeholder={'[\n  {\n    "isoDate": "2026-12-25",\n    "region": "united_states",\n    "event": "Christmas Day",\n    "description": "...",\n    "featured": true,\n    "slug": "christmas-2026",\n    "emoji": "🎄",\n    "color": "48, 219, 91"\n  }\n]'}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-xs font-mono min-h-[160px] mb-3" />
          <div className="flex items-center gap-3">
            <button
              onClick={runImport}
              disabled={importing || !jsonInput.trim()}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
              {importing ? 'Importing…' : 'Import events'}
            </button>
            {importResults && (
              <span className="text-xs text-gray-500">
                {importResults.created} created, {importResults.updated} updated
                {importResults.failed.length > 0 ? `, ${importResults.failed.length} failed` : ''}
              </span>
            )}
          </div>
          {importResults && importResults.failed.length > 0 && (
            <ul className="mt-3 text-xs text-red-500 space-y-1">
              {importResults.failed.map((f, i) => (
                <li key={i}>{f.event}: {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-2xl mb-6">
          <p className="text-sm font-medium mb-3">{editingId ? 'Edit event' : 'Add an event'}</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Date *</label>
              <input type="date" value={form.isoDate} onChange={e => setForm({ ...form, isoDate: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Region *</label>
              <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm">
                {CALENDAR_REGIONS.map(r => <option key={r} value={r}>{prettifyRegion(r)}</option>)}
              </select>
            </div>
          </div>

          <label className="block text-xs text-gray-400 mb-1">Event name *</label>
          <input value={form.event} onChange={e => setForm({ ...form, event: e.target.value })}
            placeholder="2026 FIFA World Cup Final (East Rutherford, NJ)"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm mb-3" />

          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="One sentence, plain language, no editorializing."
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm mb-3 min-h-[70px]" />

          <label className="flex items-center gap-2 text-sm mb-3">
            <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
            Featured — eligible to appear in the homepage Live Ticker / Hero countdown
          </label>

          {form.featured && (
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Slug *</label>
                <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="fifa-world-cup-2026-final"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
                <p className="text-[11px] text-gray-400 mt-1">Links to /questions/how-long-until-{form.slug || '...'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Emoji</label>
                <input value={form.emoji} onChange={e => setForm({ ...form, emoji: e.target.value })}
                  placeholder="⚽"
                  className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Color (R, G, B)</label>
                <div className="flex items-center gap-2">
                  <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
                    placeholder="64, 156, 255"
                    className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm" />
                  {form.color && (
                    <span className="w-6 h-6 rounded-full flex-shrink-0 border border-gray-200 dark:border-gray-700" style={{ background: `rgb(${form.color})` }} />
                  )}
                </div>
              </div>
            </div>
          )}

          {formError && (
            <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button onClick={save} disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add event'}
            </button>
            <button onClick={cancelForm} className="text-sm text-gray-400 hover:text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search event or description…"
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-sm w-64" />
        <select
          value={regionFilter}
          onChange={e => { setRegionFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-900 text-sm">
          <option value="all">All regions</option>
          {CALENDAR_REGIONS.map(r => <option key={r} value={r}>{prettifyRegion(r)}</option>)}
        </select>
        <select
          value={timeFilter}
          onChange={e => { setTimeFilter(e.target.value as any); setPage(1); }}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-2 bg-white dark:bg-gray-900 text-sm">
          <option value="all">All dates</option>
          <option value="upcoming">Upcoming only</option>
          <option value="past">Past only</option>
        </select>
        <label className="flex items-center gap-1.5 text-sm text-gray-500">
          <input type="checkbox" checked={featuredOnly} onChange={e => { setFeaturedOnly(e.target.checked); setPage(1); }} />
          Featured only
        </label>
      </div>

      {loadError && (
        <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
          {loadError}
        </p>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-12">Loading…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <SortableTh label="Date" sortKey="isoDate" sort={sort} onSort={onSort} />
                    <SortableTh label="Event" sortKey="event" sort={sort} onSort={onSort} />
                    <SortableTh label="Region" sortKey="region" sort={sort} onSort={onSort} />
                    <SortableTh label="Featured" sortKey="featured" sort={sort} onSort={onSort} />
                    <th className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(ev => (
                    <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">{ev.isoDate}</td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="font-medium">{ev.emoji ? `${ev.emoji} ` : ''}{ev.event}</p>
                        {ev.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{ev.description}</p>}
                        {ev.slug && <p className="text-xs text-gray-400 mt-0.5">/questions/how-long-until-{ev.slug}</p>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{prettifyRegion(ev.region)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeatured(ev)}
                          className={'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-colors ' + (ev.featured ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200')}>
                          <span className={'w-2 h-2 rounded-full ' + (ev.featured ? 'bg-green-500' : 'bg-gray-400')} />
                          {ev.featured ? 'Featured' : 'Not featured'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button onClick={() => startEdit(ev)} className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors">Edit</button>
                          <button
                            onClick={() => downloadEventJson(ev)}
                            title="Download this event's JSON"
                            className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            JSON
                          </button>
                          <button onClick={() => remove(ev)} className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pageRows.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-12">
                  {search || regionFilter !== 'all' || featuredOnly || timeFilter !== 'all' ? 'No events match your filters' : 'No calendar events yet — add one or import JSON above'}
                </p>
              )}
            </div>
            <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={n => { setPageSize(n); setPage(1); }} totalItems={sorted.length} />
          </>
        )}
      </div>
    </div>
  );
}
