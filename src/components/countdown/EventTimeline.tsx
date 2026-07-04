interface Props {
  items: { label: string; offset: string; note?: string }[];
}

export function EventTimeline({ items }: Props) {
  if (!items?.length) return null;
  return (
    <div className="ios-card p-6 text-left">
      <h2 className="text-title3 mb-4">Timeline</h2>
      <div className="relative pl-6">
        <div className="absolute left-[7px] top-1 bottom-1 w-px" style={{ background: 'var(--border-hairline)' }} />
        <div className="space-y-5">
          {items.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full" style={{ background: 'rgb(var(--accent-brand))' }} />
              <div className="text-headline">{item.offset}</div>
              <div className="text-callout" style={{ color: 'var(--text-secondary)' }}>{item.label}</div>
              {item.note && <div className="text-footnote mt-0.5">{item.note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
