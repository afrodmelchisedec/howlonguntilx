// FILE: src/app/embed/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { EMBED_REGISTRY } from '@/lib/embedRegistry';
import { TOOLS } from '@/app/tools/toolsData';
import { EmbedResizeReporter } from '@/components/embeds/EmbedResizeReporter';

export const dynamic = 'force-dynamic';

export default function EmbedPage({ params }: { params: { slug: string } }) {
  const factory = EMBED_REGISTRY[params.slug];
  const tool = TOOLS.find(t => t.slug === params.slug);
  if (!factory || !tool) notFound();

  const Widget = factory();
  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://howlonguntilx.com';

  return (
    <div style={{ background: 'transparent', padding: '12px' }}>
      <EmbedResizeReporter />
      <Widget />
      <p style={{ fontSize: 11, textAlign: 'center', marginTop: 10, opacity: 0.6 }}>
        {tool.title}
        {' — powered by '}
        <a href={BASE} target="_blank" rel="noopener" style={{ color: 'inherit' }}>Until X</a>
      </p>
    </div>
  );
}
