'use client';
import Link from 'next/link';

interface Props { slug: string }

export function EmbedCta({ slug }: Props) {
  return (
    <div className="mt-6 text-center">
      <Link href={`/embed?event=${slug}`} className="text-footnote transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgb(var(--accent-brand))')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}>
        + Embed this countdown on your website
      </Link>
    </div>
  );
}
