import { DarkSkyExplorerTabs } from '@/components/pro-tools/DarkSkyExplorerTabs';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Dark Sky Explorer — Nature, Space & Sky',
  description: 'Drag a light-pollution slider to reveal a live starfield, browse a 30-night stargazing forecast, and track real meteor shower dates.',
};

export default function DarkSkyExplorerPage() {
  return (
    <div className="relative" style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <StarField />
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-caption mb-2" style={{ color: 'rgb(110, 231, 183)' }}>TRAVEL · NATURE, SPACE & SKY</p>
          <h1 className="text-largetitle mb-2">Dark Sky Explorer</h1>
          <p className="text-callout" style={{ color: 'var(--text-secondary)' }}>
            Drag toward dark. Watch the sky reveal itself. Plan the night that's actually worth it.
          </p>
        </div>
        <DarkSkyExplorerTabs />
      </div>
    </div>
  );
}
