'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATS = [
  { slug: 'leisure',  label: 'Leisure',  emoji: '⚽', cls: 'gc-sports'  },
  { slug: 'food',     label: 'Food',     emoji: '🍽️', cls: 'gc-nature'  },
  { slug: 'travel',   label: 'Travel',   emoji: '✈️', cls: 'gc-travel'  },
  { slug: 'tech',     label: 'Tech',     emoji: '💻', cls: 'gc-tech'    },
  { slug: 'finance',  label: 'Finance',  emoji: '💰', cls: 'gc-finance' },
  { slug: 'scam',     label: 'Scam',     emoji: '🔐', cls: 'gc-personal'},
];

export function CategoryStrip() {
  const pathname = usePathname();

  return (
    <div style={{
      borderTop: '1px solid var(--border-hairline)',
      borderBottom: '1px solid var(--border-hairline)',
      background: 'var(--bg-elevated-2)',
    }} className="py-3">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 sg">
          {CATS.map(c => {
            const active = pathname?.startsWith(`/categories/${c.slug}`);
            return (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className={`ios-card interactive glow ${c.cls} anim-fade-up flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all`}
                style={{
                  color: active ? '#fff' : 'var(--text-secondary)',
                  background: active ? `rgb(var(--glow-${c.cls.replace('gc-', '')}))` : 'var(--bg-elevated)',
                  borderColor: active ? `rgba(var(--glow-${c.cls.replace('gc-', '')}), 0.6)` : 'var(--border-hairline)',
                  boxShadow: active ? `0 0 16px 2px rgba(var(--glow-${c.cls.replace('gc-', '')}), 0.3)` : undefined,
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
