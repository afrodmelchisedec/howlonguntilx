// FILE: src/app/admin/SubscribersPanel.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

type Plan = 'FREE' | 'PRO';
type SubStatus = 'none' | 'pending' | 'trialing' | 'active' | 'cancelled' | 'suspended' | 'expired';
type PaymentType = 'SALE' | 'REFUND';

interface Stats {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  byStatus: Record<SubStatus, number>;
  earnings: { allTimeCents: number; thisMonthCents: number; thisYearCents: number };
  totalTransactions: number;
  totalRefunds: number;
}

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  plan: Plan;
  subscriptionStatus: SubStatus;
  planRenewsAt: string | null;
  trialEndsAt: string | null;
  paypalSubscriptionId: string | null;
  createdAt: string;
  lastSeen: string | null;
  lifetimeSpendCents: number;
}

interface TransactionRow {
  id: string;
  userEmail: string | null;
  userName: string | null;
  paypalTransactionId: string;
  paypalSubscriptionId: string | null;
  eventType: string;
  type: PaymentType;
  amountCents: number;
  currency: string;
  createdAt: string;
}

interface PagedResponse<T> {
  rows: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers
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

const STATUS_STYLES: Record<SubStatus, string> = {
  none: 'bg-gray-700/40 text-gray-400',
  pending: 'bg-amber-500/10 text-amber-400',
  trialing: 'bg-sky-500/10 text-sky-400',
  active: 'bg-green-500/10 text-green-400',
  cancelled: 'bg-red-500/10 text-red-400',
  suspended: 'bg-orange-500/10 text-orange-400',
  expired: 'bg-gray-600/20 text-gray-500',
};

function StatusPill({ status }: { status: SubStatus }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function PlanPill({ plan }: { plan: Plan }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        plan === 'PRO' ? 'bg-purple-500/15 text-purple-300' : 'bg-gray-700/40 text-gray-400'
      }`}>
      {plan}
    </span>
  );
}

function TypePill({ type }: { type: PaymentType }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        type === 'SALE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      }`}>
      {type === 'SALE' ? 'Payment' : 'Refund'}
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
// Main panel
// ─────────────────────────────────────────────────────────────────────────

export default function SubscribersPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/subscribers/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-medium text-gray-900 dark:text-white mb-1">Subscribers &amp; earnings</h1>
        <p className="text-sm text-gray-500">PayPal subscription status and revenue, updated live from webhook events.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total subscribers" value={statsLoading ? '—' : stats?.totalUsers ?? 0} />
        <StatCard label="Pro" value={statsLoading ? '—' : stats?.proUsers ?? 0} accent="text-purple-300" />
        <StatCard label="Free" value={statsLoading ? '—' : stats?.freeUsers ?? 0} accent="text-gray-600 dark:text-gray-300" />
        <StatCard label="Trialing" value={statsLoading ? '—' : stats?.byStatus.trialing ?? 0} accent="text-sky-400" />
        <StatCard label="Active" value={statsLoading ? '—' : stats?.byStatus.active ?? 0} accent="text-green-400" />
        <StatCard label="Cancelled" value={statsLoading ? '—' : stats?.byStatus.cancelled ?? 0} accent="text-red-400" />
        <StatCard label="Suspended" value={statsLoading ? '—' : stats?.byStatus.suspended ?? 0} accent="text-orange-400" />
        <StatCard label="Expired" value={statsLoading ? '—' : stats?.byStatus.expired ?? 0} accent="text-gray-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Earnings — all time"
          value={statsLoading ? '—' : money(stats?.earnings.allTimeCents ?? 0)}
          accent="text-green-400"
        />
        <StatCard
          label="Earnings — this year"
          value={statsLoading ? '—' : money(stats?.earnings.thisYearCents ?? 0)}
          accent="text-green-400"
        />
        <StatCard
          label="Earnings — this month"
          value={statsLoading ? '—' : money(stats?.earnings.thisMonthCents ?? 0)}
          accent="text-green-400"
        />
      </div>

