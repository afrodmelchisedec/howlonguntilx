// FILE: src/components/articles/ArticleChart.tsx
export function ArticleChart({ title, data, glow }: { title: string; data: { label: string; value: number }[]; glow: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 80, gap = 24, chartH = 160, leftPad = 10;
  const topPad = 28;   // headroom above the tallest bar so its value label never clips
  const bottomPad = 40; // space for the x-axis label
  const width = data.length * (barW + gap) + leftPad;
  const height = topPad + chartH + bottomPad;
  const baseline = topPad + chartH;

  return (
    <div className="article-glow-card ios-card-nested p-5 my-4" style={{ border: `1px solid rgba(${glow}, 0.25)` }}>
      <p className="text-footnote font-semibold mb-3">{title}</p>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={title}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = leftPad + i * (barW + gap);
          return (
            <g
              key={d.label}
              className="article-bar article-bar-group"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <title>{`${d.label}: ${d.value}`}</title>
              <rect
                className="article-bar-rect"
                x={x} y={baseline - h} width={barW} height={h} rx="6"
                fill={`rgb(${glow})`} opacity="0.85"
                style={{ transformOrigin: `${x + barW / 2}px ${baseline}px` }}
              />
              <text x={x + barW / 2} y={baseline - h - 8} textAnchor="middle" fontSize="13" fontWeight="700" fill={`rgb(${glow})`}>{d.value}</text>
              <text x={x + barW / 2} y={baseline + 20} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{d.label}</text>
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
          transform: scaleY(1.02);
        }
      `}</style>
    </div>
  );
}
