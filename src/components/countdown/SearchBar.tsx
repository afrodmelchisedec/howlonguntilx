'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion { slug: string; name: string; category: string; type: 'event' | 'article'; href: string }

export function SearchBar() {
  const [value, setValue]     = useState('');
  const [sugs, setSugs]       = useState<Suggestion[]>([]);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) { setSugs([]); setLoading(false); return; }
    setLoading(true);
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
    router.push('/how-long-until-' + value.trim().toLowerCase().replace(/\s+/g, '-'));
  }
  function pick(s: Suggestion) { setOpen(false); router.push(s.href); }

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
          onFocus={() => sugs.length && setOpen(true)}
          autoComplete="off"
        />
        <button type="submit" className="btn-filled press text-sm">
          Go
        </button>
      </form>
      {open && (loading || sugs.length > 0) && (
        <div className="ios-card anim-scale-in absolute top-full left-0 right-0 mt-2 overflow-hidden" style={{ zIndex: 200 }}>
          {loading && sugs.length === 0 && (
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--text-tertiary)' }}>Searching…</div>
          )}
          {sugs.map(s => (
            <button key={s.type + s.slug} onClick={() => pick(s)}
              className="sidebar-item w-full text-left px-4 py-3 flex items-center justify-between text-sm">
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.name}</span>
              <span className="pill capitalize" style={{ background: 'var(--bg-elevated-2)', color: 'var(--text-secondary)' }}>{s.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
