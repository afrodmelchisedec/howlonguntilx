// FILE: src/components/articles/ArticleCard.tsx
import Link from 'next/link';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

type CardCategory = { slug: string; name: string; emoji?: string | null } | null;

export function ArticleCard({
  toolSlug,
  slug,
  title,
  dek,
  heroImageUrl,
  glow,
  category,
}: {
  toolSlug: string;
  slug: string;
  title: string;
  dek: string;
  heroImageUrl?: string | null;
  glow: string;
  category?: CardCategory;
}) {
  const catGlow = category ? getCategoryGlowRGB(category.slug) : null;
  const catLabel = category ? category.slug.charAt(0).toUpperCase() + category.slug.slice(1) : null;

  return (
    <Link href={`/tools/${toolSlug}/${slug}`} className="article-glow-card ios-card-nested press flex flex-col overflow-hidden anim-fade-up" style={{ border: `1px solid rgba(${glow}, 0.2)` }}>
      <img src={heroImageUrl || '/images/default-article-hero.svg'} alt={title} className="w-full aspect-video object-cover" loading="lazy" />
      <div className="p-4 flex flex-col flex-1">
        <p className="text-headline mb-1">{title}</p>
        <p className="text-footnote flex-1" style={{ color: 'var(--text-secondary)' }}>{dek}</p>
        {category && catGlow && catLabel && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-3 self-start"
            style={{
              background: `rgba(${catGlow}, 0.1)`,
              color: `rgb(${catGlow})`,
              border: `1px solid rgba(${catGlow}, 0.25)`,
              pointerEvents: 'none',
            }}
          >
            {category.emoji && <span>{category.emoji}</span>}
            <span>{catLabel}</span>
          </span>
        )}
      </div>
    </Link>
  );
}
