// FILE: src/components/articles/ArticleChart.tsx
export function ArticleChart({ title, data, glow }: { title: string; data: { label: string; value: number }[]; glow: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const width = 600;
  const leftPad = 170;  // room for labels — runs alongside the bar, never wraps or overlaps
  const rightPad = 56;  // room for the value label at the end of each bar
  const topPad = 12;
  const bottomPad = 12;
  const barH = 34, gap = 14;
  const barAreaW = width - leftPad - rightPad;
  const height = topPad + data.length * (barH + gap) - gap + bottomPad;

  return (
    <div className="article-glow-card ios-card-nested p-5 my-4" style={{ border: `1px solid rgba(${glow}, 0.25)` }}>
      <p className="text-footnote font-semibold mb-3">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={title}>
        {data.map((d, i) => {
          const w = (d.value / max) * barAreaW;
          const y = topPad + i * (barH + gap);
          return (
            <g
              key={d.label}
              className="article-bar article-bar-group"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <title>{`${d.label}: ${d.value}`}</title>
              <rect
                className="article-bar-rect"
                x={leftPad} y={y} width={w} height={barH} rx="6"
                fill={`rgb(${glow})`} opacity="0.85"
                style={{ transformOrigin: `${leftPad}px ${y + barH / 2}px` }}
              />
              <text x={leftPad - 10} y={y + barH / 2 + 4} textAnchor="end" fontSize="12" fill="var(--text-secondary)">{d.label}</text>
              <text x={leftPad + w + 8} y={y + barH / 2 + 4} textAnchor="start" fontSize="13" fontWeight="700" fill={`rgb(${glow})`}>{d.value}</text>
            </g>
          );
        })}
      </svg>
      <style>{`
        .article-bar-rect {
          transition: opacity 0.15s ease, filter 0.15s ease, transform 0.15s ease;
          cursor: pointer;
        }
        .article-bar-group:hover .article-bar-rect {
          opacity: 1;
          filter: drop-shadow(0 0 6px rgba(${glow}, 0.7));
          transform: scaleX(1.02);
        }
      `}</style>
    </div>
  );
}
