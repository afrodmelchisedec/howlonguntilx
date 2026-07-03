'use client';
import Link from 'next/link';

const CATEGORIES = [
  { slug: 'leisure',  label: 'Leisure',  emoji: '⚽', color: '48, 219, 91'   },
  { slug: 'food',     label: 'Food',     emoji: '🍽️', color: '88, 214, 113'  },
  { slug: 'travel',   label: 'Travel',   emoji: '✈️', color: '100, 240, 235' },
  { slug: 'tech',     label: 'Tech',     emoji: '💻', color: '64, 156, 255'  },
  { slug: 'finance',  label: 'Finance',  emoji: '💰', color: '255, 159, 10'  },
  { slug: 'scam',     label: 'Scam',     emoji: '🔐', color: '255, 75, 110'  },
];

export function CategoryPills() {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-6">
      {CATEGORIES.map(c => (
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
