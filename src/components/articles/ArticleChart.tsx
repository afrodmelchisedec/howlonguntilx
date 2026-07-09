// FILE: src/components/articles/ArticleChart.tsx
export function ArticleChart({ title, data, glow }: { title: string; data: { label: string; value: number }[]; glow: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = 80, gap = 24, chartH = 160, leftPad = 10;
  const width = data.length * (barW + gap) + leftPad;

  return (
    <div className="ios-card-nested p-5 my-4">
      <p className="text-footnote font-semibold mb-3">{title}</p>
      <svg viewBox={`0 0 ${width} ${chartH + 40}`} width="100%" role="img" aria-label={title}>
        {data.map((d, i) => {
          const h = (d.value / max) * chartH;
          const x = leftPad + i * (barW + gap);
          return (
            <g key={d.label}>
              <rect x={x} y={chartH - h} width={barW} height={h} rx="6" fill={`rgb(${glow})`} opacity="0.85" />
              <text x={x + barW / 2} y={chartH - h - 8} textAnchor="middle" fontSize="13" fontWeight="700" fill={`rgb(${glow})`}>{d.value}</text>
              <text x={x + barW / 2} y={chartH + 20} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
