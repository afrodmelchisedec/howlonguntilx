// FILE: src/components/countdown/EventBody.tsx
import type { EventContentBodyBlock } from '@/lib/seo';
import { ArticleChart } from '@/components/articles/ArticleChart';
import { ArticleFaq } from '@/components/articles/ArticleFaq';
import { SourcesFooter } from '@/components/countdown/SourcesFooter';

type Block = EventContentBodyBlock & { type: string };

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function EventBody({ blocks, glow = '83, 74, 217' }: { blocks?: EventContentBodyBlock[]; glow?: string }) {
  if (!blocks || blocks.length === 0) return null;

  const visible = blocks.map((b, i) => {
    if (b.type === 'heading') {
      const base = slugify(b.text);
      const id = base || `heading-${i}`;
      return { ...b, _id: id };
    }
    return b;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 text-left sg">
      <div className="flex flex-col gap-4">
        {visible.map((b, i) => {
          const delay = { animationDelay: `${Math.min(i, 8) * 60}ms` };

          if (b.type === 'heading') {
            return (
              <h2 key={i} id={(b as any)._id} className="text-title3 mt-2 anim-fade-up scroll-mt-24" style={delay}>
                {b.text}
              </h2>
            );
          }

          if (b.type === 'paragraph') {
            return (
              <p key={i} className="text-callout anim-fade-up" style={{ ...delay, color: 'var(--text-secondary)' }}>
                {b.text}
                {(b as any).sourceUrl && (
                  <>
                    {' '}
                    <a
                      href={(b as any).sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption underline underline-offset-2"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {(b as any).sourceLabel ?? 'Source'}
                    </a>
                  </>
                )}
              </p>
            );
          }

          if (b.type === 'image') {
            const caption = (b as any).caption;
            return (
              <figure key={i} className="anim-fade-up" style={delay}>
                <img
                  src={(b as any).src}
                  alt={(b as any).alt}
                  className="rounded-2xl w-full"
                  loading="lazy"
                />
                {caption && (
                  <figcaption className="text-caption1 mt-2" style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}>
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          if (b.type === 'chart') {
            const chart = b as any;
            return <ArticleChart key={i} title={chart.title} data={chart.data} glow={glow} />;
          }

          if (b.type === 'faq') {
            const faq = b as any;
            return <ArticleFaq key={i} items={faq.items} glow={glow} />;
          }

          if (b.type === 'sources') {
            const src = b as any;
            return (
              <div key={i} className="mt-6">
                <SourcesFooter sources={src.items} lastReviewed={undefined} />
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
