// FILE: src/components/articles/ArticleBlocks.tsx
import Link from 'next/link';
import { resolveRecurrenceDate } from '@/lib/dateResolvers';
import { widgetsForTool, fullToolForTool, toolComponentForSlug } from '@/lib/widgetRegistry';
import { ArticleChart } from './ArticleChart';
import { ArticleFaq } from './ArticleFaq';
import { AffiliateBanner } from './AffiliateBanner';
import { Fragment, createElement } from 'react';

interface ToolMapping { slug: string; label: string; path: string }

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string; sourceUrl?: string; sourceLabel?: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
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
      // Optional — when set, targetDate above is ignored and the date is
      // computed at render time via DATE_RESOLVERS[recurrenceKey] instead.
      // Use for evergreen recurring entities (see src/lib/dateResolvers.ts)
      // so the countdown never needs manual annual updates.
      recurrenceKey?: string;
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
  const hero = (blocks.find(b => b.type === 'hero_countdown') as Extract<Block, { type: 'hero_countdown' }> | undefined) ?? null;
  if (!hero) return null;
  // Evergreen recurring entities carry a recurrenceKey instead of a stored
  // targetDate — resolve it here so every caller (ArticleLayout, ArticleSchema)
  // automatically gets the correct next-occurrence date with no extra wiring.
  if (hero.recurrenceKey) {
    const resolved = resolveRecurrenceDate(hero.recurrenceKey);
    if (resolved) return { ...hero, targetDate: resolved };
  }
  return hero;
}

export function extractSources(blocks: Block[]) {
  return (blocks.find(b => b.type === 'sources') as Extract<Block, { type: 'sources' }> | undefined)?.items ?? null;
}

// The very first visible block, when it's a paragraph, is treated as the direct-answer
// lead — SEO/AEO wants this rendered immediately after the hero image, ahead of the
// disclaimer/reviewer/TOC furniture, rather than buried below them. Only pulls the
// SINGLE first block (not every leading paragraph) — see ArticleLayout.tsx usage.
export function extractLeadParagraph(blocks: Block[]): Extract<Block, { type: 'paragraph' }> | null {
  const first = bodyBlocks(blocks)[0];
  return first && first.type === 'paragraph' ? first : null;
}

// Same visible-block list ArticleBlocks would normally render, minus whichever block
// extractLeadParagraph pulled out (so it isn't rendered twice). Pass this — not the
// raw article.blocks — into <ArticleBlocks blocks={...} /> once you've rendered the
// lead paragraph separately above it.
export function bodyBlocksWithoutLead(blocks: Block[]) {
  const visible = bodyBlocks(blocks);
  const lead = extractLeadParagraph(blocks);
  if (!lead) return visible;
  const idx = visible.indexOf(lead);
  return idx === -1 ? visible : [...visible.slice(0, idx), ...visible.slice(idx + 1)];
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

// Checks whether a paragraph block links anywhere on this site — either via
// its trailing sourceUrl, or an inline `[label](/path)` link within the text.
// Relative (starting with "/") counts as internal; anything else is external.
function isInternalUrl(url: string) {
  return url.startsWith('/');
}

// Parses inline `[label](url)` markdown-style links within paragraph text so
// authors can drop a natural internal link (e.g. to a sibling tool) mid-sentence,
// not just as a single trailing "Source" link per paragraph. Internal (relative)
// links render as Next <Link> for client-side nav + crawlability; external links
// open in a new tab, same as the existing sourceUrl link.
export function renderParagraphText(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const [, label, url] = match;
    parts.push(
      isInternalUrl(url) ? (
        <Link key={key++} href={url} className="underline underline-offset-2" style={{ color: 'inherit' }}>
          {label}
        </Link>
      ) : (
        <a key={key++} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: 'inherit' }}>
          {label}
        </a>
      )
    );
    lastIndex = linkPattern.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

// Standalone renderer for the lead paragraph pulled out by extractLeadParagraph —
// mirrors the 'paragraph' branch inside ArticleBlocks below exactly (same link
// parsing, same sourceUrl handling) so it's visually identical, just rendered
// in a different position in the page (immediately under the hero image).
export function ArticleLeadParagraph({ block }: { block: Extract<Block, { type: 'paragraph' }> }) {
  return (
    <p className="article-body article-lead anim-fade-up mb-5">
      {renderParagraphText(block.text)}
      {block.sourceUrl && (
        <>
          {' '}
          {isInternalUrl(block.sourceUrl) ? (
            <Link href={block.sourceUrl} className="text-caption1 underline underline-offset-2" style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}>
              {block.sourceLabel ?? 'Source'}
            </Link>
          ) : (
            <a href={block.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-caption1 underline underline-offset-2" style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}>
              {block.sourceLabel ?? 'Source'}
            </a>
          )}
        </>
      )}
    </p>
  );
}

export function ArticleBlocks({
  toolSlug, blocks, glow, subcategoryTools, affiliateBanner,
}: {
  toolSlug: string; blocks: Block[]; glow: string;
  // Tool mapping from the article's subcategory (Category.tools) — used to resolve
  // tool_embed_full blocks that don't specify an explicit toolSlug. Pass [] or omit
  // for tools (like upcoming-events) that use the legacy article.toolSlug-keyed path instead.
  subcategoryTools?: ToolMapping[];
  // Fetched server-side by the caller (ArticleLayout) via getAffiliateBanner(category.slug).
  // Rendered once, right before the FAQ block, themed with the page's glow color.
  affiliateBanner?: { title: string; description: string; ctaLabel: string; href: string; imageUrl: string | null } | null;
}) {
  const widgets = widgetsForTool(toolSlug);
  // Legacy path first (upcoming-events / dark-sky-explorer, keyed by the article's own toolSlug) —
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
          return <h2 key={i} id={id} className="article-h2 anim-fade-up scroll-mt-24" style={delay}>{b.text}</h2>;
        }
        if (b.type === 'paragraph') {
          return (
            <p key={i} className="article-body anim-fade-up" style={delay}>
              {renderParagraphText(b.text)}
              {b.sourceUrl && (
                <>
                  {' '}
                  {isInternalUrl(b.sourceUrl) ? (
                    <Link
                      href={b.sourceUrl}
                      className="text-caption1 underline underline-offset-2"
                      style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}
                    >
                      {b.sourceLabel ?? 'Source'}
                    </Link>
                  ) : (
                    createElement(
                      'a',
                      {
                        href: b.sourceUrl,
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        className: 'text-caption1 underline underline-offset-2',
                        style: { color: 'var(--text-tertiary, var(--text-secondary))' },
                      },
                      b.sourceLabel ?? 'Source'
                    )
                  )}
                </>
              )}
            </p>
          );
        }
        if (b.type === 'image') {
          return (
            <figure key={i} className="anim-fade-up" style={delay}>
              <img src={b.src} alt={b.alt} className="rounded-2xl w-full" loading="lazy" />
              {b.caption && (
                <figcaption className="article-caption mt-2">
                  {b.caption}
                </figcaption>
              )}
            </figure>
          );
        }
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

// Used by the admin SEO scorer's new "Internal link present" check — true if
// any paragraph links somewhere on this site, via sourceUrl or an inline link.
export function hasInternalLink(blocks: Block[]): boolean {
  return bodyBlocks(blocks).some(b => {
    if (b.type !== 'paragraph') return false;
    if (b.sourceUrl && isInternalUrl(b.sourceUrl)) return true;
    return /\]\(\/[^)]*\)/.test(b.text);
  });
}