import Link from 'next/link';
import { getCategoryGlow, prettifySlug } from '@/lib/seo';

interface Props {
  categorySlug: string;
  categoryName?: string | null;
  emoji?: string | null;
}

export function CategoryBadge({ categorySlug, categoryName, emoji }: Props) {
  const glow = getCategoryGlow(categorySlug);
  const label = categoryName ?? prettifySlug(categorySlug);
  return (
    <Link
      href={`/categories/${categorySlug}`}
      className={`inline-flex items-center gap-1.5 gc-${glow}`}
      style={{
        border: '1px solid var(--border-hairline)',
        color: `rgb(var(--glow-${glow}))`,
        padding: '5px 13px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </Link>
  );
}
