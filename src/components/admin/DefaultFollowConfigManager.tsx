'use client';

import { useEffect, useState } from 'react';

type UserLite = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type Config = {
  id: string;
  userId: string;
  setById: string | null;
  createdAt: string;
  user: UserLite;
  setBy: UserLite | null;
};

export function DefaultFollowConfigManager() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changing, setChanging] = useState(false);

  const [search, setSearch] = useState('');
  const [candidates, setCandidates] = useState<UserLite[]>([]);
  const [searching, setSearching] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/default-follow');
      const data = await res.json();
      setConfig(data.config);
    } catch {
      setError('Could not load default-follow settings.');
    } finally {
      setLoading(false);
    }
  }

  const pickerOpen = !config || changing;

  useEffect(() => {
    if (!pickerOpen) return;
    const q = search.trim();
    if (q.length < 2) {
      setCandidates([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/admin/default-follow?q=' + encodeURIComponent(q));
        const data = await res.json();
        setCandidates(data.candidates || []);
      } catch {
        // silent — search is best-effort
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, pickerOpen]);

  async function setDefault(userId: string) {
    const isChange = !!config;
    if (!confirm(isChange
      ? 'Change the default-follow account to this user? New signups will start following them instead.'
      : 'Set this as the permanent default-follow account? This cannot be changed later without using the testing override.')) return;
    setSettingId(userId);
    setError('');
    try {
      const res = await fetch('/api/admin/default-follow', {
        method: isChange ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not set default-follow account.');
        return;
      }
      setConfig(data);
      setChanging(false);
      setSearch('');
      setCandidates([]);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSettingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Default follow account</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Every new user auto-follows this account on signup.
        </p>
      </div>

      {error && (
        <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 rounded-lg px-3 py-2 max-w-xl">
          {error}
        </p>
      )}

      {config && !changing && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-xl mb-4">
          <div className="flex items-center gap-3 mb-3">
            {config.user.image ? (
              <img src={config.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium">
                {(config.user.name || config.user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{config.user.name ?? 'Unnamed'}</p>
              <p className="text-xs text-gray-400">{config.user.email}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            Set {new Date(config.createdAt).toLocaleDateString()}
            {config.setBy ? ' by ' + (config.setBy.name ?? config.setBy.email ?? 'an admin') : ''}
          </p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Locked in for production use.
            </p>
            <button
              onClick={() => setChanging(true)}
              className="text-xs text-amber-600 hover:underline flex-shrink-0"
            >
              Change (testing only)
            </button>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="max-w-xl">
          {changing && (
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-amber-600 font-medium">Picking a new account will replace the current default.</p>
              <button onClick={() => { setChanging(false); setSearch(''); setCandidates([]); }} className="text-xs text-gray-400 hover:underline">
                Cancel
              </button>
            </div>
          )}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email to pick the account…"
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none text-sm mb-3"
          />

          {searching && <p className="text-xs text-gray-400 mb-2">Searching…</p>}

          {!searching && search.trim().length >= 2 && candidates.length === 0 && (
            <p className="text-xs text-gray-400 mb-2">No matching users.</p>
          )}

          {candidates.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {candidates.map(u => (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {u.image ? (
                      <img src={u.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name ?? 'Unnamed'}</p>
                      <p className="text-xs text-gray-400 truncate">{u.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDefault(u.id)}
                    disabled={settingId === u.id}
                    className="text-xs font-medium bg-brand-500 hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  >
                    {settingId === u.id ? 'Setting…' : 'Set as default'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
