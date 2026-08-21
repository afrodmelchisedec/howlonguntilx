// FILE: src/app/community/page.tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CommunityFeedCard, type FeedItem } from '@/components/community/CommunityFeedCard';

type SortOption = 'anticipated' | 'engagement' | 'recent';
interface CategoryPill { slug: string; name: string; emoji: string }

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: 'anticipated', label: 'Most anticipated' },
  { value: 'engagement', label: 'Most engagement' },
  { value: 'recent', label: 'Most recent' },
];

export default function CommunityFeedPage() {
  const [sort, setSort] = useState<SortOption>('recent');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState<CategoryPill[]>([]);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/user-events/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  const loadPage = useCallback(async (reset: boolean, cursorOverride?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (category) params.set('category', category);
      if (query.trim().length >= 2) params.set('q', query.trim());
      const useCursor = reset ? null : (cursorOverride ?? cursor);
      if (useCursor) params.set('cursor', useCursor);

      const res = await fetch(`/api/user-events/feed?${params}`);
      const data = await res.json();
      setItems(prev => (reset ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category, query]);

  // Reset + reload whenever sort/category/query changes
  useEffect(() => {
    setInitialLoading(true);
    loadPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category, query]);

  // Infinite scroll via IntersectionObserver on a sentinel div
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && cursor && !loading) {
        loadPage(false);
      }
    }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, loading, loadPage]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-largetitle mb-2">Community countdowns</h1>
      <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
        Browse "How long until…?" countdowns shared by the community.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {SORT_TABS.map(tab => (
          <button key={tab.value} type="button"
            onClick={() => setSort(tab.value)}
            className="pill press text-xs"
            style={{
              background: sort === tab.value ? 'var(--accent-brand)' : 'var(--fill-secondary)',
              color: sort === tab.value ? 'white' : 'var(--text-secondary)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button type="button" onClick={() => setCategory(null)}
          className="category-pill" data-active={category === null}>All</button>
        {categories.map(cat => (
          <button key={cat.slug} type="button"
            onClick={() => setCategory(prev => (prev === cat.slug ? null : cat.slug))}
            className="category-pill" data-active={category === cat.slug}>
            {cat.emoji} {cat.name}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search community countdowns…"
        className="ios-card-nested w-full px-4 py-2.5 mb-8 text-footnote bg-transparent outline-none"
        style={{ color: 'var(--text-primary)' }}
      />

      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ios-card overflow-hidden">
              <div className="shimmer w-full" style={{ aspectRatio: '16/9' }} />
              <div className="p-4">
                <div className="shimmer" style={{ height: 10, width: '40%', borderRadius: 4, marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 14, width: '85%', borderRadius: 4, marginBottom: 6 }} />
                <div className="shimmer" style={{ height: 12, width: '95%', borderRadius: 4, marginBottom: 12 }} />
                <div className="shimmer" style={{ height: 24, width: '30%', borderRadius: 4, marginBottom: 8 }} />
                <div className="shimmer" style={{ height: 4, width: '100%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="ios-card p-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
          <div className="text-4xl mb-3">⏳</div>
          <div className="text-headline mb-1">No events found</div>
          <div className="text-footnote">Try a different search or category.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, i) => <CommunityFeedCard key={item.id} item={item} index={i % 12} priority={i < 3} />)}
        </div>
      )}

      <div ref={sentinelRef} />

      {cursor && !initialLoading && (
        <div className="flex justify-center mt-6">
          <button type="button" onClick={() => loadPage(false)} disabled={loading}
            className="ios-card-nested press px-5 py-2.5 text-footnote font-semibold disabled:opacity-50">
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}
