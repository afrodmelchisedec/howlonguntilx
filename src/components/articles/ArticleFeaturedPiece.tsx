// FILE: src/components/articles/ArticleFeaturedPiece.tsx
// This is the fix for "thin programmatic page" risk: real, rotating editorial
// content (history/fact/quote/meme) that isn't just the noun-swapped template.
// Fetch it server-side in the page/layout that calls ArticleLayout, e.g.:
//
//   const piece = await prisma.featuredPiece.findFirst({
//     where: { active: true, OR: [{ weekOf: startOfISOWeek(new Date()) }, { weekOf: null }] },
//     orderBy: { weekOf: 'desc' }, // pinned weekOf wins over the rotating pool
//   });
//
// then pass it into <ArticleLayout featuredPiece={piece} ... />. Rotate the pool
// selection (e.g. hash slug + ISO week) so the same article shows a different
// piece week to week — that's what keeps the page feeling "updated" to crawlers.

const KIND_LABEL: Record<string, string> = {
  history: 'DID YOU KNOW',
  fact: 'FAST FACT',
  quote: 'QUOTED',
  meme: 'FUN FIND',
};

export function ArticleFeaturedPiece({ piece, glow }: { piece: any; glow: string }) {
  if (!piece) return null;
  const paragraphs: string[] = String(piece.body ?? '').split('\n\n').filter(Boolean);

  return (
    <div
      className="article-glow-card ios-card-nested anim-fade-up my-8 overflow-hidden"
      style={{ border: `1px solid rgba(${glow}, 0.22)` }}
    >
      {piece.imageUrl && (
        <img src={piece.imageUrl} alt={piece.title} className="w-full aspect-video object-cover" loading="lazy" />
      )}
      <div className="p-5">
        <p className="text-caption font-bold mb-2" style={{ color: `rgb(${glow})`, letterSpacing: '0.06em' }}>
          {KIND_LABEL[piece.kind] ?? 'MORE ON THIS'}
        </p>
        <h3 className="text-headline mb-2">{piece.title}</h3>
        {paragraphs.map((p, i) => (
          <p key={i} className="text-footnote mb-2" style={{ color: 'var(--text-secondary)' }}>{p}</p>
        ))}
        {piece.sourceLabel && (
          <p className="text-caption mt-2" style={{ color: 'var(--text-secondary)' }}>
            Source:{' '}
            {piece.sourceUrl ? (
              <a href={piece.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" style={{ color: `rgb(${glow})` }}>
                {piece.sourceLabel}
              </a>
            ) : piece.sourceLabel}
          </p>
        )}
      </div>
    </div>
  );
}
