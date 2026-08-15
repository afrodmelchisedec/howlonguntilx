// FILE: src/components/plugins/PluginShortcodeTable.tsx
'use client';
import { useMemo, useState } from 'react';
import { TOOLS, CATEGORY_META } from '@/app/tools/toolsData';
import { EMBED_REGISTRY } from '@/lib/embedRegistry';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';

const VIOLET = '125, 118, 255';

export function PluginShortcodeTable() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_META | null>(null);

  const embeddableTools = useMemo(() => TOOLS.filter(t => t.slug in EMBED_REGISTRY), []);

  // Only show category pills for categories that actually have an embeddable
  // tool right now — avoids empty-result pills as more categories roll out.
  const categoryPills = useMemo(() => {
    const present = new Set(embeddableTools.map(t => t.category));
    return (Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[])
      .filter(slug => present.has(slug))
      .map(slug => ({ slug, ...CATEGORY_META[slug], rgb: getCategoryGlowRGB(slug) }));
  }, [embeddableTools]);

  const filteredTools = useMemo(() => {
    if (!activeCategory) return embeddableTools;
    return embeddableTools.filter(t => t.category === activeCategory);
  }, [embeddableTools, activeCategory]);

  function copy(slug: string) {
    navigator.clipboard.writeText(`[hlux_tool slug="${slug}"]`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1500);
  }

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

      {filteredTools.length === 0 ? (
        <p className="text-footnote text-center py-6" style={{ color: 'var(--text-secondary)' }}>
          No embeddable tools in this category yet.
        </p>
      ) : (
        <div className="ios-card-nested overflow-hidden">
          <table className="w-full text-footnote">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--fill-secondary)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Tool</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Shortcode</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.map(t => {
                const rgb = getCategoryGlowRGB(t.category);
                return (
                  <tr key={t.slug} style={{ borderBottom: '1px solid var(--fill-secondary)' }}>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">
                      <code style={{ color: `rgb(${rgb})` }}>[hlux_tool slug="{t.slug}"]</code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => copy(t.slug)} className="ios-card-nested press px-3 py-1.5 text-caption font-semibold">
                        {copiedSlug === t.slug ? 'Copied!' : 'Copy'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
