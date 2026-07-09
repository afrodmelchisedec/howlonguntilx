// FILE: src/components/widgets/BortlePreviewWidget.tsx
'use client';

// Minimal placeholder — swap in a real mini Bortle-scale preview widget when
// Dark Sky Explorer articles are actually being written.
export default function BortlePreviewWidget({ config }: { config: { bortle?: number; label?: string } }) {
  const bortle = config.bortle ?? 4;
  const glow = '110, 231, 183';

  return (
    <div className="ios-card-nested p-5 my-4 text-center anim-fade-up" style={{ border: `1px solid rgba(${glow}, 0.3)` }}>
      <p className="text-footnote font-semibold mb-2" style={{ color: `rgb(${glow})` }}>🌌 {config.label ?? 'Bortle Preview'}</p>
      <p className="text-title2">Bortle {bortle}</p>
      <a href="/tools/dark-sky-explorer" className="text-caption underline mt-3 inline-block" style={{ color: `rgb(${glow})` }}>Explore your own sky →</a>
    </div>
  );
}
