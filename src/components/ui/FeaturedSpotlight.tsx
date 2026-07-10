// FILE: src/components/ui/FeaturedSpotlight.tsx
import { getWeeklyFeaturedPiece } from '@/lib/featuredPiece';

const GLOW = '196, 132, 252'; // distinct violet-pink, unused elsewhere on this page
const KIND_META: Record<string, { label: string; emoji: string }> = {
  history: { label: 'A MOMENT IN TIME', emoji: '📜' },
  fact:    { label: 'DID YOU KNOW',      emoji: '🔎' },
  quote:   { label: 'WORDS ON TIME',     emoji: '💬' },
  meme:    { label: 'FOR THE TIMELINE',  emoji: '😄' },
};

export async function FeaturedSpotlight() {
  const piece = await getWeeklyFeaturedPiece();
  if (!piece) return null;

  const meta = KIND_META[piece.kind] ?? { label: 'FEATURED', emoji: '✨' };
  const paragraphs = piece.body.split('\n\n').filter(Boolean);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px 56px' }}>
      <div
        className="ios-card p-6 sm:p-10 anim-fade-up"
        style={{
          background: `linear-gradient(160deg, rgba(${GLOW}, 0.08), transparent 60%)`,
          boxShadow: `0 0 0 1.5px rgba(${GLOW}, 0.22), 0 0 50px rgba(${GLOW}, 0.08)`,
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">{meta.emoji}</span>
          <p className="text-caption font-bold tracking-wide" style={{ color: `rgb(${GLOW})` }}>{meta.label} · UPDATED WEEKLY</p>
        </div>

        {piece.imageUrl && (
          <img src={piece.imageUrl} alt={piece.title} className="w-full rounded-2xl mb-5" style={{ aspectRatio: '21/9', objectFit: 'cover' }} loading="lazy" />
        )}

        <h2 className="text-title2 mb-4" style={{ maxWidth: 640 }}>{piece.title}</h2>

        <div className="flex flex-col gap-3" style={{ maxWidth: 720 }}>
          {paragraphs.map((p, i) => (
            <p key={i} className="text-callout anim-fade-up" style={{ color: 'var(--text-secondary)', animationDelay: `${i * 60}ms` }}>{p}</p>
          ))}
        </div>

        {piece.sourceLabel && (
          <p className="text-caption mt-6" style={{ color: 'var(--text-tertiary)' }}>
            Source: {piece.sourceUrl ? (
              <a href={piece.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: `rgb(${GLOW})` }}>{piece.sourceLabel}</a>
            ) : piece.sourceLabel}
          </p>
        )}
      </div>
    </div>
  );
}
