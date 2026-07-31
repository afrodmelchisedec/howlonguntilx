// FILE: src/components/docs/TrySearch.tsx
'use client';

import { useState } from 'react';

type SearchResult = { slug: string; name: string; category: string; type: 'event' | 'article'; href: string };

export function TrySearch() {
  const [q, setQ] = useState('christmas');
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    if (q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ios-card p-5">
      <p className="text-caption font-semibold mb-3" style={{ color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Try it live
      </p>
      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && run()}
          placeholder="Search events or articles..."
          className="flex-1 px-3 py-2.5 rounded-lg text-callout"
          style={{ background: 'var(--bg-secondary, #1c1c1e)', border: '1px solid var(--border, #333)' }}
        />
        <button
          onClick={run}
          disabled={loading}
          className="px-4 py-2.5 rounded-lg text-callout font-bold"
          style={{ background: 'rgb(255, 159, 10)', color: '#1a1a1a', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {results && results.length === 0 && (
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No results for "{q}".</p>
      )}

      {results && results.length > 0 && (
        <div className="space-y-2">
          {results.map(r => (
            <div key={`${r.type}-${r.slug}`} className="ios-card-nested px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-callout font-semibold">{r.name}</p>
                <p className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{r.type} · {r.category}</p>
              </div>
              <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{r.href}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
