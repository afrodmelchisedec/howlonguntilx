'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion { slug: string; name: string; category: string; type: 'event' | 'article' | 'userEvent'; href: string }

export function SearchBar() {
  const [value, setValue]     = useState('');
  const [sugs, setSugs]       = useState<Suggestion[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) { setSugs([]); setLoading(false); setSearched(false); return; }
    setLoading(true);
    setSearched(false);
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(value.trim()));
        const data = await res.json();
        setSugs(data);
        setOpen(true);
      } catch {
        setSugs([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    if (sugs.length > 0) { pick(sugs[0]); return; }
    setOpen(false);
    router.push('/questions/how-long-until-' + value.trim().toLowerCase().replace(/\s+/g, '-'));
  }
  function pick(s: Suggestion) { setOpen(false); router.push(s.href); }

  const showNoResults = searched && !loading && sugs.length === 0 && value.trim().length >= 2;

  return (
    <div ref={ref} className="relative max-w-md mx-auto" style={{ zIndex: 200, position: 'relative' }}>
      <form onSubmit={submit}
        className="flex gap-2 rounded-[20px] p-1.5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-card)' }}>
        <input
          className="flex-1 bg-transparent px-3 py-2 text-base focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
          placeholder="Christmas, World Cup, Solar Eclipse…"
          value={value}
          onChange={e => { setValue(e.target.value); setOpen(true); }}
          onFocus={() => (sugs.length || showNoResults) && setOpen(true)}
          autoComplete="off"
        />
        <button type="submit" className="btn-filled press text-sm">
          Go
        </button>
      </form>
      {open && (loading || sugs.length > 0 || showNoResults) && (
        <div className="ios-card anim-scale-in absolute top-full left-0 right-0 mt-2 overflow-hidden" style={{ zIndex: 200 }}>
          {loading && sugs.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>Searching…</div>
          )}
          {showNoResults && (
            <div className="px-4 py-4 text-center">
              <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                No results for "{value.trim()}"
              </div>
              <div className="text-footnote" style={{ color: 'var(--text-tertiary)' }}>
                Try a different spelling, or hit Go to create a countdown for it.
              </div>
            </div>
          )}
          {sugs.map(s => (
            <button key={s.type + s.slug} onClick={() => pick(s)}
              className="sidebar-item w-full text-left px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 min-w-0">
                {s.type === 'userEvent' && (
                  <span className="inline-flex items-center gap-1 text-caption flex-shrink-0" style={{ color: 'rgb(var(--accent-green))' }}>
                    <span
                      className="pulse-dot"
                      style={{ '--glow': 'var(--accent-green)', width: 6, height: 6, background: 'rgb(var(--accent-green))', flexShrink: 0 } as any}
                    />
                    Community
                  </span>
                )}
                <span className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
              </span>
              <span className="pill capitalize flex-shrink-0" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
