// FILE: src/app/admin/ApiUsersPanel.tsx
'use client';

import { useEffect, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type Tier = 'GROWTH' | 'SCALE';
type ApiKeyStatus = 'pending' | 'active' | 'suspended' | 'cancelled';

interface Stats {
  totalKeys: number;
  byTier: Record<Tier, number>;
  byStatus: Record<ApiKeyStatus, number>;
  mrrCents: number;
  newThisMonthCents: number;
  newThisYearCents: number;
}

interface ApiKeyRow {
  id: string;
  keyMasked: string;
  tier: Tier;
  status: ApiKeyStatus;
  creditLimit: number;
  creditsUsed: number;
  creditsRemaining: number;
  periodStart: string;
  periodEnd: string;
  paypalSubscriptionId: string | null;
  createdAt: string;
  revokedAt: string | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
}

interface PagedResponse<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers — kept local to this file so it stays fully isolated from the
// Pro-plan SubscribersPanel (deliberately duplicated, not shared, per the
// same "no shared billing code" principle used everywhere else in this
// system).
// ─────────────────────────────────────────────────────────────────────────

function money(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

function shortDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const STATUS_STYLES: Record<ApiKeyStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-400',
  active: 'bg-green-500/10 text-green-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  cancelled: 'bg-red-500/10 text-red-400',
};

function StatusPill({ status }: { status: ApiKeyStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function TierPill({ tier }: { tier: Tier }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        tier === 'SCALE' ? 'bg-purple-500/15 text-purple-300' : 'bg-sky-500/15 text-sky-300'
      }`}>
      {tier}
    </span>
  );
}

function StatCard({ label, value, accent = 'text-gray-900 dark:text-white' }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

function SortableTh({
  label,
  field,
  sort,
  order,
  onSort,
}: {
  label: string;
  field: string;
  sort: string;
  order: 'asc' | 'desc';
  onSort: (field: string) => void;
}) {
  const active = sort === field;
  return (
    <th
      onClick={() => onSort(field)}
      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300 transition-colors whitespace-nowrap">
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active ? 'text-brand-400' : 'text-gray-700'}`}>
          {active ? (order === 'asc' ? '▲' : '▼') : '▲'}
        </span>
      </span>
    </th>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (n: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-400">
      <div className="flex items-center gap-2">
        <span>
          {from}–{to} of {total}
        </span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          {[10, 20, 50, 100].map(n => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          ‹
        </button>
        <span className="px-2 text-xs text-gray-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          ›
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Credit bar — small visual so an admin can eyeball usage without doing
// mental math on creditsUsed/creditLimit.
// ─────────────────────────────────────────────────────────────────────────

function CreditBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap tabular-nums">{pct}%</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────

export default function ApiUsersPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setStatsLoading(true);
    fetch('/api/admin/api-keys/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, [refreshKey]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-1">API users &amp; credits</h1>
        <p className="text-sm text-gray-500">
          Isolated from Pro-plan billing — tracks Growth/Scale API subscriptions, live from PayPal webhook events.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total API keys" value={statsLoading ? '—' : stats?.totalKeys ?? 0} />
        <StatCard label="Growth (active)" value={statsLoading ? '—' : stats?.byTier.GROWTH ?? 0} accent="text-sky-400" />
        <StatCard label="Scale (active)" value={statsLoading ? '—' : stats?.byTier.SCALE ?? 0} accent="text-purple-300" />
        <StatCard label="Pending" value={statsLoading ? '—' : stats?.byStatus.pending ?? 0} accent="text-amber-400" />
        <StatCard label="Active" value={statsLoading ? '—' : stats?.byStatus.active ?? 0} accent="text-green-400" />
        <StatCard label="Suspended" value={statsLoading ? '—' : stats?.byStatus.suspended ?? 0} accent="text-orange-400" />
        <StatCard label="Cancelled" value={statsLoading ? '—' : stats?.byStatus.cancelled ?? 0} accent="text-red-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Est. MRR (active keys)"
          value={statsLoading ? '—' : money(stats?.mrrCents ?? 0)}
          accent="text-green-400"
        />
        <StatCard
          label="New this month (est.)"
          value={statsLoading ? '—' : money(stats?.newThisMonthCents ?? 0)}
          accent="text-green-400"
        />
        <StatCard
          label="New this year (est.)"
          value={statsLoading ? '—' : money(stats?.newThisYearCents ?? 0)}
          accent="text-green-400"
        />
      </div>
      <p className="text-xs text-gray-500 -mt-4">
        Revenue figures are estimated from active-key counts × tier price ($10 Growth / $100 Scale) — PayPal remains
        the source of truth for actual transactions.
      </p>

      <ApiKeysTable onMutated={() => setRefreshKey(k => k + 1)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// API keys table
// ─────────────────────────────────────────────────────────────────────────

function ApiKeysTable({ onMutated }: { onMutated: () => void }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [tier, setTier] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);

  const [data, setData] = useState<PagedResponse<ApiKeyRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => setPage(1), [tier, status, debouncedSearch, pageSize]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, order });
    if (tier) params.set('tier', tier);
    if (status) params.set('status', status);
    if (debouncedSearch) params.set('q', debouncedSearch);

    fetch(`/api/admin/api-keys/users?${params.toString()}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, pageSize, sort, order, tier, status, debouncedSearch, reloadFlag]);

  function onSort(field: string) {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setOrder('desc');
    }
  }

  async function runAction(id: string, action: 'revoke' | 'reactivate', confirmMsg?: string) {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Request failed');
      setReloadFlag(f => f + 1);
      onMutated();
    } catch {
      alert('Action failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }

  async function adjustCredits(id: string, creditLimit: number, creditsUsed: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjustCredits', creditLimit, creditsUsed }),
      });
      if (!res.ok) throw new Error('Request failed');
      setEditingId(null);
      setReloadFlag(f => f + 1);
      onMutated();
    } catch {
      alert('Adjustment failed — check the console/network tab for details.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mr-auto">API keys</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, subscription id…"
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 w-64 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          <option value="">All tiers</option>
          <option value="GROWTH">Growth</option>
          <option value="SCALE">Scale</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          <option value="">All statuses</option>
          {(['pending', 'active', 'suspended', 'cancelled'] as ApiKeyStatus[]).map(s => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="User" field="userName" sort={sort} order={order} onSort={onSort} />
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Key</th>
              <SortableTh label="Tier" field="tier" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Status" field="status" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Credits" field="creditsUsed" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Period ends" field="periodEnd" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Created" field="createdAt" sort={sort} order={order} onSort={onSort} />
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-600 text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-600 text-sm">
                  No API keys match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              data?.rows.map(k => (
                <RowWithEditing
                  key={k.id}
                  row={k}
                  editing={editingId === k.id}
                  busy={busyId === k.id}
                  onStartEdit={() => setEditingId(k.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={(limit, used) => adjustCredits(k.id, limit, used)}
                  onRevoke={() =>
                    runAction(
                      k.id,
                      'revoke',
                      `Revoke this key for ${k.userEmail ?? 'this user'}? It will stop working immediately.\n\nNote: this does NOT cancel their PayPal subscription — do that separately on PayPal's side if the customer shouldn't keep being billed.`
                    )
                  }
                  onReactivate={() => runAction(k.id, 'reactivate')}
                />
              ))}
          </tbody>
        </table>
      </div>

      {data && (
        <Pagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Row — separated out so the inline credit-edit form has its own local
// state without re-rendering the whole table on every keystroke.
// ─────────────────────────────────────────────────────────────────────────

function RowWithEditing({
  row,
  editing,
  busy,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRevoke,
  onReactivate,
}: {
  row: ApiKeyRow;
  editing: boolean;
  busy: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (creditLimit: number, creditsUsed: number) => void;
  onRevoke: () => void;
  onReactivate: () => void;
}) {
  const [limitInput, setLimitInput] = useState(String(row.creditLimit));
  const [usedInput, setUsedInput] = useState(String(row.creditsUsed));

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/[0.02] transition-colors align-top">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-gray-900 dark:text-gray-200">{row.userName ?? '—'}</div>
        <div className="text-xs text-gray-500">{row.userEmail ?? '—'}</div>
      </td>
      <td className="px-4 py-3 text-gray-400 font-mono text-xs whitespace-nowrap">{row.keyMasked}</td>
      <td className="px-4 py-3">
        <TierPill tier={row.tier} />
      </td>
      <td className="px-4 py-3">
        <StatusPill status={row.status} />
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={0}
              value={usedInput}
              onChange={e => setUsedInput(e.target.value)}
              className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-2 py-1 text-gray-900 dark:text-gray-200"
              aria-label="Credits used"
            />
            <span className="text-gray-500 text-xs">/</span>
            <input
              type="number"
              min={0}
              value={limitInput}
              onChange={e => setLimitInput(e.target.value)}
              className="w-20 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-xs px-2 py-1 text-gray-900 dark:text-gray-200"
              aria-label="Credit limit"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <div className="text-gray-900 dark:text-gray-200 text-xs tabular-nums">
              {row.creditsUsed.toLocaleString()} / {row.creditLimit.toLocaleString()}
            </div>
            <CreditBar used={row.creditsUsed} limit={row.creditLimit} />
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{shortDate(row.periodEnd)}</td>
      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{shortDate(row.createdAt)}</td>
      <td className="px-4 py-3 whitespace-nowrap">
        {editing ? (
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={() => onSaveEdit(Number(limitInput) || 0, Number(usedInput) || 0)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-brand-600 text-white hover:bg-brand-500 disabled:opacity-40 transition-colors">
              Save
            </button>
            <button
              disabled={busy}
              onClick={onCancelEdit}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              disabled={busy}
              onClick={onStartEdit}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-40 transition-colors">
              Edit credits
            </button>
            {row.status === 'cancelled' || row.status === 'suspended' ? (
              <button
                disabled={busy}
                onClick={onReactivate}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-green-600/10 text-green-400 hover:bg-green-600/20 disabled:opacity-40 transition-colors">
                {busy ? '…' : 'Reactivate'}
              </button>
            ) : (
              <button
                disabled={busy || row.status !== 'active'}
                onClick={onRevoke}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 disabled:opacity-40 transition-colors">
                {busy ? '…' : 'Revoke'}
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
