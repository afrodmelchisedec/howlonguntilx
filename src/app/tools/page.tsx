// FILE: src/app/tools/page.tsx
import type { Metadata } from 'next';
import { getAffiliateBanner } from '@/lib/affiliateBanners';
import { AffiliateBanner } from '@/components/articles/AffiliateBanner';
import { ToolsGrid } from './ToolsGrid';
import { TOOLS } from './toolsData';

export const metadata: Metadata = {
  title: 'All Tools — HowLongUntilX',
  description: 'Every interactive tool on HowLongUntilX in one place — finance, food, health, culture, science, and time planning tools.',
};

export default async function ToolsPage() {
  const affiliateBanner = await getAffiliateBanner('tools');

  return (
    <div className="max-w-6xl mx-auto px-4 py-14">
      <div className="text-center mb-10 anim-fade-up">
        <p className="text-caption mb-2" style={{ color: 'rgb(var(--accent-brand))' }}>EXPLORE</p>
        <h1 className="text-title1 mb-2">All tools</h1>
        <p className="text-callout" style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
          {TOOLS.length} interactive tools, one click away.
        </p>
      </div>

      <ToolsGrid />

      {affiliateBanner && (
        <div className="mt-10 max-w-3xl mx-auto">
          <AffiliateBanner banner={affiliateBanner} glow="83, 74, 217" />
        </div>
      )}
    </div>
  );
}
