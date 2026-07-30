// FILE: src/components/admin/LeadMagnetManager.tsx
'use client';

import { useEffect, useState } from 'react';

type Config = {
  headline: string;
  description: string;
  ctaLabel: string;
  fileUrl: string;
  active: boolean;
};

const EMPTY: Config = {
  headline: '',
  description: '',
  ctaLabel: 'Send me the calendar',
  fileUrl: '',
  active: false,
};

export function LeadMagnetManager() {
  const [config, setConfig] = useState<Config>(EMPTY);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/lead-magnet')
      .then(r => r.json())
      .then(data => {
        setConfig(data.config);
        setSubscriberCount(data.subscriberCount || 0);
      })
      .catch(() => setError('Could not load current settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError('');

    if (!config.fileUrl.trim()) {
      setError('File URL is required — paste a real link to the PDF/ICS before saving (the placeholder text alone won\'t count).');
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

  if (loading) {
    return <p className="text-sm text-gray-400">Loading…</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Lead magnet</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Sitewide banner shown to every visitor until they sign up or dismiss it. {subscriberCount} subscriber{subscriberCount === 1 ? '' : 's'} so far.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 max-w-2xl">
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
    </div>
  );
}
