// FILE: src/components/countdown/EventBody.tsx
import type { EventContentBodyBlock } from '@/lib/seo';

export function EventBody({ blocks }: { blocks?: EventContentBodyBlock[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pb-8 text-left sg">
      {blocks.map((b, i) =>
        b.type === 'heading' ? (
          <h2 key={i} className="text-title2 mb-3 mt-6 first:mt-0">{b.text}</h2>
        ) : (
          <p key={i} className="text-callout mb-4" style={{ color: 'var(--text-secondary)' }}>{b.text}</p>
        )
      )}
    </div>
  );
}
