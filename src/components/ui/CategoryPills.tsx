'use client';
import Link from 'next/link';

type PillCategory = {
  slug: string;
  label: string;
  emoji: string;
  color: string;
};

export function CategoryPills({ categories }: { categories: PillCategory[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      {categories.map(c => (
        <Link key={c.slug} href={`/categories/${c.slug}`}
          className="press flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: `rgba(${c.color}, 0.1)`,
            color: `rgb(${c.color})`,
            border: `1px solid rgba(${c.color}, 0.25)`,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = `rgba(${c.color}, 0.2)`;
            (e.currentTarget as HTMLElement).style.borderColor = `rgba(${c.color}, 0.5)`;
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = `rgba(${c.color}, 0.1)`;
            (e.currentTarget as HTMLElement).style.borderColor = `rgba(${c.color}, 0.25)`;
          }}>
          <span>{c.emoji}</span>
          <span>{c.label}</span>
        </Link>
      ))}
    </div>
  );
}
