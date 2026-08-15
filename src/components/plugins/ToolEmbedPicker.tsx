// FILE: src/components/plugins/ToolEmbedPicker.tsx
'use client';
import { useMemo, useState } from 'react';
import { TOOLS, CATEGORY_META } from '@/app/tools/toolsData';
import { EMBED_REGISTRY } from '@/lib/embedRegistry';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { CodeBlock } from '@/components/docs/CodeBlock';

export function ToolEmbedPicker({ siteUrl }: { siteUrl: string }) {
  const embeddableTools = useMemo(() => TOOLS.filter(t => t.slug in EMBED_REGISTRY), []);

  const categoryPills = useMemo(() => {
    const present = new Set(embeddableTools.map(t => t.category));
    return (Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[])
      .filter(slug => present.has(slug))
      .map(slug => ({ slug, ...CATEGORY_META[slug], rgb: getCategoryGlowRGB(slug) }));
  }, [embeddableTools]);

  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_META | null>(null);

  const filteredTools = useMemo(() => {
    if (!activeCategory) return embeddableTools;
    return embeddableTools.filter(t => t.category === activeCategory);
  }, [embeddableTools, activeCategory]);

  const [selectedSlug, setSelectedSlug] = useState(embeddableTools[0]?.slug ?? '');

  // If the active category filters out the current selection, snap to the
  // first tool in the new filtered list instead of showing a stale snippet.
  const effectiveSlug = filteredTools.some(t => t.slug === selectedSlug)
    ? selectedSlug
    : (filteredTools[0]?.slug ?? '');

  const selectedTool = TOOLS.find(t => t.slug === effectiveSlug);

  const shortcodeSnippet = selectedTool ? `[hlux_tool slug="${selectedTool.slug}"]` : '';
  const htmlSnippet = selectedTool
    ? `<iframe id="hlux-${selectedTool.slug}"\n  src="${siteUrl}/embed/${selectedTool.slug}"\n  style="width:100%;max-width:460px;border:0;"\n  scrolling="no"></iframe>`
    : '';

  if (embeddableTools.length === 0) {
    return <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>No tools available for embed yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className="category-pill"
          data-active={activeCategory === null}
          style={{ ['--pill-rgb' as any]: '148, 148, 158' }}
        >
          All
        </button>
        {categoryPills.map(cat => (
          <button
            key={cat.slug}
            type="button"
            onClick={() => setActiveCategory(prev => (prev === cat.slug ? null : cat.slug))}
            className="category-pill"
            data-active={activeCategory === cat.slug}
            style={{ ['--pill-rgb' as any]: cat.rgb }}
          >
            <span aria-hidden="true">{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      <label className="text-caption font-semibold mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>
        Pick a tool
      </label>
      <select
        value={effectiveSlug}
        onChange={e => setSelectedSlug(e.target.value)}
        className="ios-card-nested w-full px-3 py-2.5 text-sm focus:outline-none mb-5"
      >
        {filteredTools.map(t => (
          <option key={t.slug} value={t.slug}>{t.title}</option>
        ))}
      </select>

      {selectedTool && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-caption font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>Shortcode (WordPress)</p>
            <CodeBlock code={shortcodeSnippet} language="text" />
          </div>
          <div>
            <p className="text-caption font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>HTML embed (anywhere else)</p>
            <CodeBlock code={htmlSnippet} language="html" />
          </div>
        </div>
      )}
    </div>
  );
}