      <SubscribersTable />
      <TransactionsTable />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Subscribers table
// ─────────────────────────────────────────────────────────────────────────

function SubscribersTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [plan, setPlan] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);

  const [data, setData] = useState<PagedResponse<UserRow> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [plan, status, debouncedSearch, pageSize]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
    });
    if (plan) params.set('plan', plan);
    if (status) params.set('status', status);
    if (debouncedSearch) params.set('q', debouncedSearch);

    fetch(`/api/admin/subscribers/users?${params.toString()}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, pageSize, sort, order, plan, status, debouncedSearch]);

  function onSort(field: string) {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setOrder('desc');
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mr-auto">Subscribers</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, subscription id…"
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 w-64 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={plan}
          onChange={e => setPlan(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          <option value="">All plans</option>
          <option value="PRO">Pro</option>
          <option value="FREE">Free</option>
        </select>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          <option value="">All statuses</option>
          {(['none', 'pending', 'trialing', 'active', 'cancelled', 'suspended', 'expired'] as SubStatus[]).map(s => (
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
              <SortableTh label="Name" field="name" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Email" field="email" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Plan" field="plan" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Status" field="subscriptionStatus" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Renews / trial ends" field="planRenewsAt" sort={sort} order={order} onSort={onSort} />
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Lifetime spend</th>
              <SortableTh label="Joined" field="createdAt" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Last seen" field="lastSeen" sort={sort} order={order} onSort={onSort} />
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
                  No subscribers match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              data?.rows.map(u => (
                <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200 whitespace-nowrap">{u.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{u.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <PlanPill plan={u.plan} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={u.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {shortDate(u.subscriptionStatus === 'trialing' ? u.trialEndsAt : u.planRenewsAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200 font-medium whitespace-nowrap">
                    {money(u.lifetimeSpendCents)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{shortDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{shortDate(u.lastSeen)}</td>
                </tr>
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
// Transactions table
// ─────────────────────────────────────────────────────────────────────────

function TransactionsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounced(search);

  const [data, setData] = useState<PagedResponse<TransactionRow> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => setPage(1), [type, debouncedSearch, pageSize]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      sort,
      order,
    });
    if (type) params.set('type', type);
    if (debouncedSearch) params.set('q', debouncedSearch);

    fetch(`/api/admin/subscribers/transactions?${params.toString()}`)
      .then(res => res.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, pageSize, sort, order, type, debouncedSearch]);

  function onSort(field: string) {
    if (sort === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(field);
      setOrder('desc');
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mr-auto">Transactions</h2>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search email, transaction id…"
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-3 py-1.5 text-gray-900 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-600 w-64 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm px-2 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-500">
          <option value="">All types</option>
          <option value="SALE">Payments</option>
          <option value="REFUND">Refunds</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800">
              <SortableTh label="Date" field="createdAt" sort={sort} order={order} onSort={onSort} />
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">User</th>
              <SortableTh label="Type" field="type" sort={sort} order={order} onSort={onSort} />
              <SortableTh label="Amount" field="amountCents" sort={sort} order={order} onSort={onSort} />
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Event</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && data?.rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600 text-sm">
                  No transactions match these filters.
                </td>
              </tr>
            )}
            {!loading &&
              data?.rows.map(t => (
                <tr key={t.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{shortDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-200 whitespace-nowrap">
                    {t.userName ?? t.userEmail ?? '—'}
                    {t.userName && t.userEmail && (
                      <span className="text-gray-600 text-xs block">{t.userEmail}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TypePill type={t.type} />
                  </td>
                  <td
                    className={`px-4 py-3 font-medium whitespace-nowrap ${
                      t.type === 'SALE' ? 'text-green-400' : 'text-red-400'
                    }`}>
                    {t.type === 'SALE' ? '+' : '−'}
                    {money(t.amountCents, t.currency)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap font-mono">{t.eventType}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap font-mono">
                    {t.paypalTransactionId}
                  </td>
                </tr>
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
