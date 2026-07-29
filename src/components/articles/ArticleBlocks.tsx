// FILE: src/components/articles/ArticleBlocks.tsx
import { widgetsForTool, fullToolForTool, toolComponentForSlug } from '@/lib/widgetRegistry';
import { ArticleChart } from './ArticleChart';
import { ArticleFaq } from './ArticleFaq';
import { AffiliateBanner } from './AffiliateBanner';
import { Fragment } from 'react';

interface ToolMapping { slug: string; label: string; path: string }

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string; sourceUrl?: string; sourceLabel?: string }
  | { type: 'image'; src: string; alt: string }
  | { type: 'tool_embed'; widget: string; config: Record<string, any> }
  // `toolSlug` is optional — when omitted, resolution falls back to the article's
  // subcategory tool mapping (see `subcategoryTools` prop on ArticleBlocks below).
  // Set it explicitly if a subcategory has more than one mapped tool and you need
  // a specific one rather than whichever is first.
  | { type: 'tool_embed_full'; toolSlug?: string }
  | { type: 'chart'; title: string; data: { label: string; value: number }[] }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'sources'; items: { label: string; url: string }[] }
  | {
      type: 'hero_countdown';
      targetDate: string;
      label: string;
      // Optional — populates Event.location in JSON-LD when the event has a
      // known physical venue. Omit entirely for virtual/TBD-location events.
      locationName?: string;
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry?: string;
    };

// hero_countdown is rendered separately at the top of ArticleLayout, not inline —
// this filters it out of the normal block stream.
export function bodyBlocks(blocks: Block[]) {
  return blocks.filter(b => b.type !== 'hero_countdown' && b.type !== 'sources');
}
export function extractHeroCountdown(blocks: Block[]) {
  return (blocks.find(b => b.type === 'hero_countdown') as Extract<Block, { type: 'hero_countdown' }> | undefined) ?? null;
}

export function extractSources(blocks: Block[]) {
  return (blocks.find(b => b.type === 'sources') as Extract<Block, { type: 'sources' }> | undefined)?.items ?? null;
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

export function ArticleBlocks({
  toolSlug, blocks, glow, subcategoryTools, affiliateBanner,
}: {
  toolSlug: string; blocks: Block[]; glow: string;
  // Tool mapping from the article's subcategory (Category.tools) — used to resolve
  // tool_embed_full blocks that don't specify an explicit toolSlug. Pass [] or omit
  // for tools (like tech-events) that use the legacy article.toolSlug-keyed path instead.
  subcategoryTools?: ToolMapping[];
  // Fetched server-side by the caller (ArticleLayout) via getAffiliateBanner(category.slug).
  // Rendered once, right before the FAQ block, themed with the page's glow color.
  affiliateBanner?: { title: string; description: string; ctaLabel: string; href: string; imageUrl: string | null } | null;
}) {
  const widgets = widgetsForTool(toolSlug);
  // Legacy path first (tech-events / dark-sky-explorer, keyed by the article's own toolSlug) —
  // unchanged from before, so those pages keep working exactly as-is.
  const LegacyFullTool = fullToolForTool(toolSlug);
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
        if (b.type === 'paragraph') {
          return (
            <p key={i} className="text-callout anim-fade-up" style={{ ...delay, color: 'var(--text-secondary)' }}>
              {b.text}
              {b.sourceUrl && (
                <>
                  {' '}
                  <a
                    href={b.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-caption1 underline underline-offset-2"
                    style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}
                  >
                    {b.sourceLabel ?? 'Source'}
                  </a>
                </>
              )}
            </p>
          );
        }
        if (b.type === 'image') return <img key={i} src={b.src} alt={b.alt} className="rounded-2xl w-full anim-fade-up" style={delay} loading="lazy" />;
        if (b.type === 'chart') return <ArticleChart key={i} title={b.title} data={b.data} glow={glow} />;
        if (b.type === 'faq') {
          return (
            <Fragment key={i}>
              {affiliateBanner && <AffiliateBanner banner={affiliateBanner} glow={glow} />}
              <ArticleFaq items={b.items} glow={glow} />
            </Fragment>
          );
        }
        if (b.type === 'tool_embed') {
          const Widget = widgets[b.widget];
          return Widget ? <Widget key={i} config={b.config} /> : null;
        }
        if (b.type === 'tool_embed_full') {
          if (LegacyFullTool) {
            return <div key={i} className="my-6 anim-fade-up" style={delay}><LegacyFullTool /></div>;
          }
          const resolvedSlug = b.toolSlug ?? subcategoryTools?.[0]?.slug;
          const SubTool = toolComponentForSlug(resolvedSlug);
          return SubTool ? <div key={i} className="my-6 anim-fade-up" style={delay}><SubTool /></div> : null;
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
