'use client';

import { useEffect, useState } from 'react';

type Region = 'US' | 'EUROPE' | 'AFRICA' | 'MIDDLE_EAST' | 'CHINA' | 'INDIA';
type Sex = 'MALE' | 'FEMALE';

interface Row {
  id: string;
  region: Region;
  countryLabel: string;
  sex: Sex;
  age: number;
  remainingYears: number;
  source: string;
  sourceUrl: string | null;
  sourceYear: number;
  updatedAt: string;
}

interface Coverage { region: Region; MALE: number; FEMALE: number; latestSourceYear: number | null; }
interface Dataset { region: Region; sex: Sex; sourceYear: number; source: string; count: number; published: boolean; updatedAt: string; }

const REGION_LABELS: Record<Region, string> = {
  US: '🇺🇸 United States', EUROPE: '🇪🇺 Europe', AFRICA: '🌍 Africa',
  MIDDLE_EAST: '🌙 Middle East', CHINA: '🇨🇳 China', INDIA: '🇮🇳 India',
};

function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const AI_PROMPT_TEMPLATE = `I need an official, real life expectancy dataset formatted as JSON for my app's admin import tool.

Region: [e.g. Europe / Africa / Middle East / China / India / United States]
Source: use the most authoritative available — UN World Population Prospects (population.un.org/wpp) or WHO Global Health Observatory (who.int/data/gho) for most countries/regions; CDC NCHS or SSA Actuarial Life Tables (ssa.gov/oact/STATS/table4c6.html) if the region is the United States.
Most recent year available: [fill in, or ask me to find the latest]

For each single year of age from 0 to 110, and for both MALE and FEMALE, give me the remaining life expectancy at that age (not life expectancy at birth — the REMAINING years at each specific age).

Output ONLY a JSON array (no prose, no markdown fences) where each element has exactly this shape:

{
  "region": "[US|EUROPE|AFRICA|MIDDLE_EAST|CHINA|INDIA]",
  "countryLabel": "[display name, e.g. \\"European Union (avg)\\"]",
  "sex": "[MALE|FEMALE]",
  "age": [integer 0-110],
  "remainingYears": [number, one decimal place],
  "source": "[exact source name, e.g. \\"UN World Population Prospects 2024\\"]",
  "sourceUrl": "[direct URL to the data]",
  "sourceYear": [integer year the data is FROM, e.g. 2023]
}

Give me one array element per age per sex (222 elements total for ages 0-110 x 2 sexes). Use real published figures only — do not estimate or interpolate if you don't have the actual table; tell me instead which ages you're missing.`;

function CopyPromptBanner() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => alert('Could not copy — select and copy the prompt manually.'));
  }

  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-4 flex-wrap sm:flex-nowrap"
      style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(236,72,153,0.14), rgba(34,197,94,0.14))', border: '1px solid rgba(139,92,246,0.35)' }}
    >
      <div className="text-3xl flex-shrink-0">✨</div>
      <div className="flex-1 min-w-[240px]">
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Need an updated dataset later? Don't re‑figure this out — copy this prompt.</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Paste it into any capable AI chat, fill in the region and year, and it reproduces this exact import format — the same process used to build the US 2023 dataset above.
        </p>
      </div>
      <button
        onClick={handleCopy}
        className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
        style={{ background: copied ? '#22c55e' : 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
      >
        {copied ? '✓ Copied!' : '📋 Copy prompt'}
      </button>
    </div>
  );
}

