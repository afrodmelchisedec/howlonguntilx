'use client';
import { useState, useEffect, useRef, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Suggestion { slug:string; name:string; category:string }

export function SearchBar() {
  const [value, setValue]     = useState('');
  const [sugs, setSugs]       = useState<Suggestion[]>([]);
  const [open, setOpen]       = useState(false);
  const router = useRouter();
  const ref    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.length < 2) { setSugs([]); return; }
    const t = setTimeout(async () => {
      const res  = await fetch('/api/search?q='+encodeURIComponent(value));
      setSugs(await res.json()); setOpen(true);
    }, 200);
    return () => clearTimeout(t);
  }, [value]);

  useEffect(() => {
    const h = (e:MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function submit(e:FormEvent) {
    e.preventDefault(); if (!value.trim()) return;
    setOpen(false); router.push('/how-long-until-'+value.trim().toLowerCase().replace(/\s+/g,'-'));
  }
  function pick(slug:string) { setOpen(false); router.push('/how-long-until-'+slug); }

  return (
    <div ref={ref} className="relative max-w-md mx-auto">
      <form onSubmit={submit}
        className="flex gap-2 rounded-[20px] p-1.5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-hairline)', boxShadow: 'var(--shadow-card)' }}>
        <input
          className="flex-1 bg-transparent px-3 py-2 text-base focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
          placeholder="Christmas, World Cup, Solar Eclipse…"
          value={value}
          onChange={e=>{setValue(e.target.value);setOpen(true);}}
          onFocus={()=>sugs.length&&setOpen(true)}
          autoComplete="off"
        />
        <button type="submit" className="btn-filled press text-sm">
          Go
        </button>
      </form>
      {open && sugs.length > 0 && (
        <div className="ios-card anim-scale-in absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden">
          {sugs.map(s=>(
            <button key={s.slug} onClick={()=>pick(s.slug)}
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
