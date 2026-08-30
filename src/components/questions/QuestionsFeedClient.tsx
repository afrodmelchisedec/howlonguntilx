// FILE: src/components/questions/QuestionsFeedClient.tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { QuestionCard } from '@/components/questions/QuestionCard';
import type { QuestionFeedItem, QuestionsSort } from '@/lib/questionsFeed';

interface CategoryPill { slug: string; name: string; emoji: string }

interface Props {
  initialItems: QuestionFeedItem[];
  initialCursor: string | null;
  initialCategories: CategoryPill[];
}

const SORT_TABS: { value: QuestionsSort; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'engagement', label: 'Most engaged' },
];

const INITIAL_TAKE = 8;  // first page: 4 rows of 2
const MORE_TAKE = 4;     // each "Load more": 2 additional rows of 2

// Client wrapper for the /questions listing. Mirrors CommunityFeedClient's
// tabs + search + IntersectionObserver load-more pattern. Category tabs
// were already Questions-specific (roadmap Phase F scope); sort and search
// now mirror Community more closely per user request, using 'engagement'
// = likeCount (the one engagement column both Article and Event actually
// share — see questionsFeed.ts for why this differs from Community's
// summed-likes+comments engagement sort).
export function QuestionsFeedClient({ initialItems, initialCursor, initialCategories }: Props) {
  const [sort, setSort] = useState<QuestionsSort>('recent');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categories] = useState<CategoryPill[]>(initialCategories);
  const [items, setItems] = useState<QuestionFeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const loadPage = useCallback(async (reset: boolean, cursorOverride?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, take: String(reset ? INITIAL_TAKE : MORE_TAKE) });
      if (category) params.set('category', category);
      if (query.trim().length >= 2) params.set('q', query.trim());
      const useCursor = reset ? null : (cursorOverride ?? cursor);
      if (useCursor) params.set('cursor', useCursor);

      const res = await fetch(`/api/questions/feed?${params}`);
      const data = await res.json();
      setItems(prev => (reset ? data.items : [...prev, ...data.items]));
      setCursor(data.nextCursor);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, category, query, cursor]);

  // Reset + reload whenever sort/category/query changes — but not on mount,
  // since the server already provided the matching default-state data.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
      <h1 className="text-largetitle mb-2">Questions</h1>
      <p className="text-callout mb-6" style={{ color: 'var(--text-secondary)' }}>
        Every "How long until…?" answer on the site, articles and live countdowns together.
      </p>

      <div className="flex gap-2 mb-4 flex-wrap">
        {SORT_TABS.map(tab => (
          <button key={tab.value} type="button"
            onClick={() => setSort(tab.value)}
            className="pill press text-xs"
            style={{
              background: sort === tab.value ? 'rgb(var(--btn-filled-bg))' : 'var(--fill-secondary)',
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
        placeholder="Search questions…"
        className="ios-card-nested w-full px-4 py-2.5 mb-8 text-footnote bg-transparent outline-none"
        style={{ color: 'var(--text-primary)' }}
      />

      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ios-card overflow-hidden flex items-center" style={{ height: 128 }}>
              <div className="shimmer flex-shrink-0 self-stretch my-2 ml-2 rounded-xl" style={{ width: 112 }} />
              <div className="p-3 flex-1 flex flex-col justify-center gap-2">
                <div className="shimmer" style={{ height: 9, width: '35%', borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 14, width: '80%', borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 11, width: '90%', borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 10, width: '50%', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="ios-card p-10 text-center" style={{ color: 'var(--text-tertiary)' }}>
          <div className="text-4xl mb-3">❓</div>
          <div className="text-headline mb-1">No questions found</div>
          <div className="text-footnote">Try a different search or category.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => <QuestionCard key={`${item.kind}-${item.id}`} item={item} index={i % 12} priority={i < 3} />)}
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