export default function LifeExpectancyPanel() {
  const [coverage, setCoverage] = useState<Coverage[] | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [regionFilter, setRegionFilter] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [sort, setSort] = useState('region');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(true);

  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ upserted: number; failed: { index: number; error?: string }[] } | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, order });
    if (regionFilter) params.set('region', regionFilter);
    if (sexFilter) params.set('sex', sexFilter);
    // Cache-busting: add a timestamp and force no-store to avoid stale responses
    params.set('_', String(Date.now()));
    fetch(`/api/admin/life-expectancy/import?${params.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        console.log('[LifeExpectancyPanel] load() result:', data);
        setRows(data.rows ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setCoverage(data.coverage ?? null);
        setDatasets(data.datasets ?? []);
      })
      .catch(err => console.error('load error', err))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, pageSize, regionFilter, sexFilter, sort, order]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [regionFilter, sexFilter, pageSize]);

  async function handleImport() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportResult(null);
      alert('Invalid JSON — check syntax');
      return;
    }

    const items = Array.isArray(parsed) ? parsed : (parsed as any).items;
    if (!Array.isArray(items)) {
      alert('Payload must be an array, or an object with an "items" array.');
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setImportResult(null);
    let upsertedTotal = 0;
    let allFailed: { index: number; error?: string }[] = [];
    const CHUNK_SIZE = 50;
    const chunks: any[][] = [];
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      chunks.push(items.slice(i, i + CHUNK_SIZE));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      try {
        const res = await fetch('/api/admin/life-expectancy/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk),
        });
        const data = await res.json();
        if (!res.ok) {
          allFailed.push({ index: -1, error: data.error ?? `HTTP ${res.status}` });
        } else {
          upsertedTotal += data.upserted ?? 0;
          if (data.failed?.length) {
            allFailed.push(...data.failed.map((f: any) => ({ index: i * CHUNK_SIZE + f.index, error: f.error })));
          }
        }
      } catch (err: any) {
        allFailed.push({ index: -1, error: `Network error on chunk ${i + 1}: ${err.message}` });
      }
      setImportProgress(Math.round(((i + 1) / chunks.length) * 100));
    }

    setImportResult({ upserted: upsertedTotal, failed: allFailed });
    if (allFailed.length === 0) {
      setImportText('');
      load(); // refresh table
    }
    setImporting(false);
  }

  function startEdit(row: Row) {
    setEditingId(row.id);
    setEditValue(String(row.remainingYears));
  }

  async function saveEdit(row: Row) {
    const remainingYears = parseFloat(editValue);
    if (!Number.isFinite(remainingYears) || remainingYears < 0) { alert('Enter a valid positive number'); return; }
    try {
      const res = await fetch('/api/admin/life-expectancy/import', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, remainingYears }),
      });
      if (!res.ok) throw new Error();
      setRows(prev => prev.map(r => (r.id === row.id ? { ...r, remainingYears } : r)));
      setEditingId(null);
    } catch {
      alert('Could not save — try again');
    }
  }

  async function deleteRow(row: Row) {
    if (!confirm(`Delete ${REGION_LABELS[row.region]} · ${row.sex} · age ${row.age} (${row.sourceYear})?`)) return;
    try {
      const res = await fetch(`/api/admin/life-expectancy/import?id=${row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== row.id));
      setTotal(t => t - 1);
    } catch {
      alert('Could not delete — try again');
    }
  }

  async function toggleDataset(ds: Dataset) {
    const key = `${ds.region}__${ds.sex}__${ds.sourceYear}`;
    const nextPublished = !ds.published;
    setTogglingKey(key);
    try {
      const res = await fetch('/api/admin/life-expectancy/import', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: ds.region, sex: ds.sex, sourceYear: ds.sourceYear, published: nextPublished }),
      });
      if (!res.ok) throw new Error();
      setDatasets(prev => prev.map(d => {
        if (d.region === ds.region && d.sex === ds.sex && d.sourceYear === ds.sourceYear) return { ...d, published: nextPublished };
        if (nextPublished && d.region === ds.region && d.sex === ds.sex) return { ...d, published: false };
        return d;
      }));
      load(); // refresh coverage + rows
    } catch {
      alert('Could not update — try again');
    } finally {
      setTogglingKey(null);
    }
  }

  function onSort(field: string) {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSort(field); setOrder('asc'); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-1">Life expectancy source data</h1>
        <p className="text-sm text-gray-500">
          Powers the Life Expectancy Calculator. Import updates by region/sex/age/year — a new sourceYear never deletes the old one, and compute always uses the latest year available per region.
        </p>
      </div>

      {/* AI regeneration prompt banner */}
      <CopyPromptBanner />

      {/* Coverage cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {coverage?.map(c => {
          const hasData = c.MALE > 0 || c.FEMALE > 0;
          return (
            <div key={c.region} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide truncate">{REGION_LABELS[c.region]}</p>
              <p className={`text-lg font-semibold mt-1 ${hasData ? 'text-gray-900 dark:text-white' : 'text-amber-500'}`}>
                {c.MALE + c.FEMALE} rows
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ♂ {c.MALE} · ♀ {c.FEMALE}
                {c.latestSourceYear && <span className="block">latest: {c.latestSourceYear}</span>}
                {!hasData && <span className="block text-amber-500">using fallback model</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* Datasets — explicitly choose ONE active source year per region+sex */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Datasets</h2>
        <p className="text-xs text-gray-500 mb-3">
          Each region + sex has at most one <span className="font-semibold text-gray-700 dark:text-gray-300">active</span> source
          year — click "Set active" to switch it explicitly. This is not automatic: importing a newer year does NOT
          switch the front end over by itself, and activating a year automatically deactivates whichever year was
          active before it for that same region + sex. Nothing here deletes or overwrites data — inactive years stay
          in the table, ready to reactivate any time.
        </p>
        {datasets.length === 0 && !loading && (
          <p className="text-sm text-gray-500 py-4">No datasets yet — import rows below to see them here.</p>
        )}
        {datasets.length > 0 && (() => {
          const groups = new Map<string, Dataset[]>();
          datasets.forEach(ds => {
            const gKey = `${ds.region}__${ds.sex}`;
            if (!groups.has(gKey)) groups.set(gKey, []);
            groups.get(gKey)!.push(ds);
          });
          const groupEntries = Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));

          return (
            <div className="space-y-5">
              {groupEntries.map(([gKey, group]) => {
                const [region, sex] = gKey.split('__') as [Region, Sex];
                const active = group.find(d => d.published);
                const sorted = [...group].sort((a, b) => b.sourceYear - a.sourceYear);
                return (
                  <div key={gKey} className="border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-white/[0.03]">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {REGION_LABELS[region]} · {sex === 'MALE' ? '♂ Male' : '♀ Female'}
                      </span>
                      <span className={`text-xs font-medium ${active ? 'text-green-600 dark:text-green-400' : 'text-amber-500'}`}>
                        {active ? `Active: ${active.sourceYear}` : 'No active year — using fallback model'}
                      </span>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {sorted.map(ds => {
                          const key = `${ds.region}__${ds.sex}__${ds.sourceYear}`;
                          const isToggling = togglingKey === key;
                          return (
                            <tr key={key} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                              <td className="px-3 py-2.5 w-6">
                                <span
                                  className={`inline-block w-2.5 h-2.5 rounded-full ${ds.published ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}`}
                                  title={ds.published ? 'Active' : 'Inactive'}
                                />
                              </td>
                              <td className="px-1 py-2.5 text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap w-16">{ds.sourceYear}</td>
                              <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap w-20">{ds.count} rows</td>
                              <td className="px-3 py-2.5 text-gray-500 text-xs truncate" title={ds.source}>{ds.source}</td>
                              <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap w-28">{shortDate(ds.updatedAt)}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-right w-32">
                                <button
                                  onClick={() => toggleDataset(ds)}
                                  disabled={isToggling || (ds.published && group.length === 1)}
                                  className={`text-xs font-medium hover:underline disabled:opacity-40 disabled:no-underline ${
                                    ds.published ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                                  }`}>
                                  {isToggling ? 'Saving…' : ds.published ? 'Deactivate' : 'Set active'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Import box with progress bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Import from JSON</h2>
        <p className="text-xs text-gray-500 mb-3">
          Upserts by region + sex + age + sourceYear. Array of rows, or an object with an "items" array.
        </p>
        <textarea
          value={importText}
          onChange={e => setImportText(e.target.value)}
          placeholder={'[{"region":"US","countryLabel":"United States","sex":"MALE","age":35,"remainingYears":43.2,"source":"CDC NVSS U.S. Life Tables","sourceUrl":"https://www.cdc.gov/nchs/products/life_tables.htm","sourceYear":2023}]'}
          rows={6}
          className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-mono px-3 py-2 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={importing || !importText.trim()}
            className="bg-brand-500 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {importing ? 'Importing…' : 'Import rows'}
          </button>
          {importing && (
            <div className="flex-1 max-w-xs">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>Progress:</span>
                <span className="font-mono">{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {importResult && (
          <div className="mt-4 text-sm">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {importResult.upserted} upserted · {importResult.failed.length} failed
            </p>
            {importResult.failed.length > 0 && (
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {importResult.failed.map((f, i) => (
                  <li key={i} className="text-red-500 dark:text-red-400 text-xs font-mono">
                    {f.index >= 0 ? <span className="font-semibold">row {f.index}</span> : <span className="font-semibold">request</span>}: {f.error ?? 'Unknown error'}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Data table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mr-auto">Imported rows</h2>
          <select
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="">All regions</option>
            {(Object.keys(REGION_LABELS) as Region[]).map(r => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
          </select>
          <select
            value={sexFilter}
            onChange={e => setSexFilter(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="">Male &amp; Female</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {[
                  ['region', 'Region'], ['sex', 'Sex'], ['age', 'Age'],
                  ['remainingYears', 'Remaining yrs'], ['sourceYear', 'Year'], ['updatedAt', 'Updated'],
                ].map(([field, label]) => (
                  <th
                    key={field}
                    onClick={() => onSort(field)}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
                    {label} {sort === field ? (order === 'asc' ? '▲' : '▼') : ''}
                  </th>
                ))}
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Source</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">Loading…</td></tr>
              )}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">No rows yet — import some above, or the calculator is running on the approximate fallback model.</td></tr>
              )}
              {!loading && rows.map(row => (
                <tr key={row.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200 whitespace-nowrap">{REGION_LABELS[row.region]}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.sex === 'MALE' ? '♂ Male' : '♀ Female'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.age}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editingId === row.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && saveEdit(row)}
                        className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    ) : (
                      <span className="text-gray-900 dark:text-gray-200 font-medium">{row.remainingYears}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{row.sourceYear}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{shortDate(row.updatedAt)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate" title={row.source}>
                    {row.sourceUrl ? <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">{row.source}</a> : row.source}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {editingId === row.id ? (
                      <>
                        <button onClick={() => saveEdit(row)} className="text-brand-500 text-xs font-medium mr-3 hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 text-xs font-medium hover:underline">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(row)} className="text-brand-500 text-xs font-medium mr-3 hover:underline">Edit</button>
                        <button onClick={() => deleteRow(row)} className="text-red-500 text-xs font-medium hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span>{total === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
              {[25, 50, 100, 200].map(n => <option key={n} value={n}>{n} / page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5">‹</button>
            <span className="px-2 text-xs">Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
