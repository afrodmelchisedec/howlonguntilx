// FILE: src/components/admin/AffiliateBannersManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { useToast, ToastHost } from '@/components/ui/Toast';

interface Banner {
  categorySlug: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
  active: boolean;
}
interface CategoryRow { id: string; slug: string; name: string; emoji: string }

const EMPTY_BANNER: Omit<Banner, 'categorySlug'> = {
  title: '', description: '', ctaLabel: 'Learn more', href: '', imageUrl: null, active: true,
};

export function AffiliateBannersManager() {
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [banners, setBanners] = useState<Record<string, Banner>>({});
  const [drafts, setDrafts] = useState<Record<string, Omit<Banner, 'categorySlug'>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [catRes, bannerRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/affiliate-banners'),
      ]);
      const catData = await catRes.json().catch(() => null);
      const bannerData = await bannerRes.json().catch(() => null);
      if (!catRes.ok || !bannerRes.ok) {
        setError(catData?.error ?? bannerData?.error ?? 'Failed to load');
        return;
      }
      // Synthetic row for the /tools page banner — it's not a real Category,
      // but reuses the same AffiliateBanner system keyed by the reserved slug "tools".
      const toolsPageRow: CategoryRow = { id: '__tools-page__', slug: 'tools', name: 'Tools page', emoji: '🧰' };
      const topLevel: CategoryRow[] = [...(catData.categories ?? []), toolsPageRow];
      setCategories(topLevel);

      const byCat: Record<string, Banner> = {};
      for (const b of bannerData.banners ?? []) byCat[b.categorySlug] = b;
      setBanners(byCat);

      const nextDrafts: Record<string, Omit<Banner, 'categorySlug'>> = {};
      for (const c of topLevel) {
        const existing = byCat[c.slug];
        nextDrafts[c.slug] = existing
          ? { title: existing.title, description: existing.description, ctaLabel: existing.ctaLabel, href: existing.href, imageUrl: existing.imageUrl, active: existing.active }
          : { ...EMPTY_BANNER };
      }
      setDrafts(nextDrafts);
    } catch (e) {
      setError(e instanceof Error ? `Network error: ${e.message}` : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function updateDraft(slug: string, field: keyof Omit<Banner, 'categorySlug'>, value: string | boolean) {
    setDrafts(d => ({ ...d, [slug]: { ...d[slug], [field]: value } }));
  }

  async function saveBanner(slug: string) {
    const draft = drafts[slug];
    if (!draft.title.trim() || !draft.description.trim() || !draft.href.trim()) {
      showToast('Title, description, and link are required', '⚠️');
      return;
    }
    setSavingSlug(slug);
    try {
      const res = await fetch(`/api/admin/affiliate-banners/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast('Banner saved', '💾');
        setBanners(b => ({ ...b, [slug]: data }));
      } else {
        showToast(data.error ?? 'Could not save banner', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingSlug(null);
    }
  }

  async function removeBanner(slug: string) {
    setSavingSlug(slug);
    try {
      const res = await fetch(`/api/admin/affiliate-banners/${slug}`, { method: 'DELETE' });
      if (res.ok || res.status === 404) {
        showToast('Banner removed', '🗑️');
        setBanners(b => { const next = { ...b }; delete next[slug]; return next; });
        setDrafts(d => ({ ...d, [slug]: { ...EMPTY_BANNER } }));
      } else {
        showToast('Could not remove banner', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingSlug(null);
    }
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Loading affiliate banners…</div>;
  if (error || !categories) {
    return (
      <div className="text-sm text-center py-8">
        <p className="text-red-500 mb-2">⚠️ {error ?? 'Could not load'}</p>
        <button onClick={load} className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div>
      <ToastHost toast={toast} />
      <h1 className="text-xl font-medium mb-2">Affiliate banners ({categories.length} categories)</h1>
      <p className="text-xs text-gray-400 mb-5">
        One banner per top-level category. Shown on Article and Event detail pages, right before the FAQ section, themed in that category's color.
      </p>

      <div className="space-y-4">
        {categories.map(cat => {
          const draft = drafts[cat.slug] ?? EMPTY_BANNER;
          const hasSaved = !!banners[cat.slug];
          return (
            <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <p className="text-sm font-medium">{cat.name}</p>
                  {hasSaved && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${draft.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                      {draft.active ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                  <input type="checkbox" checked={draft.active} onChange={e => updateDraft(cat.slug, 'active', e.target.checked)} />
                  Active
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  value={draft.title}
                  onChange={e => updateDraft(cat.slug, 'title', e.target.value)}
                  placeholder="Banner title"
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none"
                />
                <input
                  value={draft.ctaLabel}
                  onChange={e => updateDraft(cat.slug, 'ctaLabel', e.target.value)}
                  placeholder="CTA label (e.g. Shop now)"
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none"
                />
              </div>
              <textarea
                value={draft.description}
                onChange={e => updateDraft(cat.slug, 'description', e.target.value)}
                placeholder="Short description"
                rows={2}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <input
                  value={draft.href}
                  onChange={e => updateDraft(cat.slug, 'href', e.target.value)}
                  placeholder="https://affiliate-link.com/..."
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none"
                />
                <input
                  value={draft.imageUrl ?? ''}
                  onChange={e => updateDraft(cat.slug, 'imageUrl', e.target.value)}
                  placeholder="Image URL (optional)"
                  className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => saveBanner(cat.slug)}
                  disabled={savingSlug === cat.slug}
                  className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
                  {savingSlug === cat.slug ? 'Saving…' : 'Save banner'}
                </button>
                {hasSaved && (
                  <button
                    onClick={() => removeBanner(cat.slug)}
                    disabled={savingSlug === cat.slug}
                    className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                    Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
