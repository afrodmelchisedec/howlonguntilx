// FILE: src/components/widgets/CountdownWidget.tsx
'use client';
import { useEffect, useState } from 'react';

export default function CountdownWidget({ config }: { config: { targetDate: string; label: string; accent?: string } }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const target = new Date(config.targetDate).getTime();
  const diff = Math.max(0, target - now);
  const d = Math.floor(diff / 86400000), h = Math.floor((diff / 3600000) % 24), m = Math.floor((diff / 60000) % 60), s = Math.floor((diff / 1000) % 60);
  const glow = config.accent ?? '162, 137, 255';

  return (
    <div className="ios-card-nested p-5 my-4 text-center anim-fade-up" style={{ border: `1px solid rgba(${glow}, 0.3)` }}>
      <p className="text-footnote font-semibold mb-2" style={{ color: `rgb(${glow})` }}>⏳ {config.label}</p>
      <div className="flex justify-center gap-3">
        {[['days', d], ['hrs', h], ['min', m], ['sec', s]].map(([label, val]) => (
          <div key={label as string}>
            <div className="text-title2 tabular">{val}</div>
            <div className="text-caption">{label}</div>
          </div>
        ))}
      </div>
      <a href="/tools/tech-events" className="text-caption underline mt-3 inline-block" style={{ color: `rgb(${glow})` }}>Save this to your watchlist →</a>
    </div>
  );
}
