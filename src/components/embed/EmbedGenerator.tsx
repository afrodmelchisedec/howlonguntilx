'use client';
import { useEffect, useRef, useState } from 'react';

interface SearchResult { slug: string; name: string; category: string; type: 'event' | 'article'; href: string }

export function EmbedGenerator() {
  const [event, setEvent] = useState('christmas');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live typeahead against the same /api/search endpoint documented on
  // the API page — surfaces real, valid event slugs as you type instead
  // of making people guess (which is how "easter-2027" silently failed
  // if that exact slug doesn't exist in the database).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (event.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(event)}`);
        const data: SearchResult[] = await res.json();
        setSuggestions(data.filter(r => r.type === 'event'));
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [event]);

  function selectEvent(r: SearchResult) {
    setEvent(r.slug);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  const base = process.env.NEXT_PUBLIC_URL ?? 'https://howlonguntilx.com';
  const code = `<iframe src="${base}/embed/widget?event=${event}&theme=${theme}" width="300" height="160" frameborder="0" loading="lazy"></iframe>`;

  return (
    <div className="space-y-4">
      <div style={{ position: 'relative' }}>
        <label className="text-footnote block mb-1.5">Event</label>
        <input
          className="input-glow w-full px-3 py-2"
          value={event}
          onChange={e => { setEvent(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search events, e.g. christmas, easter..."
          autoComplete="off"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="ios-card p-1 mt-1"
            style={{ position: 'absolute', zIndex: 20, width: '100%', maxHeight: 220, overflowY: 'auto' }}
          >
            {suggestions.map(r => (
              <button
                key={r.slug}
                onMouseDown={() => selectEvent(r)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>{r.name}</span>
                <span className="text-caption" style={{ color: 'var(--text-tertiary)' }}>{r.category}</span>
              </button>
            ))}
          </div>
        )}
        {showSuggestions && event.trim().length >= 2 && suggestions.length === 0 && (
          <div
            className="ios-card px-3 py-2.5 mt-1 text-caption"
            style={{ position: 'absolute', zIndex: 20, width: '100%', color: 'var(--text-tertiary)' }}
          >
            No tracked events match "{event}" — you can still type a free-text date (e.g. 2027-06-01).
          </div>
        )}
      </div>

      <div>
        <label className="text-footnote block mb-1.5">Theme</label>
        <div className="segmented w-fit">
          {(['light', 'dark'] as const).map(opt => (
            <button key={opt} onClick={() => setTheme(opt)}
              className={`segmented-item ${theme === opt ? 'active' : ''}`}>
              {opt === 'light' ? '☀️ Light' : '🌙 Dark'}
            </button>
          ))}
        </div>
      </div>
      <div className="ios-card p-4">
        <p className="text-caption mb-3">Preview</p>
        <iframe src={`/embed/widget?event=${event}&theme=${theme}`} width={300} height={160}
          style={{ border: '1px solid var(--border-hairline)', borderRadius: 14 }} />
      </div>
      <div>
        <p className="text-caption mb-2">Embed code</p>
        <pre className="ios-card-nested text-xs p-3 overflow-x-auto whitespace-pre-wrap break-all" style={{ color: 'var(--text-secondary)' }}>{code}</pre>
        <button onClick={() => navigator.clipboard.writeText(code)} className="btn-tinted mt-2 text-sm">
          Copy code
        </button>
      </div>
    </div>
  );
}