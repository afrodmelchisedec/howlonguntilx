// FILE: src/components/articles/ArticleFaq.tsx
export function ArticleFaq({ items, glow }: { items: { q: string; a: string }[]; glow: string }) {
  return (
    <div className="my-4">
      <h2 className="text-title3 mb-3">Frequently asked questions</h2>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <details key={i} className="ios-card-nested p-4">
            <summary className="text-headline cursor-pointer" style={{ color: `rgb(${glow})` }}>{item.q}</summary>
            <p className="text-footnote mt-2" style={{ color: 'var(--text-secondary)' }}>{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
