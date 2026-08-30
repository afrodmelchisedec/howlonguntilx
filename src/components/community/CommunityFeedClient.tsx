// FILE: src/components/community/CommunityFeedClient.tsx
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CommunityFeedCard, type FeedItem } from '@/components/community/CommunityFeedCard';
import { SignUpModal } from '@/components/community/SignUpModal';

type SortOption = 'anticipated' | 'engagement' | 'recent';
interface CategoryPill { slug: string; name: string; emoji: string }

const SORT_TABS: { value: SortOption; label: string }[] = [
  { value: 'anticipated', label: 'Most anticipated' },
  { value: 'engagement', label: 'Most engagement' },
  { value: 'recent', label: 'Most recent' },
];

const INITIAL_TAKE = 8;  // first page: 4 rows of 2
const MORE_TAKE = 4;     // each "Load more": 2 additional rows of 2

interface Props {
  initialItems: FeedItem[];
  initialCursor: string | null;
  initialCategories: CategoryPill[];
}

export function CommunityFeedClient({ initialItems, initialCursor, initialCategories }: Props) {
  const { status } = useSession();
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [sort, setSort] = useState<SortOption>('recent');
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [categories] = useState<CategoryPill[]>(initialCategories);
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  // The server already rendered the default (sort=recent, no filters) page,
  // so there's real content on first paint — no skeleton needed yet.
  const [initialLoading, setInitialLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Skips the reset-and-refetch effect on the very first render, since that
  // render's data is already the server-provided default-state page — only
  // an actual sort/category/query change after mount should trigger a fetch.
  const isFirstRender = useRef(true);

  const loadPage = useCallback(async (reset: boolean, cursorOverride?: string | null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, take: String(reset ? INITIAL_TAKE : MORE_TAKE) });
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
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-largetitle mb-2">Community countdowns</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Browse "How long until…?" countdowns shared by the community.
          </p>
        </div>
        {status === 'authenticated' ? (
          <Link
            href="/dashboard/events/new"
            className="btn-gradient-glow press px-4 py-2.5 rounded-lg text-footnote font-semibold flex-shrink-0"
          >
            + Create Event
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setShowSignupModal(true)}
            className="btn-gradient-glow press px-4 py-2.5 rounded-lg text-footnote font-semibold flex-shrink-0"
          >
            + Create Event
          </button>
        )}
      </div>

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
        placeholder="Search community countdowns…"
        className="ios-card-nested w-full px-4 py-2.5 mb-8 text-footnote bg-transparent outline-none"
        style={{ color: 'var(--text-primary)' }}
      />

      {initialLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ios-card overflow-hidden flex flex-col">
              <div className="flex items-center" style={{ height: 128 }}>
                <div className="shimmer flex-shrink-0 self-stretch my-2 ml-2 rounded-xl" style={{ width: 112 }} />
                <div className="p-3 flex-1 flex flex-col justify-center gap-2">
                  <div className="shimmer" style={{ height: 9, width: '35%', borderRadius: 4 }} />
                  <div className="shimmer" style={{ height: 14, width: '80%', borderRadius: 4 }} />
                  <div className="shimmer" style={{ height: 11, width: '90%', borderRadius: 4 }} />
                  <div className="shimmer" style={{ height: 10, width: '50%', borderRadius: 4 }} />
                </div>
              </div>
              <div className="flex items-center justify-between px-3 pb-2.5 pt-1.5 ml-1" style={{ borderTop: '1px solid var(--border-hairline)' }}>
                <div className="shimmer" style={{ height: 9, width: '30%', borderRadius: 4 }} />
                <div className="shimmer" style={{ height: 9, width: '35%', borderRadius: 4 }} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, i) => <CommunityFeedCard key={item.id} item={item} index={i % 12} priority={i < 3} />)}
        </div>
      )}

      <div ref={sentinelRef} />

      <SignUpModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        callbackUrl="/dashboard/events/new"
      />

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