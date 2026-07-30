// FILE: src/components/admin/LeadMagnetManager.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

type Config = {
  headline: string;
  description: string;
  ctaLabel: string;
  fileUrl: string;
  active: boolean;
};

type Subscriber = {
  id: string;
  name: string;
  email: string;
  region: string;
  source: string;
  createdAt: string;
};

const EMPTY: Config = {
  headline: '',
  description: '',
  ctaLabel: 'Send me the calendar',
  fileUrl: '',
  active: false,
};

const REGIONS = [
  { value: 'AMERICAS', label: 'Americas', emoji: '🌎', color: '99, 102, 241' },
  { value: 'EUROPE', label: 'Europe', emoji: '🌍', color: '168, 85, 247' },
  { value: 'ASIA', label: 'Asia', emoji: '🌏', color: '236, 72, 153' },
  { value: 'AFRICA', label: 'Africa', emoji: '🌍', color: '34, 197, 94' },
  { value: 'MIDDLE_EAST', label: 'Middle East', emoji: '🕌', color: '245, 158, 11' },
  { value: 'AUSTRALIA', label: 'Australia', emoji: '🦘', color: '14, 165, 233' },
] as const;

const REGION_MAP: Record<string, (typeof REGIONS)[number]> = Object.fromEntries(
  REGIONS.map(r => [r.value, r])
);

type SortField = 'name' | 'email' | 'region' | 'createdAt';

export function LeadMagnetManager() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [configRes, subsRes] = await Promise.all([
        fetch('/api/admin/lead-magnet'),
        fetch('/api/admin/lead-magnet/subscribers'),
      ]);
      const configData = await configRes.json();
      const subsData = await subsRes.json();
      setConfig(configData.config);
      setSubscribers(subsData.subscribers || []);
    } catch {
      setError('Could not load current settings.');
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');

    if (!config.fileUrl.trim()) {
      setError("File URL is required — paste a real link to the PDF/ICS before saving (the placeholder text alone won't count).");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/lead-magnet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Save failed.');
        return;
      }
      setConfig(data);
      setSaved(true);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  }

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    subscribers.forEach(s => { counts[s.region] = (counts[s.region] || 0) + 1; });
    return counts;
  }, [subscribers]);

  const filtered = useMemo(() => {
    let list = subscribers;

    if (regionFilter) {
      list = list.filter(s => s.region === regionFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    }

    return [...list].sort((a, b) => {
      let av: string;
      let bv: string;
      if (sortField === 'createdAt') {
        av = new Date(a.createdAt).getTime().toString().padStart(20, '0');
        bv = new Date(b.createdAt).getTime().toString().padStart(20, '0');
      } else {
        av = a[sortField].toLowerCase();
        bv = b[sortField].toLowerCase();
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subscribers, regionFilter, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(1);
  }

  function sortIcon(field: SortField) {
    if (sortField !== field) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Lead magnet</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Sitewide banner shown to every visitor until they sign up or dismiss it. {subscribers.length} subscriber{subscribers.length === 1 ? '' : 's'} so far.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-2xl mb-6">
        <label className="block text-xs text-gray-400 mb-1">Headline</label>
        <input
          value={config.headline}
          onChange={e => setConfig({ ...config, headline: e.target.value })}
          placeholder="Get the free 2026–2027 Event Calendar"
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none text-sm mb-3"
        />

        <label className="block text-xs text-gray-400 mb-1">Description</label>
        <textarea
          value={config.description}
          onChange={e => setConfig({ ...config, description: e.target.value })}
          placeholder="50+ dates worth planning around, delivered to your inbox."
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none text-sm mb-3 min-h-[70px]"
        />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Button label</label>
            <input
              value={config.ctaLabel}
              onChange={e => setConfig({ ...config, ctaLabel: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none text-sm"
            />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs text-gray-400 mb-1">File URL (PDF / ICS) *</label>
            <input
              value={config.fileUrl}
              onChange={e => setConfig({ ...config, fileUrl: e.target.value })}
              placeholder="https://howlonguntilx.com/downloads/event-calendar-2026.pdf"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm mb-4">
          <input
            type="checkbox"
            checked={config.active}
            onChange={e => setConfig({ ...config, active: e.target.checked })}
          />
          Active — show this banner on the site
        </label>

        {error && (
          <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save banner'}
          </button>
          {saved && <span className="text-xs text-green-500">Saved ✓</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 max-w-4xl flex-wrap gap-2">
        <h3 className="text-base font-semibold">Subscribers</h3>
        <a
          href="/api/admin/lead-magnet/subscribers/export"
          className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          ⬇ Export CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-2 mb-3 max-w-4xl">
        <button
          onClick={() => { setRegionFilter(null); setPage(1); }}
          className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
          style={
            regionFilter === null
              ? { background: 'rgba(124,92,255,0.18)', borderColor: 'rgba(124,92,255,0.4)', color: '#a78bfa' }
              : { background: 'transparent', borderColor: 'rgba(255,255,255,0.14)', color: '#9a9aa5' }
          }
        >
          All ({subscribers.length})
        </button>
        {REGIONS.map(r => {
          const count = regionCounts[r.value] || 0;
          const active = regionFilter === r.value;
          return (
            <button
              key={r.value}
              onClick={() => { setRegionFilter(active ? null : r.value); setPage(1); }}
              className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
              style={{
                background: active ? `rgba(${r.color}, 0.22)` : `rgba(${r.color}, 0.08)`,
                borderColor: `rgba(${r.color}, ${active ? 0.6 : 0.25})`,
                color: `rgb(${r.color})`,
              }}
            >
              {r.emoji} {r.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 max-w-4xl flex-wrap">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 focus:outline-none text-sm"
        />
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Rows:</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 text-sm"
          >
            {[10, 20, 50, 100].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-4xl overflow-x-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">
            {subscribers.length === 0 ? 'No subscribers yet.' : 'No subscribers match your search/filter.'}
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    Name {sortIcon('name')}
                  </th>
                  <th className="px-4 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort('email')}>
                    Email {sortIcon('email')}
                  </th>
                  <th className="px-4 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort('region')}>
                    Region {sortIcon('region')}
                  </th>
                  <th className="px-4 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                    Signed up {sortIcon('createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(s => {
                  const r = REGION_MAP[s.region];
                  return (
                    <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800/60 last:border-0">
                      <td className="px-4 py-2">{s.name}</td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{s.email}</td>
                      <td className="px-4 py-2">
                        {r ? (
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ background: `rgba(${r.color}, 0.15)`, color: `rgb(${r.color})` }}
                          >
                            {r.emoji} {r.label}
                          </span>
                        ) : (
                          s.region
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-4 py-3 text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 flex-wrap gap-2">
              <span>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                >
                  ‹
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
