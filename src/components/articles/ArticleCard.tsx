// FILE: src/components/articles/ArticleCard.tsx
import Link from 'next/link';

export function ArticleCard({ toolSlug, slug, title, dek, heroImageUrl, glow }: { toolSlug: string; slug: string; title: string; dek: string; heroImageUrl: string; glow: string }) {
  return (
    <Link href={`/tools/${toolSlug}/${slug}`} className="ios-card-nested press flex flex-col overflow-hidden anim-fade-up" style={{ border: `1px solid rgba(${glow}, 0.2)` }}>
      <img src={heroImageUrl} alt={title} className="w-full aspect-video object-cover" loading="lazy" />
      <div className="p-4">
        <p className="text-headline mb-1">{title}</p>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{dek}</p>
      </div>
    </Link>
  );
}
