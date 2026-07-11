// FILE: src/components/articles/ArticleBlocks.tsx
import { widgetsForTool, fullToolForTool } from '@/lib/widgetRegistry';
import { ArticleChart } from './ArticleChart';
import { ArticleFaq } from './ArticleFaq';

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'tool_embed'; widget: string; config: Record<string, any> }
  | { type: 'tool_embed_full' }
  | { type: 'chart'; title: string; data: { label: string; value: number }[] }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'hero_countdown'; targetDate: string; label: string };

// hero_countdown is rendered separately at the top of ArticleLayout, not inline —
// this filters it out of the normal block stream.
export function bodyBlocks(blocks: Block[]) {
  return blocks.filter(b => b.type !== 'hero_countdown');
}
export function extractHeroCountdown(blocks: Block[]) {
  return (blocks.find(b => b.type === 'hero_countdown') as Extract<Block, { type: 'hero_countdown' }> | undefined) ?? null;
}

function slugify(text: string) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Stable heading ids, deduped so two identical headings in one article don't collide.
export function extractHeadings(blocks: Block[]): { id: string; text: string }[] {
  const seen = new Map<string, number>();
  return bodyBlocks(blocks)
    .filter((b): b is Extract<Block, { type: 'heading' }> => b.type === 'heading')
    .map(b => {
      const base = slugify(b.text);
      const n = seen.get(base) ?? 0;
      seen.set(base, n + 1);
      return { id: n === 0 ? base : `${base}-${n}`, text: b.text };
    });
}

export function ArticleBlocks({ toolSlug, blocks, glow }: { toolSlug: string; blocks: Block[]; glow: string }) {
  const widgets = widgetsForTool(toolSlug);
  const FullTool = fullToolForTool(toolSlug);
  const visible = bodyBlocks(blocks);
  const headings = extractHeadings(blocks);
  let headingCursor = 0;

  return (
    <div className="flex flex-col gap-4">
      {visible.map((b, i) => {
        const delay = { animationDelay: `${Math.min(i, 8) * 60}ms` };
        if (b.type === 'heading') {
          const id = headings[headingCursor++]?.id;
          return <h2 key={i} id={id} className="text-title3 mt-2 anim-fade-up scroll-mt-24" style={delay}>{b.text}</h2>;
        }
        if (b.type === 'paragraph') return <p key={i} className="text-callout anim-fade-up" style={{ ...delay, color: 'var(--text-secondary)' }}>{b.text}</p>;
        if (b.type === 'image') return <img key={i} src={b.src} alt={b.alt} className="rounded-2xl w-full anim-fade-up" style={delay} loading="lazy" />;
        if (b.type === 'chart') return <ArticleChart key={i} title={b.title} data={b.data} glow={glow} />;
        if (b.type === 'faq') return <ArticleFaq key={i} items={b.items} glow={glow} />;
        if (b.type === 'tool_embed') {
          const Widget = widgets[b.widget];
          return Widget ? <Widget key={i} config={b.config} /> : null;
        }
        if (b.type === 'tool_embed_full') {
          return FullTool ? <div key={i} className="my-6 anim-fade-up" style={delay}><FullTool /></div> : null;
        }
        return null;
      })}
    </div>
  );
}

export function hasToolEmbed(blocks: Block[]) {
  return blocks.some(b => b.type === 'tool_embed' || b.type === 'tool_embed_full');
}
export function extractFaq(blocks: Block[]): { q: string; a: string }[] | null {
  const faqBlock = blocks.find(b => b.type === 'faq') as Extract<Block, { type: 'faq' }> | undefined;
  return faqBlock?.items ?? null;
}
