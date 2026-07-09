// FILE: src/components/articles/ArticleBlocks.tsx
import { widgetsForTool } from '@/lib/widgetRegistry';

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'tool_embed'; widget: string; config: Record<string, any> };

export function ArticleBlocks({ toolSlug, blocks }: { toolSlug: string; blocks: Block[] }) {
  const widgets = widgetsForTool(toolSlug);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => {
        if (b.type === 'heading') return <h3 key={i} className="text-title3 mt-2">{b.text}</h3>;
        if (b.type === 'paragraph') return <p key={i} className="text-callout" style={{ color: 'var(--text-secondary)' }}>{b.text}</p>;
        if (b.type === 'image') return <img key={i} src={b.src} alt={b.alt} className="rounded-2xl w-full" loading="lazy" />;
        if (b.type === 'tool_embed') {
          const Widget = widgets[b.widget];
          if (!Widget) return null; // silently skip unregistered/mismatched widget refs
          return <Widget key={i} config={b.config} />;
        }
        return null;
      })}
    </div>
  );
}

export function hasToolEmbed(blocks: Block[]) {
  return blocks.some(b => b.type === 'tool_embed');
}
