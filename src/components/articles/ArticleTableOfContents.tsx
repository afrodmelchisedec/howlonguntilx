// FILE: src/components/articles/ArticleTableOfContents.tsx
export function ArticleTableOfContents({ headings, glow }: { headings: { id: string; text: string }[]; glow: string }) {
  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="article-toc ios-card-nested anim-fade-up mb-6 p-4"
      style={{ border: `1px solid rgba(${glow}, 0.18)` }}
    >
      <p className="text-caption font-bold mb-2" style={{ color: `rgb(${glow})`, letterSpacing: '0.06em' }}>
        ON THIS PAGE
      </p>
      <ul className="flex flex-col gap-1.5">
        {headings.map((h, i) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className="article-toc-link text-footnote block"
              style={{ color: 'var(--text-secondary)', animationDelay: `${i * 40}ms` }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
