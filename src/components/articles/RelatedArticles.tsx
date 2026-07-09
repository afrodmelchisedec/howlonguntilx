// FILE: src/components/articles/RelatedArticles.tsx
import { listPublishedArticles } from '@/lib/articles';
import { ArticleCard } from './ArticleCard';

export async function RelatedArticles({ toolSlug, excludeSlug, glow }: { toolSlug: string; excludeSlug: string; glow: string }) {
  const all = await listPublishedArticles(toolSlug, 6);
  const related = all.filter(a => a.slug !== excludeSlug).slice(0, 3);
  if (related.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-title3 mb-4">Related reading</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        {related.map(a => (
          <ArticleCard key={a.slug} toolSlug={toolSlug} slug={a.slug} title={a.title} dek={a.dek} heroImageUrl={a.heroImageUrl} glow={glow} />
        ))}
      </div>
    </div>
  );
}
