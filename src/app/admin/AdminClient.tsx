'use client';
import { useState } from 'react';

interface User {
  id: string; name: string | null; email: string | null;
  emailVerified: Date | null; plan: string; role: string;
  createdAt: Date; lastSeen: Date | null;
  _count: { timers: number; sessions: number };
}
interface EventRow { id: string; slug: string; name: string; category: string; views: number; targetDate: Date }
interface Stats {
  totalUsers: number; verifiedUsers: number; unverifiedUsers: number;
  proUsers: number; freeUsers: number; totalTimers: number; totalEvents: number; totalViews: number;
}
type Tab = 'overview' | 'users' | 'events';

const STAT_COLORS: Record<string, string> = {
  totalUsers: '#534AB7', verifiedUsers: '#1D9E75', unverifiedUsers: '#D85A30',
  proUsers: '#BA7517', freeUsers: '#378ADD', totalTimers: '#D4537E',
  totalEvents: '#639922', totalViews: '#534AB7',
};

export function AdminClient({ users, events, stats }: { users: User[]; events: EventRow[]; stats: Stats }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || (u.email ?? '').toLowerCase().includes(s) || (u.name ?? '').toLowerCase().includes(s);
    const matchPlan = planFilter === 'all' || u.plan === planFilter.toUpperCase();
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'verified' && u.emailVerified)
      || (statusFilter === 'unverified' && !u.emailVerified);
    return matchSearch && matchPlan && matchStatus;
  });

  async function updatePlan(userId: string, plan: string) {
    await fetch('/api/admin/users/' + userId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    window.location.reload();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm('Delete user ' + email + '? Cannot be undone.')) return;
    await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
    window.location.reload();
  }

  const maxViews = Math.max(...events.map(e => e.views), 1);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
        <div className="mb-4 px-2 pt-1">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Admin Panel</p>
          <p className="text-xs text-gray-400 mt-0.5">{stats.totalUsers} users</p>
        </div>
        {(['overview','users','events'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-0.5 capitalize transition-colors ' + (
              tab === t ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            {t === 'overview' ? '📊' : t === 'users' ? '👥' : '📅'} {t}
          </button>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <a href="/dashboard" className="block text-xs text-gray-400 hover:text-brand-500 px-2 py-1">← Dashboard</a>
          <a href="/" className="block text-xs text-gray-400 hover:text-brand-500 px-2 py-1">← Home</a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950 overflow-auto">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <h1 className="text-xl font-medium mb-6">Platform overview</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {(Object.entries(stats) as [string, number][]).map(([key, val]) => (
                <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
                    {key.replace(/([A-Z])/g,' $1').toLowerCase()}
                  </p>
                  <p className="text-2xl font-medium" style={{ color: STAT_COLORS[key] ?? '#534AB7' }}>
                    {val.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-medium mb-4">Recent signups ({users.length} total)</h2>
              <div className="space-y-0">
                {users.slice(0,10).map((u, i) => (
                  <div key={u.id} className={'flex items-center justify-between py-2.5 ' + (i < 9 ? 'border-b border-gray-100 dark:border-gray-800' : '')}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-medium text-brand-500">
                        {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name ?? 'No name'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (u.emailVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                        {u.emailVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (u.plan === 'PRO' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                        {u.plan}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-medium">All users ({filtered.length} shown)</h1>
            </div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 min-w-48 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500" />
              <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none">
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro / Paid</option>
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none">
                <option value="all">All status</option>
                <option value="verified">Verified (clicked link)</option>
                <option value="unverified">Pending (link not clicked)</option>
              </select>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {['User','Status','Plan','Timers','Joined','Last seen','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id} className={'border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ' + (u.role === 'ADMIN' ? 'bg-amber-50/30 dark:bg-amber-900/10' : '')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-medium text-brand-500 flex-shrink-0">
                              {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{u.name ?? '—'}</p>
                              <p className="text-gray-400 text-xs truncate max-w-32">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={'text-xs px-2 py-0.5 rounded-full font-medium w-fit ' + (u.emailVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                              {u.emailVerified ? '✓ Active' : '⏳ Pending'}
                            </span>
                            {u.role === 'ADMIN' && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold w-fit">ADMIN</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'ADMIN' ? (
                            <span className="text-xs text-amber-600 font-medium">PRO (Admin)</span>
                          ) : (
                            <select value={u.plan} onChange={e => updatePlan(u.id, e.target.value)}
                              className={'text-xs px-2 py-1 rounded-lg border font-medium cursor-pointer focus:outline-none ' + (u.plan === 'PRO' ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-500')}>
                              <option value="FREE">FREE</option>
                              <option value="PRO">PRO</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs text-center">{u._count.timers}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{u.lastSeen ? new Date(u.lastSeen).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => deleteUser(u.id, u.email ?? '')}
                              className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-12">No users match your filters</p>}
              </div>
            </div>
          </div>
        )}

        {/* EVENTS */}
        {tab === 'events' && (
          <div>
            <h1 className="text-xl font-medium mb-5">Top event pages by views</h1>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {['#','Event','Category','Target date','Views'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map((ev, i) => (
                    <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-gray-400 text-xs font-medium w-8">{i + 1}</td>
                      <td className="px-4 py-3">
                        <a href={'/how-long-until-' + ev.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{ev.name}</a>
                        <p className="text-xs text-gray-400 mt-0.5">/how-long-until-{ev.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 capitalize text-gray-600 dark:text-gray-300">{ev.category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(ev.targetDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: Math.min(100, (ev.views / maxViews) * 100) + '%' }} />
                          </div>
                          <span className="text-xs font-medium text-brand-500">{ev.views.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
