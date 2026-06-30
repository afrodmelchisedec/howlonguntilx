'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Item { slug: string; name: string; }

export function RecentlyViewed() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('hlu_recent');
      if (raw) setItems(JSON.parse(raw).slice(0, 5));
    } catch {}
  }, []);

  if (!items.length) return null;
  return (
    <div className="mt-4">
      <p className="text-caption mb-3">Recently viewed</p>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <Link key={item.slug} href={"/how-long-until-" + item.slug}
            className="press px-3 py-1.5 rounded-full text-sm transition-colors"
            style={{ border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(var(--accent-brand),0.5)'; e.currentTarget.style.color = 'rgb(var(--accent-brand))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-hairline)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
