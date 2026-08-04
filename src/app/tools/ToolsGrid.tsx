// FILE: src/app/tools/ToolsGrid.tsx
'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getCategoryGlowRGB } from '@/lib/categoryGlow';
import { TOOLS, CATEGORY_META } from './toolsData';

const PAGE_SIZE = 12;

export function ToolsGrid() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof CATEGORY_META | null>(null);
  const [page, setPage] = useState(1);

  // Only show pills for categories that actually have tools, in CATEGORY_META's declared order.
  const categoryPills = useMemo(() => {
    const used = new Set(TOOLS.map(t => t.category));
    return (Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[])
      .filter(slug => used.has(slug))
      .map(slug => ({ slug, ...CATEGORY_META[slug], rgb: getCategoryGlowRGB(slug) }));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TOOLS.filter(tool => {
      if (activeCategory && tool.category !== activeCategory) return false;
      if (!q) return true;
      return tool.title.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q);
    });
  }, [query, activeCategory]);

  // Reset to page 1 whenever the search or category filter changes.
  useEffect(() => { setPage(1); }, [query, activeCategory]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount);
  const paginated = filtered.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  return (
    <div>
      <div className="flex flex-col items-center gap-4 mb-8">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tools…"
          className="tools-search-input"
          aria-label="Search tools"
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
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
      </div>

      {filtered.length === 0 ? (
        <p className="text-callout text-center" style={{ color: 'var(--text-secondary)' }}>
          No tools match your search. Try a different term or category.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sg">
            {paginated.map((tool, i) => {
              const rgb = getCategoryGlowRGB(tool.category);
              const meta = CATEGORY_META[tool.category];
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="tool-grid-card anim-fade-up flex flex-col p-5 rounded-3xl"
                  style={{
                    animationDelay: `${Math.min(i, 12) * 40}ms`,
                    background: `linear-gradient(150deg, rgba(${rgb}, 0.16), rgba(${rgb}, 0.03))`,
                    border: `1px solid rgba(${rgb}, 0.25)`,
                    ['--card-rgb' as any]: rgb,
                    ['--breathe-delay' as any]: `${(i % 6) * 0.35}s`,
                  }}
                >
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4 self-start"
                    style={{ background: `rgba(${rgb}, 0.14)`, color: `rgb(${rgb})` }}
                  >
                    <span aria-hidden="true">{meta.emoji}</span>
                    <span>{meta.label}</span>
                  </span>

                  <p className="text-headline mb-2" style={{ color: 'var(--text-primary)' }}>{tool.title}</p>
                  <p className="text-footnote flex-1" style={{ color: 'var(--text-secondary)' }}>{tool.description}</p>

                  <span className="text-caption font-semibold mt-4 inline-flex items-center gap-1" style={{ color: `rgb(${rgb})` }}>
                    Open tool <span aria-hidden="true">→</span>
                  </span>
                </Link>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-center flex-wrap gap-2 mt-10">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={clampedPage === 1}
                className="pagination-btn"
              >
                ← Prev
              </button>

              {Array.from({ length: pageCount }, (_, idx) => idx + 1).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className="pagination-btn"
                  data-active={n === clampedPage}
                >
                  {n}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(p => Math.min(pageCount, p + 1))}
                disabled={clampedPage === pageCount}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .tools-search-input {
          width: 100%;
          max-width: 420px;
          padding: 0.7rem 1.1rem;
          border-radius: 999px;
          border: 1px solid var(--border-color, rgba(148,148,158,0.25));
          background: var(--surface-secondary, rgba(148,148,158,0.06));
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .tools-search-input:focus {
          border-color: rgb(var(--accent-brand));
          box-shadow: 0 0 0 3px rgba(var(--accent-brand), 0.15);
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.95rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          border: 1px solid rgba(var(--pill-rgb), 0.3);
          background: rgba(var(--pill-rgb), 0.08);
          color: rgb(var(--pill-rgb));
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, box-shadow 0.2s ease;
        }
        .category-pill:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 18px rgba(var(--pill-rgb), 0.25);
        }
        .category-pill[data-active="true"] {
          background: rgb(var(--pill-rgb));
          color: white;
          box-shadow: 0 6px 18px rgba(var(--pill-rgb), 0.35);
        }
        .pagination-btn {
          min-width: 2.25rem;
          padding: 0.45rem 0.8rem;
          border-radius: 999px;
          border: 1px solid rgba(148,148,158,0.25);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease, color 0.2s ease;
        }
        .pagination-btn:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.06);
          border-color: rgb(var(--accent-brand));
          color: rgb(var(--accent-brand));
        }
        .pagination-btn[data-active="true"] {
          background: rgb(var(--accent-brand));
          border-color: rgb(var(--accent-brand));
          color: white;
        }
        .pagination-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .tool-grid-card {
          position: relative;
          transition: border-color 0.3s ease;
        }
        .tool-grid-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: -1;
          animation: toolBreathe 3.8s ease-in-out infinite;
          animation-delay: var(--breathe-delay, 0s);
        }
        .tool-grid-card:hover {
          animation: toolBounceHover 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          border-color: rgba(var(--card-rgb), 0.7);
        }
        .tool-grid-card:hover::after {
          animation: toolGlowPulse 1.6s ease-in-out infinite;
        }
        .tool-grid-card:active {
          animation: none;
          transform: translateY(-3px) scale(0.98);
          transition: transform 0.12s ease;
        }
        @keyframes toolBounceHover {
          0% {
            transform: translateY(0) scale(1);
          }
          35% {
            transform: translateY(-13px) scale(1.075);
          }
          55% {
            transform: translateY(-5px) scale(1.03);
          }
          75% {
            transform: translateY(-9.5px) scale(1.06);
          }
          90% {
            transform: translateY(-7px) scale(1.05);
          }
          100% {
            transform: translateY(-8px) scale(1.055);
          }
        }
        @keyframes toolBreathe {
          0%, 100% {
            box-shadow: 0 0 0 1px rgba(var(--card-rgb), 0.12), 0 4px 18px rgba(var(--card-rgb), 0.06);
          }
          50% {
            box-shadow: 0 0 0 1px rgba(var(--card-rgb), 0.3), 0 8px 30px rgba(var(--card-rgb), 0.2);
          }
        }
        @keyframes toolGlowPulse {
          0%, 100% {
            box-shadow: 0 0 0 1.5px rgba(var(--card-rgb), 0.55),
                        0 20px 48px rgba(var(--card-rgb), 0.32),
                        0 0 50px rgba(var(--card-rgb), 0.24);
          }
          50% {
            box-shadow: 0 0 0 1.5px rgba(var(--card-rgb), 0.8),
                        0 24px 60px rgba(var(--card-rgb), 0.45),
                        0 0 80px rgba(var(--card-rgb), 0.4);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .tool-grid-card::after { animation: none; }
        }
      `,
        }}
      />
    </div>
  );
}
