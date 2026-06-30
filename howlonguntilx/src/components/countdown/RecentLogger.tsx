
'use client';
import { useEffect } from 'react';

interface Props { slug: string; name: string }

export function RecentLogger({ slug, name }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem('hlu_recent');
      const items: { slug: string; name: string }[] = raw ? JSON.parse(raw) : [];
      const filtered = items.filter(i => i.slug !== slug);
      filtered.unshift({ slug, name });
      localStorage.setItem('hlu_recent', JSON.stringify(filtered.slice(0, 10)));
    } catch {}
  }, [slug, name]);
  return null;
}
