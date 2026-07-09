// FILE: src/components/articles/ArticleBlocks.tsx
import { widgetsForTool, fullToolForTool } from '@/lib/widgetRegistry';
import { ArticleChart } from './ArticleChart';
import { ArticleFaq } from './ArticleFaq';

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'tool_embed'; widget: string; config: Record<string, any> }
  | { type: 'tool_embed_full' } // embeds the ACTUAL free-tier tool for this article's toolSlug
  | { type: 'chart'; title: string; data: { label: string; value: number }[] }
  | { type: 'faq'; items: { q: string; a: string }[] };

export function ArticleBlocks({ toolSlug, blocks, glow }: { toolSlug: string; blocks: Block[]; glow: string }) {
  const widgets = widgetsForTool(toolSlug);
  const FullTool = fullToolForTool(toolSlug);

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.type === 'heading') return <h2 key={i} className="text-title3 mt-2">{b.text}</h2>;
        if (b.type === 'paragraph') return <p key={i} className="text-callout" style={{ color: 'var(--text-secondary)' }}>{b.text}</p>;
        if (b.type === 'image') return <img key={i} src={b.src} alt={b.alt} className="rounded-2xl w-full" loading="lazy" />;
        if (b.type === 'chart') return <ArticleChart key={i} title={b.title} data={b.data} glow={glow} />;
        if (b.type === 'faq') return <ArticleFaq key={i} items={b.items} glow={glow} />;
        if (b.type === 'tool_embed') {
          const Widget = widgets[b.widget];
          return Widget ? <Widget key={i} config={b.config} /> : null;
        }
        if (b.type === 'tool_embed_full') {
          return FullTool ? <div key={i} className="my-6"><FullTool /></div> : null;
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
